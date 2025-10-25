import { AnalyzerError } from './errors';
import { instructionsByOpcode, InstructionSpec, type XLenMode, type XLen } from './instruction-set';
import type { AnalyzerOptions, AnalyzerResultBase } from './analyzer-types';
import { formatRegister } from './registers';
import { parseNumericLiteral, signExtend } from './utils';

export interface DisassembleDetailedResult extends AnalyzerResultBase {
	lines: string[];
	output: string;
}

export function disassemble(source: string, options?: AnalyzerOptions): string {
	return disassembleDetailed(source, options).output;
}

export function disassembleDetailed(source: string, options?: AnalyzerOptions): DisassembleDetailedResult {
	const tokenizer = new MachineCodeTokenizer();
	const tokens = tokenizer.tokenize(source);
	const mode = options?.xlen ?? 'auto';
	const disassembler = new Disassembler(mode);
	const { lines, detectedXlen } = disassembler.disassemble(tokens);
	return {
		lines,
		output: lines.join('\n'),
		detectedXlen,
		mode
	};
}

class Disassembler {
	private readonly mode: XLenMode;
	private detectedXlen: XLen;

	constructor(mode: XLenMode) {
		this.mode = mode;
		this.detectedXlen = typeof mode === 'number' ? mode : 32;
	}

	public disassemble(tokens: MachineWordToken[]): { lines: string[]; detectedXlen: XLen } {
		const lines: string[] = [];
		for (const token of tokens) {
			lines.push(this.disassembleWord(token.value, token.line));
		}
		const detected = this.mode === 'auto' ? this.detectedXlen : (this.mode as XLen);
		return { lines, detectedXlen: detected };
	}

	private disassembleWord(word: number, line: number): string {
		const opcode = word & 0x7f;
		const candidates = instructionsByOpcode.get(opcode);
		if (!candidates || candidates.length === 0) {
			throw new AnalyzerError(`Unknown opcode 0x${opcode.toString(16)}`, line);
		}
		const filtered = candidates.filter(candidate => this.isInstructionAllowed(candidate));
		if (filtered.length === 0) {
			const required = Math.min(...candidates.map(spec => (spec.minXlen ?? 32)));
			if (typeof this.mode === 'number') {
				throw new AnalyzerError(
					`Instruction requires XLEN ≥ ${required}, but current mode is XLEN=${this.mode}`,
					line
				);
			}
			throw new AnalyzerError('Unsupported instruction encoding', line);
		}
		const spec = filtered.find(candidate => matchesSpec(candidate, word));
		if (!spec) {
			throw new AnalyzerError('Unsupported instruction encoding', line);
		}
		this.recordInstruction(spec);

		switch (spec.operandPattern) {
			case 'rd_rs1_rs2':
				return decodeRType(spec, word);
			case 'rd_rs1_imm12':
				return decodeIType(spec, word);
			case 'rd_mem':
				return decodeLoad(spec, word);
			case 'rs2_mem':
				return decodeStore(spec, word);
			case 'rs1_rs2_branch':
				return decodeBranch(spec, word);
			case 'rd_imm20':
				return decodeUType(spec, word);
			case 'rd_jump':
				return decodeJump(spec, word);
			case 'none':
				return decodeZeroOperand(spec);
			case 'fence':
				return decodeFence(spec, word);
			case 'rd_csr_rs1':
				return decodeCsrRegister(spec, word);
			case 'rd_csr_imm5':
				return decodeCsrImmediate(spec, word);
			case 'rd_rs1_imm6':
				return decodeIType(spec, word);
			default:
				throw new AnalyzerError(`Unhandled operand pattern for '${spec.name}'`, line);
		}
	}

	private isInstructionAllowed(spec: InstructionSpec): boolean {
		if (this.mode === 'auto') {
			return true;
		}
		const required = (spec.minXlen ?? 32) as XLen;
		return required <= this.mode;
	}

	private recordInstruction(spec: InstructionSpec): void {
		if (this.mode !== 'auto') {
			return;
		}
		const required = (spec.minXlen ?? 32) as XLen;
		if (required > this.detectedXlen) {
			this.detectedXlen = required;
		}
	}
}

interface MachineWordToken {
	value: number;
	line: number;
}

class MachineCodeTokenizer {
	public tokenize(source: string): MachineWordToken[] {
		const lines = source.split(/\r?\n/);
		const tokens: MachineWordToken[] = [];
		for (let i = 0; i < lines.length; i += 1) {
			const lineNumber = i + 1;
			const line = stripComment(lines[i]).trim();
			if (!line) {
				continue;
			}
			const parts = line
				.replace(/[,\t]/g, ' ')
				.split(' ')
				.map(part => part.trim())
				.filter(Boolean);
			for (const part of parts) {
				const value = this.parseMachineWord(part, lineNumber);
				tokens.push({ value, line: lineNumber });
			}
		}
		return tokens;
	}

	private parseMachineWord(token: string, line: number): number {
		let value: number;
		const normalized = token.replace(/_/g, '').toLowerCase();
		if (/^0x[0-9a-f]+$/.test(normalized)) {
			value = Number.parseInt(normalized.slice(2), 16);
		} else if (/^0b[01]+$/.test(normalized)) {
			value = Number.parseInt(normalized.slice(2), 2);
		} else if (/^[0-9a-f]{8}$/.test(normalized)) {
			value = Number.parseInt(normalized, 16);
		} else {
			value = parseNumericLiteral(normalized, line, 'machine word');
		}

		if (!Number.isFinite(value) || value < 0 || value > 0xffffffff) {
			throw new AnalyzerError(`Invalid machine word '${token}'`, line);
		}
		return value >>> 0;
	}
}

function stripComment(value: string): string {
	const indices: number[] = [];
	const hashIndex = value.indexOf('#');
	if (hashIndex >= 0) {
		indices.push(hashIndex);
	}
	const slashIndex = value.indexOf('//');
	if (slashIndex >= 0) {
		indices.push(slashIndex);
	}
	const semicolonIndex = value.indexOf(';');
	if (semicolonIndex >= 0) {
		indices.push(semicolonIndex);
	}
	if (indices.length === 0) {
		return value;
	}
	return value.slice(0, Math.min(...indices));
}

function matchesSpec(spec: InstructionSpec, word: number): boolean {
	const funct3 = (word >> 12) & 0x7;
	const funct7 = (word >> 25) & 0x7f;
	if (spec.funct3 !== undefined && spec.funct3 !== funct3) {
		return false;
	}
	if (spec.format === 'R' && spec.funct7 !== undefined && spec.funct7 !== funct7) {
		return false;
	}
	if (spec.format === 'I' && spec.funct7 !== undefined && spec.immBits && spec.immBits < 12) {
		// No current I-type encodings rely on funct7, provided for future-proofing.
		return spec.funct7 === funct7;
	}
	if (spec.fixedImmediate !== undefined) {
		const imm = (word >> 20) & 0xfff;
		if ((imm & ((1 << (spec.immBits ?? 12)) - 1)) !== (spec.fixedImmediate & ((1 << (spec.immBits ?? 12)) - 1))) {
			return false;
		}
	}
	return true;
}

function decodeRType(spec: InstructionSpec, word: number): string {
	const rd = (word >> 7) & 0x1f;
	const rs1 = (word >> 15) & 0x1f;
	const rs2 = (word >> 20) & 0x1f;
	return `${spec.name} ${formatRegister(rd)}, ${formatRegister(rs1)}, ${formatRegister(rs2)}`;
}

function decodeIType(spec: InstructionSpec, word: number): string {
	const rd = (word >> 7) & 0x1f;
	const rs1 = (word >> 15) & 0x1f;
	const immRaw = (word >> 20) & 0xfff;
	let imm: number;
	if (spec.immBits !== undefined && spec.immBits < 12) {
		const mask = (1 << spec.immBits) - 1;
		imm = immRaw & mask;
	} else if (spec.unsignedImmediate) {
		imm = immRaw;
	} else {
		imm = signExtend(immRaw, spec.immBits ?? 12);
	}
	return `${spec.name} ${formatRegister(rd)}, ${formatRegister(rs1)}, ${imm}`;
}

function decodeLoad(spec: InstructionSpec, word: number): string {
	const rd = (word >> 7) & 0x1f;
	const rs1 = (word >> 15) & 0x1f;
	const immRaw = (word >> 20) & 0xfff;
	const offset = signExtend(immRaw, 12);
	return `${spec.name} ${formatRegister(rd)}, ${offset}(${formatRegister(rs1)})`;
}

function decodeStore(spec: InstructionSpec, word: number): string {
	const rs2 = (word >> 20) & 0x1f;
	const rs1 = (word >> 15) & 0x1f;
	const immRaw = ((word >> 25) << 5) | ((word >> 7) & 0x1f);
	const offset = signExtend(immRaw, 12);
	return `${spec.name} ${formatRegister(rs2)}, ${offset}(${formatRegister(rs1)})`;
}

function decodeBranch(spec: InstructionSpec, word: number): string {
	const rs1 = (word >> 15) & 0x1f;
	const rs2 = (word >> 20) & 0x1f;
	const imm12 = (word >> 31) & 0x1;
	const imm11 = (word >> 7) & 0x1;
	const imm10_5 = (word >> 25) & 0x3f;
	const imm4_1 = (word >> 8) & 0xf;
	let imm = (imm12 << 12) | (imm11 << 11) | (imm10_5 << 5) | (imm4_1 << 1);
	imm = signExtend(imm, 13);
	return `${spec.name} ${formatRegister(rs1)}, ${formatRegister(rs2)}, ${imm}`;
}

function decodeUType(spec: InstructionSpec, word: number): string {
	const rd = (word >> 7) & 0x1f;
	const imm = signExtend(word >> 12, spec.immBits ?? 20);
	return `${spec.name} ${formatRegister(rd)}, ${imm}`;
}

function decodeJump(spec: InstructionSpec, word: number): string {
	const rd = (word >> 7) & 0x1f;
	const imm20 = (word >> 31) & 0x1;
	const imm10_1 = (word >> 21) & 0x3ff;
	const imm11 = (word >> 20) & 0x1;
	const imm19_12 = (word >> 12) & 0xff;
	let imm = (imm20 << 20) | (imm19_12 << 12) | (imm11 << 11) | (imm10_1 << 1);
	imm = signExtend(imm, spec.immBits ?? 21);
	return `${spec.name} ${formatRegister(rd)}, ${imm}`;
}

function decodeZeroOperand(spec: InstructionSpec): string {
	return spec.name;
}

function decodeFence(spec: InstructionSpec, word: number): string {
	const imm = (word >> 20) & 0xfff;
	const pred = imm & 0xf;
	const succ = (imm >> 4) & 0xf;
	const fm = (imm >> 8) & 0x7;
	const predStr = formatFenceMask(pred);
	const succStr = formatFenceMask(succ);
	if (pred === 0xf && succ === 0xf && fm === ((spec.fixedImmediate ?? 0) >> 8)) {
		return `${spec.name}`;
	}
	return `${spec.name} ${predStr}, ${succStr}`;
}

function formatFenceMask(mask: number): string {
	if (mask === 0) {
		return '0';
	}
	const symbols: [number, string][] = [
		[0x8, 'i'],
		[0x4, 'o'],
		[0x2, 'r'],
		[0x1, 'w']
	];
	let result = '';
	for (const [bit, label] of symbols) {
		if ((mask & bit) !== 0) {
			result += label;
		}
	}
	return result;
}

function decodeCsrRegister(spec: InstructionSpec, word: number): string {
	const rd = (word >> 7) & 0x1f;
	const rs1 = (word >> 15) & 0x1f;
	const csr = (word >> 20) & 0xfff;
	return `${spec.name} ${formatRegister(rd)}, 0x${csr.toString(16)}, ${formatRegister(rs1)}`;
}

function decodeCsrImmediate(spec: InstructionSpec, word: number): string {
	const rd = (word >> 7) & 0x1f;
	const zimm = (word >> 15) & 0x1f;
	const csr = (word >> 20) & 0xfff;
	return `${spec.name} ${formatRegister(rd)}, 0x${csr.toString(16)}, ${zimm}`;
}
