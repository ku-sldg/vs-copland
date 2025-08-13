import XCTest
import SwiftTreeSitter
import TreeSitterCopland

final class TreeSitterCoplandTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_copland())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Copland grammar")
    }
}
