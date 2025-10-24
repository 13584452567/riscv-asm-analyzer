// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { spawn } from 'child_process';

const { l10n } = vscode;

type AnalyzerMode = 'assemble' | 'disassemble';

type OutboundMessage =
	| { type: 'setInput'; value: string }
	| { type: 'result'; value: string }
	| { type: 'status'; value: 'idle' | 'running' }
	| { type: 'error'; value: string }
	| { type: 'info'; value: string };

interface RunRequestMessage {
	type: 'run';
	input: string;
	mode: AnalyzerMode;
}

interface CopyRequestMessage {
	type: 'copy';
	value: string;
}

interface SelectionRequestMessage {
	type: 'requestSelection';
}

type InboundMessage = RunRequestMessage | CopyRequestMessage | SelectionRequestMessage;

class RiscvAnalyzerViewProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = 'riscvAsmAnalyzer.view';

	private view?: vscode.WebviewView;
	private readonly pendingMessages: OutboundMessage[] = [];
	private resolveView?: () => void;
	private readonly viewReady: Promise<void>;

	constructor(private readonly context: vscode.ExtensionContext) {
		this.viewReady = new Promise(resolve => {
			this.resolveView = resolve;
		});
	}

	public async reveal(preserveFocus = false): Promise<void> {
		await vscode.commands.executeCommand('workbench.view.extension.riscvAsmAnalyzer');
		await this.viewReady;
		this.view?.show?.(preserveFocus);
	}

	public setInput(value: string): void {
		this.enqueueMessage({ type: 'setInput', value });
	}

	public resolveWebviewView(webviewView: vscode.WebviewView): void {
		this.view = webviewView;
		this.resolveView?.();

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this.context.extensionUri]
		};
		webviewView.webview.html = this.buildHtml(webviewView.webview);

		webviewView.webview.onDidReceiveMessage(async message => {
			await this.handleMessage(message as InboundMessage);
		});

		while (this.pendingMessages.length > 0) {
			const message = this.pendingMessages.shift();
			if (message) {
				webviewView.webview.postMessage(message);
			}
		}
	}

	private enqueueMessage(message: OutboundMessage): void {
		if (this.view) {
			this.view.webview.postMessage(message);
		} else {
			this.pendingMessages.push(message);
		}
	}

	private async handleMessage(message: InboundMessage): Promise<void> {
		switch (message.type) {
			case 'run':
				await this.handleRun(message.mode, message.input);
				break;
			case 'copy':
				await this.handleCopy(message.value);
				break;
			case 'requestSelection':
				this.pushActiveSelection();
				break;
			default:
				break;
		}
	}

	private async handleRun(mode: AnalyzerMode, input: string): Promise<void> {
		if (!input.trim()) {
			this.enqueueMessage({ type: 'error', value: l10n.t('Input is empty.') });
			return;
		}

		this.enqueueMessage({ type: 'status', value: 'running' });

		try {
			const result = await runAnalyzer(mode, input);
			this.enqueueMessage({ type: 'result', value: result });
			this.enqueueMessage({ type: 'info', value: buildSuccessMessage(mode) });
		} catch (error) {
			const message = toErrorMessage(error);
			this.enqueueMessage({ type: 'error', value: message });
			const modeLabel = mode === 'assemble' ? l10n.t('assembly') : l10n.t('disassembly');
			vscode.window.showErrorMessage(l10n.t('RISC-V {0} failed: {1}', modeLabel, message));
		} finally {
			this.enqueueMessage({ type: 'status', value: 'idle' });
		}
	}

	private async handleCopy(value: string): Promise<void> {
		if (!value) {
			this.enqueueMessage({ type: 'info', value: l10n.t('Nothing to copy.') });
			return;
		}

		await vscode.env.clipboard.writeText(value);
		vscode.window.setStatusBarMessage(l10n.t('RISC-V analyzer output copied to clipboard.'), 1500);
	}

	private pushActiveSelection(): void {
		const activeText = getActiveSelectionText();
		if (typeof activeText === 'string' && activeText.length > 0) {
			this.setInput(activeText);
			return;
		}
		this.enqueueMessage({ type: 'info', value: l10n.t('No active editor selection to load.') });
	}

	private buildHtml(webview: vscode.Webview): string {
		const nonce = generateNonce();
		const styles = `
			:root {
				color-scheme: light dark;
				font-family: var(--vscode-font-family);
				font-size: var(--vscode-font-size);
			}
			body {
				margin: 0;
				padding: 12px;
				display: flex;
				flex-direction: column;
				gap: 12px;
				color: var(--vscode-foreground);
				background: var(--vscode-sideBar-background);
			}
			textarea {
				width: 100%;
				min-height: 120px;
				resize: vertical;
				font-family: var(--vscode-editor-font-family, monospace);
				font-size: var(--vscode-editor-font-size, 13px);
				color: var(--vscode-input-foreground);
				background: var(--vscode-input-background);
				border: 1px solid var(--vscode-input-border);
				border-radius: 4px;
				padding: 8px;
				box-sizing: border-box;
			}
			textarea[readonly] {
				background: var(--vscode-editor-background);
			}
			button {
				padding: 6px 12px;
				border-radius: 4px;
				border: 1px solid var(--vscode-button-border, transparent);
				background: var(--vscode-button-background);
				color: var(--vscode-button-foreground);
				font-weight: 600;
				cursor: pointer;
			}
			button:disabled {
				cursor: progress;
				opacity: 0.7;
			}
			.button-row {
				display: flex;
				gap: 8px;
				flex-wrap: wrap;
			}
			.status-line {
				min-height: 18px;
				color: var(--vscode-descriptionForeground);
			}
			.hint {
				font-size: 12px;
				color: var(--vscode-descriptionForeground);
			}
		`;

		const uiStrings = {
			inputHeading: l10n.t('Input'),
			loadSelectionLabel: l10n.t('Load active selection'),
			inputPlaceholder: l10n.t('Enter assembly or machine code...'),
			outputHeading: l10n.t('Output'),
			outputPlaceholder: l10n.t('Results appear here'),
			runButtonLabel: l10n.t('Assemble / Disassemble'),
			runButtonHint: l10n.t('Click to assemble. Hold Alt and click to disassemble.'),
			copyButtonLabel: l10n.t('Copy Output'),
			clearButtonLabel: l10n.t('Clear'),
			disassemblerHint: l10n.t('Alt+Click the main button to run the disassembler.'),
			clearedStatus: l10n.t('Cleared input and output.'),
			runningStatus: l10n.t('Running...'),
			processingLabel: l10n.t('Processing...'),
			defaultError: l10n.t('An error occurred.')
		};

		const scriptStrings = JSON.stringify({
			runButtonLabel: uiStrings.runButtonLabel,
			processingLabel: uiStrings.processingLabel,
			clearedStatus: uiStrings.clearedStatus,
			runningStatus: uiStrings.runningStatus,
			defaultError: uiStrings.defaultError
		});

		const script = `
			const strings = ${scriptStrings};
			const vscode = acquireVsCodeApi();
			const inputArea = document.getElementById('inputArea');
			const outputArea = document.getElementById('outputArea');
			const runButton = document.getElementById('runButton');
			const copyButton = document.getElementById('copyButton');
			const clearButton = document.getElementById('clearButton');
			const statusLine = document.getElementById('statusLine');

			function setRunning(isRunning) {
				runButton.disabled = isRunning;
				copyButton.disabled = isRunning;
				clearButton.disabled = isRunning;
				runButton.textContent = isRunning ? strings.processingLabel : strings.runButtonLabel;
			}

			runButton.addEventListener('click', event => {
				event.preventDefault();
				const mode = event.altKey ? 'disassemble' : 'assemble';
				vscode.postMessage({ type: 'run', input: inputArea.value, mode });
			});

			copyButton.addEventListener('click', event => {
				event.preventDefault();
				vscode.postMessage({ type: 'copy', value: outputArea.value });
			});

			clearButton.addEventListener('click', event => {
				event.preventDefault();
				inputArea.value = '';
				outputArea.value = '';
				statusLine.textContent = strings.clearedStatus;
			});

			inputArea.addEventListener('keydown', event => {
				if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
					event.preventDefault();
					vscode.postMessage({ type: 'run', input: inputArea.value, mode: 'assemble' });
				}
			});

			document.getElementById('loadSelectionLink').addEventListener('click', event => {
				event.preventDefault();
				vscode.postMessage({ type: 'requestSelection' });
			});

			window.addEventListener('message', event => {
				const message = event.data;
				switch (message.type) {
					case 'setInput':
						inputArea.value = message.value ?? '';
						break;
					case 'result':
						outputArea.value = message.value ?? '';
						break;
					case 'status':
						setRunning(message.value === 'running');
						if (message.value === 'running') {
							statusLine.textContent = strings.runningStatus;
						}
						break;
					case 'error':
						statusLine.textContent = message.value ?? strings.defaultError;
						break;
					case 'info':
						statusLine.textContent = message.value ?? '';
						break;
					default:
						break;
				}
			});

			setRunning(false);
		`;

		return `<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8" />
			<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';" />
			<meta name="viewport" content="width=device-width, initial-scale=1.0" />
			<style>${styles}</style>
		</head>
		<body>
			<section>
				<header>
					<h2>${escapeHtml(uiStrings.inputHeading)}</h2>
					<a href="#" id="loadSelectionLink" class="hint">${escapeHtml(uiStrings.loadSelectionLabel)}</a>
				</header>
				<textarea id="inputArea" placeholder="${escapeAttribute(uiStrings.inputPlaceholder)}"></textarea>
			</section>
			<section>
				<h2>${escapeHtml(uiStrings.outputHeading)}</h2>
				<textarea id="outputArea" placeholder="${escapeAttribute(uiStrings.outputPlaceholder)}" readonly></textarea>
			</section>
			<div class="button-row">
				<button id="runButton" title="${escapeAttribute(uiStrings.runButtonHint)}">${escapeHtml(uiStrings.runButtonLabel)}</button>
				<button id="copyButton">${escapeHtml(uiStrings.copyButtonLabel)}</button>
				<button id="clearButton">${escapeHtml(uiStrings.clearButtonLabel)}</button>
			</div>
			<div class="hint">${escapeHtml(uiStrings.disassemblerHint)}</div>
			<div id="statusLine" class="status-line"></div>
			<script nonce="${nonce}">${script}</script>
		</body>
		</html>`;
	}
}

export function activate(context: vscode.ExtensionContext): void {
	const provider = new RiscvAnalyzerViewProvider(context);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(RiscvAnalyzerViewProvider.viewType, provider)
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('riscv-asm-analyzer.openSidebar', async () => {
			await provider.reveal();
		})
	);

	context.subscriptions.push(
		vscode.commands.registerTextEditorCommand('riscv-asm-analyzer.loadSelection', async editor => {
			const selectionText = getActiveSelectionText(editor);
			if (!selectionText) {
				vscode.window.showWarningMessage(l10n.t('Select text in the active editor to send it to the RISC-V analyzer.'));
				return;
			}
			await provider.reveal(true);
			provider.setInput(selectionText);
		})
	);
}

export function deactivate(): void {}

async function runAnalyzer(mode: AnalyzerMode, input: string): Promise<string> {
	const config = vscode.workspace.getConfiguration('riscvAsmAnalyzer');
	const cliPath = (config.get<string>('cliPath') || '').trim();
	const additionalArgs = config.get<string[]>('defaultArgs') || [];

	if (!cliPath) {
		return buildCliPlaceholder(mode, input);
	}

	const args = [...additionalArgs];
	args.push(mode === 'assemble' ? '--assemble' : '--disassemble');

	return invokeCli(cliPath, args, input);
}

function buildSuccessMessage(mode: AnalyzerMode): string {
	return mode === 'assemble' ? l10n.t('Assembly completed.') : l10n.t('Disassembly completed.');
}

function buildCliPlaceholder(mode: AnalyzerMode, input: string): string {
	const hint = l10n.t("Configure '{0}' for real CLI execution.", 'riscvAsmAnalyzer.cliPath');
	const banner = mode === 'assemble' ? l10n.t('// Assemble placeholder output') : l10n.t('// Disassemble placeholder output');
	return `${banner}\n// ${hint}\n${input}`;
}

function getActiveSelectionText(editor: vscode.TextEditor | undefined = vscode.window.activeTextEditor): string | undefined {
	if (!editor) {
		return undefined;
	}
	const selection = editor.selection;
	if (!selection || selection.isEmpty) {
		const line = editor.document.lineAt(selection?.active ?? editor.selection.active);
		return line?.text ?? undefined;
	}
	return editor.document.getText(selection);
}

function invokeCli(executable: string, args: string[], input: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const child = spawn(executable, args, { shell: false });
		let stdout = '';
		let stderr = '';

		child.stdout.on('data', data => {
			stdout += data.toString();
		});

		child.stderr.on('data', data => {
			stderr += data.toString();
		});

		child.on('error', error => reject(error));

		child.on('close', code => {
			if (code === 0) {
				resolve(stdout.trim());
			} else {
				reject(new Error(stderr.trim() || l10n.t('CLI exited with code {0}', code)));
			}
		});

		if (input.length > 0) {
			child.stdin.write(input);
		}
		child.stdin.end();
	});
}

function toErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}
	return typeof error === 'string' ? error : l10n.t('Unknown error.');
}

function generateNonce(): string {
	const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	for (let i = 0; i < 32; i += 1) {
		result += charset.charAt(Math.floor(Math.random() * charset.length));
	}
	return result;
}

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

function escapeAttribute(value: string): string {
	return escapeHtml(value).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
