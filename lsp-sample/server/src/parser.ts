import Parser = require('tree-sitter');
import Copland = require('tree-sitter-copland');

const parser = new Parser();
parser.setLanguage(Copland);

// Parse text using TreeSitter parser
export function parse(text: string) {
  return parser.parse(text);
}

// Locate error nodes in parse tree
export function findErrors(node: Parser.SyntaxNode, errors: Parser.SyntaxNode[] = []): Parser.SyntaxNode[] {
  if (node.type === "ERROR") {
    errors.push(node);
  }

  for (let i = 0; i < node.namedChildCount; i++) {
    const child = node.namedChild(i);
    if (child) {
      findErrors(child, errors);
    }
  }

  return errors;
}

// Convert error nodes to diagnostics
export function toDiagnostic(errorNode: Parser.SyntaxNode): import('vscode-languageserver').Diagnostic {
  const start = errorNode.startPosition;
  const end = errorNode.endPosition;
  return {
    range: {
      start: { line: start.row, character: start.column },
      end: { line: end.row, character: end.column },
    },
    severity: 1,
    source: "copland-parser",
    message: "Syntax error",
  };
}
