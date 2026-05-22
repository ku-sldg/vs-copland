# vs-copland

A VS Code extension for the Copland language.

## Features

- Syntax highlighting for `.cop` files
- Syntax and rust-sitter diagnostics

## Usage

Open any `.cop` file, syntax errors will be underlined in red automatically and updated upon saving

## Current Build Instructions
1. Clone the vs-copland repo, pull down the apk/rs-integration branch
2. In the main vs-copland directory, run `npm install`
3. Navigate to Rust project dir
`cd rust-sitter-copland/copland_concrete`
4. Compile Rust parser binary
`cargo build --release`
5. Return to project root
`cd ../..`
6. Create folder for binary to be placed prior to packaging
`mkdir bin`
7. Copy compiled binary into that folder to be bundled into .vsix
`cp rust-sitter-copland/copland_concrete/target/release/copland-concrete bin/`
8. Bundle extension and binary into .vsix file
`npm run package`
9. Install packaged extension
`code --install-extension vs-copland-0.0.1.vsix`
10. Restart VSCode and open a .cop file to test