use std::{io::Write, io::Read};
use std::fs::File;

use codemap::CodeMap;
use codemap_diagnostic::{ColorConfig, Diagnostic, Emitter, Level, SpanLabel, SpanStyle};
use rust_sitter::errors::{ParseError, ParseErrorReason};
use serde::Serialize;

use crate::copland_concrete::copland_concrete_to_ast;

mod copland_concrete;

#[derive(Serialize)]
struct ParseErrorOutput {
    start: usize,
    end: usize,
    message: String,
}

#[derive(Serialize)]
struct PipeOutput {
    ok: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    errors: Option<Vec<ParseErrorOutput>>,
}

fn flatten_errors(error: &ParseError, out: &mut Vec<ParseErrorOutput>) {
    match &error.reason {
        ParseErrorReason::MissingToken(tok) =>
            out.push(ParseErrorOutput { start: error.start, end: error.end,
                message: format!("Missing token: \"{tok}\"") }),
        ParseErrorReason::UnexpectedToken(tok) =>
            out.push(ParseErrorOutput { start: error.start, end: error.end,
                message: format!("Unexpected token: \"{tok}\"") }),
        ParseErrorReason::FailedNode(errors) => {
            if errors.is_empty() {
                out.push(ParseErrorOutput { start: error.start, end: error.end,
                    message: "Failed to parse node".to_string() });
            } else {
                for e in errors { flatten_errors(e, out); }
            }
        }
    }
}

fn run_pipe_mode() {
    let mut text = String::new();
    std::io::stdin().read_to_string(&mut text).unwrap();

    let output = match copland_concrete::grammar::parse(&text) {
        Ok(_) => PipeOutput { ok: true, errors: None },
        Err(errs) => {
            let mut flat = vec![];
            for e in &errs { flatten_errors(e, &mut flat); }
            PipeOutput { ok: false, errors: Some(flat) }
        }
    };

    println!("{}", serde_json::to_string(&output).unwrap());
}

fn convert_parse_error_to_diagnostics(
    file_span: &codemap::Span,
    error: &ParseError,
    diagnostics: &mut Vec<Diagnostic>,
) {
    match &error.reason {
        ParseErrorReason::MissingToken(tok) => diagnostics.push(Diagnostic {
            level: Level::Error,
            message: format!("Missing token: \"{tok}\""),
            code: Some("S000".to_string()),
            spans: vec![SpanLabel {
                span: file_span.subspan(error.start as u64, error.end as u64),
                style: SpanStyle::Primary,
                label: Some(format!("missing \"{tok}\"")),
            }],
        }),

        ParseErrorReason::UnexpectedToken(tok) => diagnostics.push(Diagnostic {
            level: Level::Error,
            message: format!("Unexpected token: \"{tok}\""),
            code: Some("S000".to_string()),
            spans: vec![SpanLabel {
                span: file_span.subspan(error.start as u64, error.end as u64),
                style: SpanStyle::Primary,
                label: Some(format!("unexpected \"{tok}\"")),
            }],
        }),

        ParseErrorReason::FailedNode(errors) => {
            if errors.is_empty() {
                diagnostics.push(Diagnostic {
                    level: Level::Error,
                    message: "Failed to parse node".to_string(),
                    code: Some("S000".to_string()),
                    spans: vec![SpanLabel {
                        span: file_span.subspan(error.start as u64, error.end as u64),
                        style: SpanStyle::Primary,
                        label: Some("failed".to_string()),
                    }],
                })
            } else {
                for error in errors {
                    convert_parse_error_to_diagnostics(file_span, error, diagnostics);
                }
            }
        }
    }
}

fn run_repl_mode() {
    let stdin = std::io::stdin();

    loop {
        print!("\nEnter input filename (i.e. my_term.cop): ");
        std::io::stdout().flush().unwrap();

        let mut input_filename = String::new();
        stdin.read_line(&mut input_filename).unwrap();
        let input_filename = input_filename.trim();
        if input_filename.is_empty() {
            break;
        }

        print!("Enter output filename (i.e. my_term.json): ");
        std::io::stdout().flush().unwrap();

        let mut output_filename = String::new();
        stdin.read_line(&mut output_filename).unwrap();
        let output_filename = output_filename.trim();
        if output_filename.is_empty() {
            break;
        }

        let mut file = File::open(input_filename).unwrap();
        let mut contents = String::new();
        file.read_to_string(&mut contents).unwrap();
        print!("\nSuccessfully read file contents from file: {}\n\n", input_filename);

        match copland_concrete::grammar::parse(&contents) {
            Ok(expr) => {

                println!("CST Expression:\n{expr:?}\n");

                let ast_expr = copland_concrete_to_ast(expr);
                println!("AST Expression:\n{ast_expr:?}\n");

                let ast_expr_json = serde_json::to_string(&ast_expr).unwrap();
                println!("AST Expression JSON:\n{ast_expr_json}\n");

                let mut file = File::create(output_filename).unwrap();
                file.write_all(ast_expr_json.as_bytes()).unwrap();
                println!("Successfully wrote JSON AST to file: {}\n", output_filename);
            }
            Err(errs) => {
                let mut codemap = CodeMap::new();
                let file_span = codemap.add_file("<input>".to_string(), contents.to_string());
                let mut diagnostics = vec![];
                for error in errs {
                    convert_parse_error_to_diagnostics(&file_span.span, &error, &mut diagnostics);
                }

                let mut emitter = Emitter::stderr(ColorConfig::Always, Some(&codemap));
                emitter.emit(&diagnostics);
            }
        };
    }
}

fn main() {
    let args: Vec<String> = std::env::args().collect();
    if args.get(1).map(|s| s.as_str()) == Some("--pipe") {
        run_pipe_mode();
    } else {
        run_repl_mode();
    }
}
