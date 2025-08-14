package tree_sitter_copland_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_copland "github.com/tree-sitter/tree-sitter-copland/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_copland.Language())
	if language == nil {
		t.Errorf("Error loading Copland grammar")
	}
}
