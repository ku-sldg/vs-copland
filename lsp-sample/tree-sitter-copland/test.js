const Parser = require('tree-sitter');
const Copland = require('./build/Release/tree_sitter_copland_binding');

const parser = new Parser();
parser.setLanguage(Copland);

const sourceCode = '*p0: @p1 [vc p1 vg]';
const tree = parser.parse(sourceCode);
const root = tree.rootNode;

function printTree(node, indent = 0) {
  const spacing = ' '.repeat(indent * 2);
  console.log(`${spacing}${node.type} -> "${node.text}"`);
  for (const child of node.children) {
    printTree(child, indent + 1);
  }
}

printTree(root);