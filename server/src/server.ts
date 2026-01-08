/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import {
	createConnection,
	TextDocuments,
	Diagnostic,
	DiagnosticSeverity,
	ProposedFeatures,
	InitializeParams,
	DidChangeConfigurationNotification,
	TextDocumentSyncKind,
	InitializeResult,
	DocumentDiagnosticReportKind,
	type DocumentDiagnosticReport
} from 'vscode-languageserver/node';

import {
	TextDocument
} from 'vscode-languageserver-textdocument';

import { parse, findErrors, toDiagnostic } from './parser';


import { Lexer } from "./lexer";
// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);
// Create a simple text document manager.
const documents = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;

connection.onInitialize((params: InitializeParams) => {
	const capabilities = params.capabilities;

	// Does the client support the `workspace/configuration` request?
	// If not, we fall back using global settings.
	hasConfigurationCapability = !!(
		capabilities.workspace && !!capabilities.workspace.configuration
	);
	hasWorkspaceFolderCapability = !!(
		capabilities.workspace && !!capabilities.workspace.workspaceFolders
	);
	hasDiagnosticRelatedInformationCapability = !!(
		capabilities.textDocument &&
		capabilities.textDocument.publishDiagnostics &&
		capabilities.textDocument.publishDiagnostics.relatedInformation
	);

	const result: InitializeResult = {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			// Tell the client that this server supports code completion.
			// completionProvider: {
			// 	resolveProvider: true
			// },
			diagnosticProvider: {
				interFileDependencies: false,
				workspaceDiagnostics: false
			}
		}
	};
	if (hasWorkspaceFolderCapability) {
		result.capabilities.workspace = {
			workspaceFolders: {
				supported: true
			}
		};
	}
	return result;
});

connection.onInitialized(() => {
	if (hasConfigurationCapability) {
		// Register for all configuration changes.
		connection.client.register(DidChangeConfigurationNotification.type, undefined);
	}
	if (hasWorkspaceFolderCapability) {
		connection.workspace.onDidChangeWorkspaceFolders(_event => {
			connection.console.log('Workspace folder change event received.');
		});
	}
});

connection.languages.diagnostics.on(async (params) => {
	const document = documents.get(params.textDocument.uri);
	if (document !== undefined) {
		return {
			kind: DocumentDiagnosticReportKind.Full,
			items: await addErrorUnderlines(document)
			//MOLLY THIS USED TO BE validateTextDocument
		} satisfies DocumentDiagnosticReport;
	} else {
		// We don't know the document. We can either try to read it from disk
		// or we don't report problems for it.
		return {
			kind: DocumentDiagnosticReportKind.Full,
			items: []
		} satisfies DocumentDiagnosticReport;
	}
});



interface CoplandDiagnostic extends Diagnostic {
	tokenText?: string;
}

async function addErrorUnderlines(textDocument: TextDocument): Promise<Diagnostic[]> {
	const text = textDocument.getText();
	const info: CoplandDiagnostic[] = [];
	Lexer.reset(text);
	let message = '';
	const categories = ["invalid_copy", "invalid_identifier_case", "invalid_null", "rcurly", "lcurly"];
	for (const token of Lexer) {
		if (token.type != undefined) {
			if (categories.includes(token.type)) {
				switch (token.type) {
					case "invalid_copy": {
						message = "Names cannot begin with underscore. Copy cannot be followed by anything other than a space, ), or ].";
						break;
					}
					case "invalid_identifier_case": {
						message = "Names cannot begin with capital letters.";
						break;
					}
					case "invalid_null": {
						message = "Null cannot contain any terms.";
						break;
					}
					case "rcurly": {
						message = "Curly brackets cannot be used for grouping/Invalid use of null.";
						break;
					}
					case "lcurly":{
						message = "Curly brackets cannot be used for grouping/Invalid use of null.";
						break;
					}
				}
				const problem: CoplandDiagnostic = {
					severity: DiagnosticSeverity.Error,
					range: {
						start: textDocument.positionAt(token.offset),
						end: textDocument.positionAt(token.offset+token.text.length)
					},
					message: message,
					source: 'ex',
					tokenText: token.text
				};
				if (hasDiagnosticRelatedInformationCapability) {
					problem.relatedInformation = [
						{
							location: {
								uri: textDocument.uri,
								range: Object.assign({}, problem.range)
							},
							message: "See Copland concrete syntax for more information."
						}
					];
				}
				console.log(problem.tokenText);
				info.push(problem);
			}
		}
	}
	const tree = parse(text);
  	const errors = findErrors(tree.rootNode);
	const diagnostics = errors.map(toDiagnostic);
	
	const seen = new Set<string>();
    const allDiagnostics = [...info, ...diagnostics];
    const filteredDiagnostics: Diagnostic[] = [];

	for (const diag of allDiagnostics) {
		const key = diagnosticKey(diag, (diag as CoplandDiagnostic).tokenText);
		if (!seen.has(key)) {
			seen.add(key);
			filteredDiagnostics.push(diag);
		}
	}

	function diagnosticKey(diag: Diagnostic, tokenText?: string): string {
		return [
			diag.range.start.line,
			diag.range.start.character,
			diag.range.end.line,
			diag.range.end.character,
			tokenText ?? ''
		].join(':');
	}


	return filteredDiagnostics;
}
///CURRENTLY: THIS WORKS WELL FOR OTHER ERRORS BUT IS A LITTLE FINIKY FOR THE BRACKETS!!!!

connection.onDidChangeWatchedFiles(_change => {
	// Monitored files have change in VSCode
	connection.console.log('We received a file change event');
});

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
