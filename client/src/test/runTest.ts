/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as path from 'path';
import * as fs from 'fs';

import { runTests } from '@vscode/test-electron';

async function main() {
	try {
		// The folder containing the Extension Manifest package.json
		// Passed to `--extensionDevelopmentPath`
		const extensionDevelopmentPath = path.resolve(__dirname, '../../../');

		// The path to test runner
		// Passed to --extensionTestsPath
		const extensionTestsPath = path.resolve(__dirname, './index');

		// Prefer a user-specified VS Code binary, otherwise fall back to common system installs.
		let vscodeExecutablePath = process.env.VSCODE_EXECUTABLE_PATH;
		if (vscodeExecutablePath) {
			console.log(`Using VS Code from VSCODE_EXECUTABLE_PATH: ${vscodeExecutablePath}`);
		} else {
			const candidates = ['/usr/bin/code-insiders', '/usr/bin/code'];
			for (const candidate of candidates) {
				if (fs.existsSync(candidate)) {
					vscodeExecutablePath = candidate;
					console.log(`Using system VS Code binary at ${candidate}`);
					break;
				}
			}
		}

		await runTests({ extensionDevelopmentPath, extensionTestsPath, vscodeExecutablePath });
	} catch (err) {
		console.error('Failed to run tests', err);
		process.exit(1);
	}
}

main();
