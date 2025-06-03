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
	CompletionItem,
	CompletionItemKind,
	TextDocumentPositionParams,
	TextDocumentSyncKind,
	InitializeResult,
	DocumentDiagnosticReportKind,
	type DocumentDiagnosticReport
} from 'vscode-languageserver/node';

import {
	TextDocument
} from 'vscode-languageserver-textdocument';

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
			completionProvider: {
				resolveProvider: true
			},
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

// The example settings
interface ExampleSettings {
	maxNumberOfProblems: number;
}

// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
const defaultSettings: ExampleSettings = { maxNumberOfProblems: 1000 };
let globalSettings: ExampleSettings = defaultSettings;

// Cache the settings of all open documents
const documentSettings = new Map<string, Thenable<ExampleSettings>>();

connection.onDidChangeConfiguration(change => {
	if (hasConfigurationCapability) {
		// Reset all cached document settings
		documentSettings.clear();
	} else {
		globalSettings = (
			(change.settings.languageServerExample || defaultSettings)
		);
	}
	// Refresh the diagnostics since the `maxNumberOfProblems` could have changed.
	// We could optimize things here and re-fetch the setting first can compare it
	// to the existing setting, but this is out of scope for this example.
	connection.languages.diagnostics.refresh();
});

function getDocumentSettings(resource: string): Thenable<ExampleSettings> {
	if (!hasConfigurationCapability) {
		return Promise.resolve(globalSettings);
	}
	let result = documentSettings.get(resource);
	if (!result) {
		result = connection.workspace.getConfiguration({
			scopeUri: resource,
			section: 'languageServerExample'
		});
		documentSettings.set(resource, result);
	}
	return result;
}

// Only keep settings for open documents
documents.onDidClose(e => {
	documentSettings.delete(e.document.uri);
});


connection.languages.diagnostics.on(async (params) => {
	const document = documents.get(params.textDocument.uri);
	if (document !== undefined) {
		return {
			kind: DocumentDiagnosticReportKind.Full,
			items: await validateTextDocument(document)
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

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
	validateTextDocument(change.document);
});


interface CoplandToken {
	type: "phrase_operators"|'branch'|'inital_place'|'name'|'grouping'|'unknown';
	value: string;
	start: number;
	end: number;
}

export function tokenizeCoplandLine(line: string): CoplandToken[] {
    const tokens: CoplandToken[] = [];
    let position = -1;
    const parts = line.trim().split('');
	//console.log(parts);
	let spot = '';
	let prev = '';
	let start = 0;
	let end = 0;
	let is_a_comment = false;
	const branches = ['-<-','+<-','-<+','+<+','-~-','+~-','-~+','+~+'];
//think abt comments %????
	//ADD IN COUNTING TOMORROW!!!!!! dont forget to account for spaces
    for (const part of parts) {
		//maybe break if the first part is a % bc its a comment
		let newToken = false;
        let type: CoplandToken['type'] = 'unknown';
		position ++;
		if(part == "%"){
			is_a_comment = true;
		}
		if(spot == ''){
			newToken = true; //a new token is either the start of a file or the first expression after a space
		}
		if(newToken){
			if(/\s|\n|\t/.test(part)){
				start++;
			}else if (part == "_" && (prev == ' '||prev== '('||prev=='[')){
				spot+= part;
			}else if(/[A-Z]/.test(part) == false && /[a-z0-9]/.test(part) && prev != '_'){
				spot+= part;
				
			}else if(/[A-Z]/.test(part)){
				throw new SyntaxError('Names can not start with a capital letter');
			}else if(/\*|@|!|#|-|\+|{|\(|\[|\)|\]|%/.test(part)){
				spot+=part;
			}
		}
		else{
			//Molly remember to check that part was a space when assigning a type if it passes through the if statments
			if(spot.includes('%')){
				spot+= part;
			}else if(spot == "_" && (part == ' ' || part == ']' || part == ')')== false){
				throw new SyntaxError('names can not start with an underscore, and copy can not be followed by anything other than a space or ) ]');
			}else if(/[a-z0-9_A-Z]+/.test(spot) && /[a-zA-Z_0-9]/.test(part)){
				spot+=part;
			}else if(part == '>' && spot == '-'){
				spot+=part;
			}else if(/<|-|\+|~/.test(part)&& /-|<|~|\+/.test(spot)){
				spot+=part;
			}else if(spot == '{' && part== "}"){
				spot+= part;
			}else if(spot == '{' && part != '}'){
				throw new SyntaxError("Curly brackets can not contain anything in the language copland");
			}else if(/\)|\]/.test(part)){
				if(spot =="_"){
					type ='phrase_operators';
					end = position -1;
					tokens.push({type, value: spot, start,end});
					spot = part;
					start = position;
				}else if(/[a-zA-Z0-9_]+/.test(spot)){
					type = 'name';
					end = position -1;
					tokens.push({type, value:spot, start, end});
					spot = part;
					start = position;
				}
					//aditional checks here maybe???
			}
		}
		if(spot.includes("%") && part == '\n'){
			start = position+1;
			spot = '';
			is_a_comment = false;
		}else if(/\*/.test(spot)){
			type = 'inital_place';
			end = position;
			tokens.push({type, value:spot, start, end});
			prev = part;
			spot ="";
			start = end +1;
		}else if(/@|!|#/.test(spot)|| spot== '{}'||spot=='->'){
			type = 'phrase_operators';
			end = position;
			tokens.push({type, value:spot, start, end});
			prev = part;
			spot = '';
			start = end+1;
		}else if(/\(|\[|\)|\]/.test(spot)){
			type = 'grouping';
			end = position;
			tokens.push({type,value:spot,start, end});
			prev = part;
			spot='';
			start = end +1;
		}else if(spot =="_" && part == " "){
			type = 'phrase_operators';
			end = position -1;
			tokens.push({type, value: spot, start, end});
			prev = part;
			spot = '';
			start = position +1;
		}else if(part==','||part==":"){
			type = 'inital_place';
			end = position -1;
			tokens.push({type, value: spot, start, end});
			prev = part;
			spot ='';
			start = position +1;
		}else if(part==" " && /[a-zA-Z0-9_]+/.test(spot)&& is_a_comment == false){
			type ='name';
			end = position -1;
			tokens.push({type, value:spot, start,end});
			prev=part;
			spot='';
			start = position +1;
		}else if(branches.includes(spot)){
			type = 'branch';
			end = position;
			tokens.push({type, value:spot, start, end});
			prev = part;
			spot ='';
			start = position +1;
		}prev = part;
}return tokens;
//Remember to handle underscores and the -> function correctly!!!!!
///// MOLLY REMEMBER TO DOWNLOAD THE NPM STUFF LOOK AT VS CODE DOCUMENTATITON!!!!!
    }

async function validateTextDocument(textDocument: TextDocument): Promise<Diagnostic[]> {
	// In this simple example we get the settings for every validate run.
	const settings = await getDocumentSettings(textDocument.uri);

	// The validator creates diagnostics for all uppercase words length 2 and more
	const text = textDocument.getText();
	//console.log(text);
	//console.log('I am here');
	const values = tokenizeCoplandLine(text);
	console.log(values.length);
	for (const item of values){
		console.log(item);
	}
	const pattern = /\b[A-Z]{2,}\b/g;
	let m: RegExpExecArray | null;
//MOLLY THIS IS BROKEN FIX LATER FOR TESTING JSD:OGFJLDSKHJKFLSKDJF
	let problems = 0;
	const diagnostics: Diagnostic[] = [];
	while ((m = pattern.exec(text)) && problems < settings.maxNumberOfProblems) {
		problems++;
		const diagnostic: Diagnostic = {
			severity: DiagnosticSeverity.Warning,
			range: {
				start: textDocument.positionAt(m.index),
				end: textDocument.positionAt(m.index + m[0].length)
			},
			message: `${m[0]} starts with an uppercase.`,
			source: 'ex'
		};
		if (hasDiagnosticRelatedInformationCapability) {
			diagnostic.relatedInformation = [
				{
					location: {
						uri: textDocument.uri,
						range: Object.assign({}, diagnostic.range)
					},
					message: 'You can not start a place or symbol with an uppercase letter'
				},
				
			];
		}
		diagnostics.push(diagnostic);
	}
	return diagnostics;
}

connection.onDidChangeWatchedFiles(_change => {
	// Monitored files have change in VSCode
	connection.console.log('We received a file change event');
});

// This handler provides the initial list of the completion items.
connection.onCompletion(
	(_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
		// The pass parameter contains the position of the text document in
		// which code complete got requested. For the example we ignore this
		// info and always provide the same completion items.
		return [
			{
				label: 'TypeScript',
				kind: CompletionItemKind.Text,
				data: 1
			},
			{
				label: 'JavaScript',
				kind: CompletionItemKind.Text,
				data: 2
			}
		];
	}
);

// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve(
	(item: CompletionItem): CompletionItem => {
		if (item.data === 1) {
			item.detail = 'TypeScript details';
			item.documentation = 'TypeScript documentation';
		} else if (item.data === 2) {
			item.detail = 'JavaScript details';
			item.documentation = 'JavaScript documentation';
		}
		return item;
	}
);

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
