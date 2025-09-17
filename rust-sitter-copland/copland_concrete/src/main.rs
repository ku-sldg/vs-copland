use std::{io::Write, io::Read};
use std::fs::File;

use codemap::CodeMap;
use codemap_diagnostic::{ColorConfig, Diagnostic, Emitter, Level, SpanLabel, SpanStyle};
use rust_sitter::errors::{ParseError, ParseErrorReason};

use crate::copland_concrete::copland_concrete_to_ast;

mod copland_concrete;

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

/*
    let mut file = File::open("example.txt")?;
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;
    println!("File content:\n{}", contents);
    */



fn main() {
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
