import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver';

export interface CoplandDiagnostic extends Diagnostic {
	tokenText?: string;
}

interface RustParseError { start: number; end: number; message: string; }
interface RustPipeOutput { ok: boolean; errors?: RustParseError[]; }

const BINARY_NAME = process.platform === 'win32' ? 'copland-concrete.exe' : 'copland-concrete';
const BUNDLED_PATH = path.join(__dirname, '..', '..', 'bin', BINARY_NAME);
const DEV_TARGET = process.env.CARGO_TARGET_DIR ||
	path.join(__dirname, '..', '..', 'rust-sitter-copland', 'copland_concrete', 'target');
const BINARY_PATH = fs.existsSync(BUNDLED_PATH)
	? BUNDLED_PATH
	: path.join(DEV_TARGET, 'release', BINARY_NAME);

function offsetToPosition(text: string, offset: number): { line: number; character: number } {
	const chunk = text.slice(0, Math.min(offset, text.length));
	const lines = chunk.split('\n');
	return { line: lines.length - 1, character: lines[lines.length - 1].length };
}

export async function parseWithRustSitter(text: string): Promise<CoplandDiagnostic[]> {
	return new Promise((resolve) => {
		const child = spawn(BINARY_PATH, ['--pipe'], { stdio: ['pipe', 'pipe', 'pipe'] });
		let stdout = '';

		child.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });

		child.on('error', (err: NodeJS.ErrnoException) => {
			if (err.code === 'ENOENT') {
				console.warn('[copland] Rust binary not found — run: cargo build --release in rust-sitter-copland/copland_concrete');
			}
			resolve([]);
		});

		child.on('close', () => {
			try {
				const result: RustPipeOutput = JSON.parse(stdout.trim());
				if (result.ok || !result.errors) { resolve([]); return; }
				resolve(result.errors.map(e => ({
					range: {
						start: offsetToPosition(text, e.start),
						end: offsetToPosition(text, e.end),
					},
					severity: DiagnosticSeverity.Error,
					source: 'copland-rust-parser',
					message: e.message,
				})));
			} catch {
				resolve([]);
			}
		});

		child.stdin.write(text);
		child.stdin.end();
	});
}
