// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import {
	assembleDetailed,
	disassembleDetailed,
	type AnalyzerOptions,
	type XLenMode,
	type XLen,
	type AssembleDetailedResult,
	type DisassembleDetailedResult
} from './backend';

const { l10n } = vscode;

type AnalyzerMode = 'assemble' | 'disassemble';

type XLenSelection = 'auto' | '32' | '64' | '128';

type FloatMode = 'disabled' | 'rvf' | 'rvd' | 'rvq' | 'auto';

type OutboundMessage =
	| { type: 'setInput'; value: string }
	| { type: 'result'; value: string }
	| { type: 'status'; value: 'idle' | 'running' }
	| { type: 'error'; value: string }
	| { type: 'info'; value: string }
	| { type: 'setXlen'; value: XLenSelection }
	| { type: 'setEmbedded'; value: boolean }
	| { type: 'setFloatMode'; value: FloatMode };

interface RunRequestMessage {
	type: 'run';
	input: string;
	mode: AnalyzerMode;
	xlen: XLenSelection;
	isEmbedded: boolean;
	floatMode: FloatMode;
}

interface CopyRequestMessage {
	type: 'copy';
	value: string;
}

interface SelectionRequestMessage {
	type: 'requestSelection';
}

interface UpdateXlenMessage {
	type: 'updateXlen';
	value: XLenSelection;
}

interface UpdateEmbeddedMessage {
	type: 'updateEmbedded';
	value: boolean;
}

interface UpdateFloatMessage {
	type: 'updateFloat';
	value: FloatMode;
}

type InboundMessage = RunRequestMessage | CopyRequestMessage | SelectionRequestMessage | UpdateXlenMessage | UpdateEmbeddedMessage | UpdateFloatMessage;

class RiscvAnalyzerViewProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = 'riscvAsmAnalyzer.view';

	private view?: vscode.WebviewView;
	private readonly pendingMessages: OutboundMessage[] = [];
	private resolveView?: () => void;
	private readonly viewReady: Promise<void>;
	private xlenMode: XLenSelection = 'auto';
	private isEmbedded: boolean = false;
	private floatMode: FloatMode = 'disabled';

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

		this.enqueueMessage({ type: 'setXlen', value: this.xlenMode });
		this.enqueueMessage({ type: 'setEmbedded', value: this.isEmbedded });
		this.enqueueMessage({ type: 'setFloatMode', value: this.floatMode });
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
			case 'run': {
				const xlenMode = normalizeXlenSelection(message.xlen);
				this.xlenMode = xlenMode;
				this.isEmbedded = message.isEmbedded;
				this.floatMode = message.floatMode;
				await this.handleRun(message.mode, message.input, xlenMode, message.isEmbedded, message.floatMode);
				break;
			}
			case 'copy':
				await this.handleCopy(message.value);
				break;
			case 'requestSelection':
				this.pushActiveSelection();
				break;
			case 'updateXlen':
				this.xlenMode = normalizeXlenSelection(message.value);
				break;
			case 'updateEmbedded':
				this.isEmbedded = message.value;
				break;
			case 'updateFloat':
				this.floatMode = message.value;
				break;
			default:
				break;
		}
	}

	private resolveFloatOptions(floatMode: FloatMode, input: string): { floatEnabled: boolean; doubleEnabled: boolean, quadEnabled: boolean } {
		switch (floatMode) {
			case 'disabled':
				return { floatEnabled: false, doubleEnabled: false, quadEnabled: false };
			case 'rvf':
				return { floatEnabled: true, doubleEnabled: false, quadEnabled: false };
			case 'rvd':
				return { floatEnabled: true, doubleEnabled: true, quadEnabled: false };
			case 'rvq':
				return { floatEnabled: true, doubleEnabled: true, quadEnabled: true };
			case 'auto':
				const hasSingle = /\bf\w+\.s\b/.test(input);
				const hasDouble = /\bf\w+\.d\b/.test(input);
				const hasQuad = /\bf\w+\.q\b/.test(input);
				return { floatEnabled: hasSingle || hasDouble || hasQuad, doubleEnabled: hasDouble || hasQuad, quadEnabled: hasQuad };
			default:
				return { floatEnabled: false, doubleEnabled: false, quadEnabled: false };
		}
	}

	private async handleRun(mode: AnalyzerMode, input: string, xlenMode: XLenSelection, isEmbedded: boolean, floatMode: FloatMode): Promise<void> {
		const { floatEnabled, doubleEnabled, quadEnabled } = this.resolveFloatOptions(floatMode, input);
		if (!input.trim()) {
			this.enqueueMessage({ type: 'error', value: l10n.t('Input is empty.') });
			return;
		}

		this.enqueueMessage({ type: 'status', value: 'running' });

		try {
			const result = await runAnalyzer(mode, input, xlenMode, isEmbedded, floatEnabled, doubleEnabled, quadEnabled);
			this.enqueueMessage({ type: 'result', value: result.output });
			this.enqueueMessage({
				type: 'info',
				value: buildSuccessMessage(mode, result.mode, result.detectedXlen)
			});
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
			.controls-row {
				display: flex;
				align-items: center;
				gap: 8px;
				flex-wrap: wrap;
			}
			.controls-row label {
				font-weight: 600;
			}
			select {
				padding: 4px 8px;
				border-radius: 4px;
				border: 1px solid var(--vscode-input-border);
				background: var(--vscode-input-background);
				color: var(--vscode-input-foreground);
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
			defaultError: l10n.t('An error occurred.'),
			xlenLabel: l10n.t('XLEN'),
			xlenOptionAuto: l10n.t('Auto-detect'),
			xlenOption32: l10n.t('32-bit'),
			xlenOption64: l10n.t('64-bit'),
			xlenOption128: l10n.t('128-bit'),
			xlenHint: l10n.t('Choose the register width for encoding and decoding.'),
			embeddedLabel: l10n.t('Embedded'),
			embeddedOptionStandard: l10n.t('Standard'),
			embeddedOptionEmbedded: l10n.t('Embedded'),
			embeddedHint: l10n.t('Choose whether to use embedded architecture (16 registers) or standard architecture (32 registers).'),
			floatLabel: l10n.t('Floating-Point Extension'),
			floatOptionDisabled: l10n.t('Disabled'),
			floatOptionRVF: l10n.t('Single-Precision (RVF)'),
			floatOptionRVD: l10n.t('Double-Precision (RVD)'),
			floatOptionRVQ: l10n.t('Quad-Precision (RVQ)'),
			floatOptionAuto: l10n.t('Auto-detect'),
			floatHint: l10n.t('Enable RISC-V Floating-Point Extensions (RVF/RVD/RVQ) instructions.')
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
			const xlenSelect = document.getElementById('xlenSelect');
			const embeddedSelect = document.getElementById('embeddedSelect');
			const floatSelect = document.getElementById('floatSelect');

			function setRunning(isRunning) {
				runButton.disabled = isRunning;
				copyButton.disabled = isRunning;
				clearButton.disabled = isRunning;
				xlenSelect.disabled = isRunning;
				embeddedSelect.disabled = isRunning;
				floatSelect.disabled = isRunning;
				runButton.textContent = isRunning ? strings.processingLabel : strings.runButtonLabel;
			}

			runButton.addEventListener('click', event => {
				event.preventDefault();
				const mode = event.altKey ? 'disassemble' : 'assemble';
				const isEmbedded = embeddedSelect.value === 'true';
				const floatMode = floatSelect.value;
				vscode.postMessage({ type: 'run', input: inputArea.value, mode, xlen: xlenSelect.value, isEmbedded, floatMode });
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

			xlenSelect.addEventListener('change', () => {
				vscode.postMessage({ type: 'updateXlen', value: xlenSelect.value });
			});

			embeddedSelect.addEventListener('change', () => {
				const isEmbedded = embeddedSelect.value === 'true';
				vscode.postMessage({ type: 'updateEmbedded', value: isEmbedded });
			});

			floatSelect.addEventListener('change', () => {
				const floatMode = floatSelect.value;
				vscode.postMessage({ type: 'updateFloat', value: floatMode });
			});

			inputArea.addEventListener('keydown', event => {
				if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
					event.preventDefault();
					const isEmbedded = embeddedSelect.value === 'true';
					const floatMode = floatSelect.value;
					vscode.postMessage({ type: 'run', input: inputArea.value, mode: 'assemble', xlen: xlenSelect.value, isEmbedded, floatMode });
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
					case 'setXlen':
						xlenSelect.value = message.value ?? 'auto';
						break;
					case 'setEmbedded':
						embeddedSelect.value = message.value ? 'true' : 'false';
						break;
					case 'setFloatMode':
						floatSelect.value = message.value ?? 'disabled';
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
			<div class="controls-row">
				<label for="xlenSelect">${escapeHtml(uiStrings.xlenLabel)}</label>
				<select id="xlenSelect">
					<option value="auto">${escapeHtml(uiStrings.xlenOptionAuto)}</option>
					<option value="32">${escapeHtml(uiStrings.xlenOption32)}</option>
					<option value="64">${escapeHtml(uiStrings.xlenOption64)}</option>
					<option value="128">${escapeHtml(uiStrings.xlenOption128)}</option>
				</select>
				<span class="hint">${escapeHtml(uiStrings.xlenHint)}</span>
			</div>
			<div class="controls-row">
				<label for="embeddedSelect">${escapeHtml(uiStrings.embeddedLabel)}</label>
				<select id="embeddedSelect">
					<option value="false">${escapeHtml(uiStrings.embeddedOptionStandard)}</option>
					<option value="true">${escapeHtml(uiStrings.embeddedOptionEmbedded)}</option>
				</select>
				<span class="hint">${escapeHtml(uiStrings.embeddedHint)}</span>
			</div>
			<div class="controls-row">
				<label for="floatSelect">${escapeHtml(uiStrings.floatLabel)}</label>
				<select id="floatSelect">
					<option value="disabled">${escapeHtml(uiStrings.floatOptionDisabled)}</option>
					<option value="rvf">${escapeHtml(uiStrings.floatOptionRVF)}</option>
					<option value="rvd">${escapeHtml(uiStrings.floatOptionRVD)}</option>
					<option value="rvq">${escapeHtml(uiStrings.floatOptionRVQ)}</option>
					<option value="auto">${escapeHtml(uiStrings.floatOptionAuto)}</option>
				</select>
				<span class="hint">${escapeHtml(uiStrings.floatHint)}</span>
			</div>
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

interface AnalyzerRunResult {
	output: string;
	detectedXlen: XLen;
	mode: XLenMode;
}

async function runAnalyzer(mode: AnalyzerMode, input: string, selection: XLenSelection, isEmbedded: boolean = false, floatEnabled: boolean = false, doubleEnabled: boolean = false, quadEnabled: boolean = false): Promise<AnalyzerRunResult> {
	const xlenMode = selectionToXLenMode(selection);
	const options: AnalyzerOptions = { xlen: xlenMode, isEmbedded, floatEnabled, doubleEnabled, quadEnabled };
	if (mode === 'assemble') {
		const result = assembleDetailed(input, options);
		return { output: result.output, detectedXlen: result.detectedXlen, mode: result.mode };
	}
	const result = disassembleDetailed(input, options);
	return { output: result.output, detectedXlen: result.detectedXlen, mode: result.mode };
}

function buildSuccessMessage(mode: AnalyzerMode, xlenMode: XLenMode, detectedXlen: XLen): string {
	const operation = mode === 'assemble' ? l10n.t('Assembly') : l10n.t('Disassembly');
	const detail =
		xlenMode === 'auto'
			? l10n.t('XLEN auto-detected as {0}', detectedXlen)
			: l10n.t('XLEN selection set to {0}', xlenMode);
	return l10n.t('{0} completed ({1}).', operation, detail);
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

function toErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}
	return typeof error === 'string' ? error : l10n.t('Unknown error.');
}

function selectionToXLenMode(selection: XLenSelection): XLenMode {
	switch (selection) {
		case '32':
			return 32;
		case '64':
			return 64;
		case '128':
			return 128;
		default:
			return 'auto';
	}
}

function normalizeXlenSelection(value: string): XLenSelection {
	switch (value) {
		case '32':
		case '64':
		case '128':
			return value;
		default:
			return 'auto';
	}
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