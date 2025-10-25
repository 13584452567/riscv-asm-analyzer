import * as fs from 'node:fs';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';
import type * as vscode from 'vscode';

export type AnalyzerMode = 'assemble' | 'disassemble';

export const ASSEMBLY_NOT_SUPPORTED_MESSAGE =
	'Assembly mode is not implemented yet. Provide machine code (hex or byte stream) or use Alt+Click for disassembly.';

export interface AnalyzerExecutionResult {
	effectiveMode: AnalyzerMode;
	output: string;
	infoMessages?: string[];
	didFallbackToDisassemble?: boolean;
}

interface WasmBindings {
	disassemble(input: string): string;
	disassemble_auto(input: string): string;
	disassemble_with_xlen(input: string, xlenBits: number): string;
}

interface NormalizedInstruction {
	formatted: string;
	original: string;
}

interface DisassemblyLine {
	instruction: NormalizedInstruction;
	decoded: string;
}

let extensionRoot: string | undefined;
let wasmBindingsPromise: Promise<WasmBindings> | undefined;

export function initializeAnalyzer(context: vscode.ExtensionContext): void {
	extensionRoot = context.extensionPath;
	wasmBindingsPromise = undefined;
}

export async function executeAnalyzer(mode: AnalyzerMode, input: string): Promise<AnalyzerExecutionResult> {
	const normalizedInput = normalizeWhitespace(input);
	if (!normalizedInput.trim()) {
		throw new Error('Provide at least one hexadecimal instruction.');
	}

	if (mode === 'assemble') {
		try {
			const instructions = parseMachineCodeInput(normalizedInput);
			const result = await disassembleInstructions(instructions);
			return {
				effectiveMode: 'disassemble',
				output: result.output,
				infoMessages: result.infoMessages,
				didFallbackToDisassemble: true
			};
		} catch (error) {
			throw new Error(ASSEMBLY_NOT_SUPPORTED_MESSAGE);
		}
	}

	const instructions = parseMachineCodeInput(normalizedInput);
	return disassembleInstructions(instructions);
}

async function disassembleInstructions(instructions: NormalizedInstruction[]): Promise<AnalyzerExecutionResult> {
	const bindings = await loadBindings();
	const lines: DisassemblyLine[] = instructions.map(instruction => {
		let decoded: string;
		try {
			decoded = bindings.disassemble_auto(instruction.formatted);
		} catch (error) {
			const message = serializeError(error);
			decoded = `Error: ${message}`;
		}
		return { instruction, decoded };
	});

	return {
		effectiveMode: 'disassemble',
		output: formatDisassembly(lines)
	};
}

async function loadBindings(): Promise<WasmBindings> {
	if (!extensionRoot) {
		throw new Error('Analyzer runtime is not initialized.');
	}
	if (!wasmBindingsPromise) {
		wasmBindingsPromise = loadBindingsFromDisk(extensionRoot);
	}
	return wasmBindingsPromise;
}

async function loadBindingsFromDisk(basePath: string): Promise<WasmBindings> {
	const wasmJsPath = path.join(basePath, 'Assets', 'wasm', 'wasm_riscv_online.js');
	if (!fs.existsSync(wasmJsPath)) {
		throw new Error(`Missing analyzer runtime at ${wasmJsPath}`);
	}

	ensureAlertStub();
	const moduleUrl = pathToFileURL(wasmJsPath).href;
	const imported = await import(moduleUrl);
	const bindings = (imported && typeof imported === 'object' && 'default' in imported
		? (imported as { default: WasmBindings }).default
		: (imported as WasmBindings));
	return bindings;
}

function ensureAlertStub(): void {
	const globalAny = globalThis as Record<string, unknown>;
	if (typeof globalAny.alert !== 'function') {
		globalAny.alert = () => undefined;
	}
}

function parseMachineCodeInput(input: string): NormalizedInstruction[] {
	const trimmed = input.trim();
	if (!trimmed) {
		throw new Error('Provide at least one hexadecimal instruction.');
	}

	if (isByteStreamInput(input)) {
		const instructions = parseByteStream(input);
		if (instructions.length === 0) {
			throw new Error('Byte stream input did not contain any complete instructions.');
		}
		return instructions.map(value => formatInstruction(value, undefined));
	}

	const lines = input.split('\n');
	const results: NormalizedInstruction[] = [];

	lines.forEach((line, index) => {
		const trimmedLine = line.trim();
		if (!trimmedLine) {
			return;
		}
		results.push(formatInstruction(trimmedLine, index + 1));
	});

	if (results.length === 0) {
		throw new Error('No hexadecimal instructions found in the input.');
	}

	return results;
}

function formatInstruction(value: string, lineNumber: number | undefined): NormalizedInstruction {
	const cleaned = value.trim();
	if (!/^(0x|0X)?[0-9a-fA-F]+$/.test(cleaned)) {
		const prefix = typeof lineNumber === 'number' ? `Line ${lineNumber}: ` : '';
		throw new Error(`${prefix}"${value}" is not a valid hexadecimal value.`);
	}

	let hex = cleaned.replace(/^0x/i, '');
	if (hex.length === 0) {
		const prefix = typeof lineNumber === 'number' ? `Line ${lineNumber}: ` : '';
		throw new Error(`${prefix}Encountered an empty value.`);
	}

	if (hex.length % 2 !== 0) {
		hex = `0${hex}`;
	}

	const numericValue = Number.parseInt(hex, 16);
	if (Number.isNaN(numericValue)) {
		const prefix = typeof lineNumber === 'number' ? `Line ${lineNumber}: ` : '';
		throw new Error(`${prefix}Unable to parse "${value}" as hexadecimal.`);
	}

	const isThirtyTwoBit = (numericValue & 0b11) === 0b11;
	const padded = isThirtyTwoBit ? hex.padStart(8, '0') : hex.padStart(4, '0');
	const formatted = `0x${padded.toUpperCase()}`;

	return { formatted, original: cleaned };
}

function isByteStreamInput(value: string): boolean {
	const normalized = normalizeWhitespace(value)
		.replace(/\r\n/g, '\n')
		.split('\n')
		.map(line => line.trim())
		.filter(Boolean)
		.join(' ');
	if (!normalized) {
		return false;
	}
	return /^([0-9a-fA-F]{2})(\s+[0-9a-fA-F]{2})*$/.test(normalized);
}

function parseByteStream(value: string): string[] {
	const tokens = normalizeWhitespace(value)
		.replace(/\r\n/g, '\n')
		.split(/\s+/)
		.filter(Boolean);

	if (tokens.length === 0) {
		return [];
	}

	const bytes = tokens.map(token => {
		if (!/^[0-9a-fA-F]{2}$/.test(token)) {
			throw new Error(`Illegal byte token: "${token}".`);
		}
		return token.toLowerCase();
	});

	const instructions: string[] = [];
	let index = 0;

	while (index < bytes.length) {
		if (index + 1 >= bytes.length) {
			throw new Error('Incomplete instruction: not enough bytes remaining.');
		}

		const low = Number.parseInt(bytes[index], 16);
		const high = Number.parseInt(bytes[index + 1], 16);
		const value16 = low | (high << 8);

		if ((value16 & 0x3) === 0x3) {
			if (index + 3 >= bytes.length) {
				throw new Error('Incomplete 32-bit instruction: not enough bytes remaining.');
			}
			const b2 = bytes[index + 2];
			const b3 = bytes[index + 3];
			const hex = (b3 + b2 + bytes[index + 1] + bytes[index]).toUpperCase();
			instructions.push(`0x${hex}`);
			index += 4;
		} else {
			const hex = (bytes[index + 1] + bytes[index]).toUpperCase();
			instructions.push(`0x${hex}`);
			index += 2;
		}
	}

	return instructions;
}

function formatDisassembly(lines: DisassemblyLine[]): string {
	if (lines.length === 0) {
		return '';
	}

	const width = Math.max(...lines.map(line => line.instruction.formatted.length));
	return lines
		.map(line => `${line.instruction.formatted.padEnd(width)}  ${line.decoded}`)
		.join('\n');
}

function normalizeWhitespace(value: string): string {
	return value.replace(/\r\n/g, '\n');
}

function serializeError(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}
	if (typeof error === 'string') {
		return error;
	}
	return 'Unknown error.';
}
