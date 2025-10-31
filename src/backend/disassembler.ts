import { AnalyzerError } from './errors';
import { instructionsByOpcode, InstructionSpec, type XLenMode, type XLen } from './instruction-set';
import type { AnalyzerOptions, AnalyzerResultBase } from './analyzer-types';
import { formatRegister, formatFloatRegister, formatVectorRegister } from './registers';
import { parseNumericLiteral, signExtend, formatNumber } from './utils';

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
	const numberBase = options?.numberBase ?? 'hex';
	const disassembler = new Disassembler(mode, numberBase);
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
	public readonly numberBase: 'hex' | 'dec';

	constructor(mode: XLenMode, numberBase: 'hex' | 'dec') {
		this.mode = mode;
		this.detectedXlen = typeof mode === 'number' ? mode : 32;
		this.numberBase = numberBase;
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
		// Check if it's a compressed instruction (16-bit)
		if ((word & 0x3) !== 0x3) {
			return this.disassembleCompressedWord(word, line);
		}

		// 32-bit instruction
		const opcode = word & 0x7f;
		const candidates = instructionsByOpcode.get(opcode);
		if (!candidates || candidates.length === 0) {
			throw new AnalyzerError(`Unknown opcode ${formatNumber(opcode)}`, line);
		}
		const filtered = candidates.filter(candidate => this.isInstructionAllowed(candidate))
			.sort((a, b) => (b.minXlen ?? 32) - (a.minXlen ?? 32));
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
			case 'rd_rs1':
				return spec.format === 'I' ? decodeIType.call(this, spec, word) : decodeRType(spec, word);
			case 'rd_rs1_imm12':
				return decodeIType.call(this, spec, word);
			case 'rd_mem':
				return decodeLoad.call(this, spec, word);
			case 'rs2_mem':
				return decodeStore.call(this, spec, word);
			case 'rs1_rs2_branch':
				return decodeBranch.call(this, spec, word);
			case 'rd_imm20':
				return decodeUType.call(this, spec, word);
			case 'rd_jump':
				return decodeJump.call(this, spec, word);
			case 'none':
				return decodeZeroOperand(spec);
			case 'fence':
				return decodeFence(spec, word);
			case 'rd_csr_rs1':
				return decodeCsrRegister.call(this, spec, word);
			case 'rd_csr_imm5':
				return decodeCsrImmediate.call(this, spec, word);
			case 'rd_rs1_imm6':
				return decodeIType.call(this, spec, word);
			case 'fd_rs1':
				return decodeFloatIType.call(this, spec, word);
			case 'fs2_fs1_rs1':
				return decodeFloatSType.call(this, spec, word);
			case 'fd_fs1_fs2':
			case 'fd_fs1':
			case 'fd_rs1':
			case 'rd_fs1':
			case 'rd_fs1_fs2':
				return decodeFloatRType(spec, word);
			case 'fd_fs1_fs2_fs3':
				return decodeFloatR4Type(spec, word);
			case 'vd_vs1_vs2':
			case 'vd_vs1_vs2_vm':
			case 'vd_vs1_rs2':
			case 'vd_vs1_rs2_vm':
			case 'vd_vs1_imm':
			case 'vd_vs1_imm_vm':
			case 'vd_rs1':
			case 'vd_rs1_vm':
			case 'vd_vs1':
			case 'vd_vs1_vm':
				return decodeVType.call(this, spec, word);
			case 'vd_mem':
				return decodeVLoad.call(this, spec, word);
			case 'vs_mem':
				return decodeVStore.call(this, spec, word);
			default:
				throw new AnalyzerError(`Unhandled operand pattern for '${spec.name}'`, line);
		}
	}

	private disassembleCompressedWord(word: number, line: number): string {
		// Compressed instructions use different opcode encoding
		const opcode = word & 0x3; // Low 2 bits
		const funct3 = (word >> 13) & 0x7; // Bits 15:13

		// For compressed instructions, we need to map to the full opcode
		let fullOpcode: number;
		switch (opcode) {
			case 0b00:
				fullOpcode = 0b00 | (funct3 << 2);
				break;
			case 0b01:
				fullOpcode = 0b01 | (funct3 << 2);
				break;
			case 0b10:
				fullOpcode = 0b10 | (funct3 << 2);
				break;
			default:
				throw new AnalyzerError('Invalid compressed instruction encoding', line);
		}

		const candidates = instructionsByOpcode.get(fullOpcode);
		if (!candidates || candidates.length === 0) {
			throw new AnalyzerError(`Unknown compressed opcode ${formatNumber(fullOpcode)}`, line);
		}
		const filtered = candidates.filter(candidate => this.isInstructionAllowed(candidate))
			.sort((a, b) => (b.minXlen ?? 32) - (a.minXlen ?? 32));
		if (filtered.length === 0) {
			throw new AnalyzerError('Unsupported compressed instruction encoding', line);
		}
		const spec = filtered.find(candidate => matchesCompressedSpec(candidate, word));
		if (!spec) {
			throw new AnalyzerError('Unsupported compressed instruction encoding', line);
		}
		this.recordInstruction(spec);

		switch (spec.operandPattern) {
			case 'rd_rs2':
				return decodeCRType(spec, word);
			case 'rd_rs1_nzimm6':
			case 'rd_nzimm6':
				return decodeCIType.call(this, spec, word);
			case 'rs2_nzimm6':
				return decodeCSSType.call(this, spec, word);
			case 'rd_nzuimm6':
				return decodeCIWType.call(this, spec, word);
			case 'rd_rs1_nzuimm6':
				return decodeCLType.call(this, spec, word);
			case 'rs2_rs1_nzuimm6':
				return decodeCSType.call(this, spec, word);
			case 'rd_rs1_rs2':
				return decodeCAType(spec, word);
			case 'rd_rs1_nzimm5':
			case 'rs1_nzimm5':
				return decodeCBType.call(this, spec, word);
			case 'rd_nzimm11':
				return decodeCJType.call(this, spec, word);
			case 'rs1':
				return decodeCRType(spec, word);
			case 'none':
				return decodeZeroOperand(spec);
			default:
				throw new AnalyzerError(`Unhandled compressed operand pattern for '${spec.name}'`, line);
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

function matchesCompressedSpec(spec: InstructionSpec, word: number): boolean {
	switch (spec.format) {
		case 'CR':
			return matchesCR(spec, word);
		case 'CI':
			return matchesCI(spec, word);
		case 'CSS':
			return matchesCSS(spec, word);
		case 'CIW':
			return matchesCIW(spec, word);
		case 'CL':
			return matchesCL(spec, word);
		case 'CS':
			return matchesCS(spec, word);
		case 'CA':
			return matchesCA(spec, word);
		case 'CB':
			return matchesCB(spec, word);
		case 'CJ':
			return matchesCJ(spec, word);
		default:
			return false;
	}
}

function matchesCR(spec: InstructionSpec, word: number): boolean {
	const funct4 = (word >> 12) & 0xf;
	return spec.funct4 === funct4;
}

function matchesCI(spec: InstructionSpec, word: number): boolean {
	const funct3 = (word >> 13) & 0x7;
	return spec.funct3 === funct3;
}

function matchesCSS(spec: InstructionSpec, word: number): boolean {
	const funct3 = (word >> 13) & 0x7;
	return spec.funct3 === funct3;
}

function matchesCIW(spec: InstructionSpec, word: number): boolean {
	const funct3 = (word >> 13) & 0x7;
	return spec.funct3 === funct3;
}

function matchesCL(spec: InstructionSpec, word: number): boolean {
	const funct3 = (word >> 13) & 0x7;
	return spec.funct3 === funct3;
}

function matchesCS(spec: InstructionSpec, word: number): boolean {
	const funct3 = (word >> 13) & 0x7;
	return spec.funct3 === funct3;
}

function matchesCA(spec: InstructionSpec, word: number): boolean {
	const funct6 = (word >> 10) & 0x3f;
	const funct2 = (word >> 5) & 0x3;
	return spec.funct6 === funct6 && spec.funct2 === funct2;
}

function matchesCB(spec: InstructionSpec, word: number): boolean {
	const funct3 = (word >> 13) & 0x7;
	const funct2 = (word >> 10) & 0x3;
	return spec.funct3 === funct3 && spec.funct2 === funct2;
}

function matchesCJ(spec: InstructionSpec, word: number): boolean {
	const funct3 = (word >> 13) & 0x7;
	return spec.funct3 === funct3;
}

function decodeRType(spec: InstructionSpec, word: number): string {
	const rd = (word >> 7) & 0x1f;
	const rs1 = (word >> 15) & 0x1f;
	const rs2 = (word >> 20) & 0x1f;

	if (spec.operandPattern === 'rd_rs1') {
		return `${spec.name} ${formatRegister(rd)}, ${formatRegister(rs1)}`;
	} else {
		return `${spec.name} ${formatRegister(rd)}, ${formatRegister(rs1)}, ${formatRegister(rs2)}`;
	}
}

function decodeFloatRType(spec: InstructionSpec, word: number): string {
	const fd = (word >> 7) & 0x1f;
	const fs1 = (word >> 15) & 0x1f;
	const fs2 = (word >> 20) & 0x1f;

	switch (spec.operandPattern) {
		case 'fd_fs1_fs2':
			return `${spec.name} ${formatFloatRegister(fd)}, ${formatFloatRegister(fs1)}, ${formatFloatRegister(fs2)}`;
		case 'fd_fs1':
			return `${spec.name} ${formatFloatRegister(fd)}, ${formatFloatRegister(fs1)}`;
		case 'fd_rs1':
			return `${spec.name} ${formatFloatRegister(fd)}, ${formatRegister(fs1)}`;
		case 'rd_fs1':
			return `${spec.name} ${formatRegister(fd)}, ${formatFloatRegister(fs1)}`;
		case 'rd_fs1_fs2':
			return `${spec.name} ${formatRegister(fd)}, ${formatFloatRegister(fs1)}, ${formatFloatRegister(fs2)}`;
		default:
			return `${spec.name} <unsupported float operands>`;
	}
}

function decodeFloatR4Type(spec: InstructionSpec, word: number): string {
	const fd = (word >> 7) & 0x1f;
	const fs1 = (word >> 15) & 0x1f;
	const fs2 = (word >> 20) & 0x1f;
	const fs3 = (word >> 27) & 0x1f;
	return `${spec.name} ${formatFloatRegister(fd)}, ${formatFloatRegister(fs1)}, ${formatFloatRegister(
		fs2
	)}, ${formatFloatRegister(fs3)}`;
}

function decodeFloatIType(this: Disassembler, spec: InstructionSpec, word: number): string {
	const fd = (word >> 7) & 0x1f;
	const rs1 = (word >> 15) & 0x1f;
	const imm = signExtend((word >> 20) & 0xfff, 12);
	return `${spec.name} ${formatFloatRegister(fd)}, ${formatNumber(imm, this.numberBase)}(${formatRegister(rs1)})`;
}

function decodeFloatSType(this: Disassembler, spec: InstructionSpec, word: number): string {
	const fs2 = (word >> 20) & 0x1f;
	const rs1 = (word >> 15) & 0x1f;
	const imm7 = (word >> 25) & 0x7f;
	const imm5 = (word >> 7) & 0x1f;
	const imm = signExtend((imm7 << 5) | imm5, 12);
	return `${spec.name} ${formatFloatRegister(fs2)}, ${formatNumber(imm, this.numberBase)}(${formatRegister(rs1)})`;
}

function decodeIType(this: Disassembler, spec: InstructionSpec, word: number): string {
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
	
	if (spec.fixedImmediate !== undefined) {
		// For instructions with fixed immediate, don't show the immediate
		return `${spec.name} ${formatRegister(rd)}, ${formatRegister(rs1)}`;
    	} else {
        	return `${spec.name} ${formatRegister(rd)}, ${formatRegister(rs1)}, ${formatNumber(imm, this.numberBase)}`;
    }
}

function decodeLoad(this: Disassembler, spec: InstructionSpec, word: number): string {
	const rd = (word >> 7) & 0x1f;
	const rs1 = (word >> 15) & 0x1f;
	const immRaw = (word >> 20) & 0xfff;
	const offset = signExtend(immRaw, 12);
	const isFloat = spec.format === 'FI';
	const rdStr = isFloat ? formatFloatRegister(rd) : formatRegister(rd);
	return `${spec.name} ${rdStr}, ${formatNumber(offset, this.numberBase)}(${formatRegister(rs1)})`;
}

function decodeStore(this: Disassembler, spec: InstructionSpec, word: number): string {
	const rs2 = (word >> 20) & 0x1f;
	const rs1 = (word >> 15) & 0x1f;
	const immRaw = ((word >> 25) << 5) | ((word >> 7) & 0x1f);
	const offset = signExtend(immRaw, 12);
	const isFloat = spec.format === 'FS';
	const rs2Str = isFloat ? formatFloatRegister(rs2) : formatRegister(rs2);
	return `${spec.name} ${rs2Str}, ${formatNumber(offset, this.numberBase)}(${formatRegister(rs1)})`;
}

function decodeBranch(this: Disassembler, spec: InstructionSpec, word: number): string {
	const rs1 = (word >> 15) & 0x1f;
	const rs2 = (word >> 20) & 0x1f;
	const imm12 = (word >> 31) & 0x1;
	const imm11 = (word >> 7) & 0x1;
	const imm10_5 = (word >> 25) & 0x3f;
	const imm4_1 = (word >> 8) & 0xf;
	let imm = (imm12 << 12) | (imm11 << 11) | (imm10_5 << 5) | (imm4_1 << 1);
	imm = signExtend(imm, 13);
	return `${spec.name} ${formatRegister(rs1)}, ${formatRegister(rs2)}, ${formatNumber(imm, this.numberBase)}`;
}

function decodeUType(this: Disassembler, spec: InstructionSpec, word: number): string {
	const rd = (word >> 7) & 0x1f;
	const imm = signExtend(word >> 12, spec.immBits ?? 20);
	return `${spec.name} ${formatRegister(rd)}, ${formatNumber(imm, this.numberBase)}`;
}

function decodeJump(this: Disassembler, spec: InstructionSpec, word: number): string {
	const rd = (word >> 7) & 0x1f;
	const imm20 = (word >> 31) & 0x1;
	const imm10_1 = (word >> 21) & 0x3ff;
	const imm11 = (word >> 20) & 0x1;
	const imm19_12 = (word >> 12) & 0xff;
	let imm = (imm20 << 20) | (imm19_12 << 12) | (imm11 << 11) | (imm10_1 << 1);
	imm = signExtend(imm, spec.immBits ?? 21);
	return `${spec.name} ${formatRegister(rd)}, ${formatNumber(imm, this.numberBase)}`;
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

function decodeCsrRegister(this: Disassembler, spec: InstructionSpec, word: number): string {
	const rd = (word >> 7) & 0x1f;
	const rs1 = (word >> 15) & 0x1f;
	const csr = (word >> 20) & 0xfff;
	return `${spec.name} ${formatRegister(rd)}, ${formatNumber(csr, this.numberBase)}, ${formatRegister(rs1)}`;
}

function decodeCsrImmediate(this: Disassembler, spec: InstructionSpec, word: number): string {
	const rd = (word >> 7) & 0x1f;
	const zimm = (word >> 15) & 0x1f;
	const csr = (word >> 20) & 0xfff;
	return `${spec.name} ${formatRegister(rd)}, ${formatNumber(csr, this.numberBase)}, ${formatNumber(zimm, this.numberBase)}`;
}

function decodeCRType(spec: InstructionSpec, word: number): string {
	const rd = (word >> 7) & 0x1f;
	const rs2 = (word >> 2) & 0x1f;
	if (spec.operandPattern === 'rd_rs2') {
		return `${spec.name} ${formatRegister(rd)}, ${formatRegister(rs2)}`;
	} else if (spec.operandPattern === 'rs1') {
		return `${spec.name} ${formatRegister(rd)}`;
	}
	return spec.name;
}

function decodeCIType(this: Disassembler, spec: InstructionSpec, word: number): string {
	const rd = (word >> 7) & 0x1f;
	const imm = signExtend(((word >> 2) & 0x1f) | ((word >> 12) & 0x1) << 5, 6);
	if (spec.operandPattern === 'rd_rs1_nzimm6') {
		return `${spec.name} ${formatRegister(rd)}, ${formatRegister(rd)}, ${formatNumber(imm, this.numberBase)}`;
	} else if (spec.operandPattern === 'rd_nzimm6') {
		return `${spec.name} ${formatRegister(rd)}, ${formatNumber(imm, this.numberBase)}`;
	}
	return spec.name;
}

function decodeCSSType(this: Disassembler, spec: InstructionSpec, word: number): string {
	const rs2 = (word >> 2) & 0x1f;
	const imm = ((word >> 7) & 0x3) | ((word >> 10) & 0xf) << 2;
	return `${spec.name} ${formatRegister(rs2)}, ${formatNumber(imm, this.numberBase)}`;
}

function decodeCIWType(this: Disassembler, spec: InstructionSpec, word: number): string {
	const rd = ((word >> 2) & 0x7) + 8;
	const imm = ((word >> 5) & 0x1) | ((word >> 6) & 0x3) << 1 | ((word >> 10) & 0x3) << 3 | ((word >> 12) & 0x1) << 5;
	return `${spec.name} ${formatRegister(rd)}, ${formatNumber(imm, this.numberBase)}`;
}

function decodeCLType(this: Disassembler, spec: InstructionSpec, word: number): string {
	const rd = ((word >> 2) & 0x7) + 8;
	const rs1 = ((word >> 7) & 0x7) + 8;
	const imm = ((word >> 5) & 0x1) | ((word >> 10) & 0x7) << 1;
	return `${spec.name} ${formatRegister(rd)}, ${formatNumber(imm, this.numberBase)}(${formatRegister(rs1)})`;
}

function decodeCSType(this: Disassembler, spec: InstructionSpec, word: number): string {
	const rs2 = ((word >> 2) & 0x7) + 8;
	const rs1 = ((word >> 7) & 0x7) + 8;
	const imm = ((word >> 5) & 0x1) | ((word >> 10) & 0x7) << 1;
	return `${spec.name} ${formatRegister(rs2)}, ${formatNumber(imm, this.numberBase)}(${formatRegister(rs1)})`;
}

function decodeCAType(spec: InstructionSpec, word: number): string {
	const rd = ((word >> 2) & 0x7) + 8;
	const rs2 = ((word >> 5) & 0x7) + 8;
	return `${spec.name} ${formatRegister(rd)}, ${formatRegister(rs2)}`;
}

function decodeCBType(this: Disassembler, spec: InstructionSpec, word: number): string {
	const rs1 = ((word >> 2) & 0x7) + 8;
	const imm = signExtend(((word >> 3) & 0x1) | ((word >> 5) & 0x3) << 1 | ((word >> 10) & 0x3) << 3 | ((word >> 12) & 0x1) << 5, 6);
	if (spec.operandPattern === 'rd_rs1_nzimm5') {
		return `${spec.name} ${formatRegister(rs1)}, ${formatRegister(rs1)}, ${formatNumber(imm, this.numberBase)}`;
	} else if (spec.operandPattern === 'rs1_nzimm5') {
		return `${spec.name} ${formatRegister(rs1)}, ${formatNumber(imm, this.numberBase)}`;
	}
	return spec.name;
}

function decodeCJType(this: Disassembler, spec: InstructionSpec, word: number): string {
	const imm = signExtend(
		((word >> 2) & 0x1) | ((word >> 3) & 0x7) << 1 | ((word >> 6) & 0x3) << 4 |
		((word >> 8) & 0x1) << 6 | ((word >> 9) & 0x3) << 7 | ((word >> 11) & 0x1) << 9 |
		((word >> 12) & 0x1) << 10, 11
	);
	return `${spec.name} ${formatNumber(imm, this.numberBase)}`;
}

function decodeVType(this: Disassembler, spec: InstructionSpec, word: number): string {
	const vd = (word >> 7) & 0x1f;
	const vs1 = (word >> 15) & 0x1f;
	const vs2 = (word >> 20) & 0x1f;
	const vm = (word >> 25) & 0x1;

	let operands = '';

	switch (spec.operandPattern) {
		case 'vd_vs1_vs2':
		case 'vd_vs1_vs2_vm':
			operands = `${formatVectorRegister(vd)}, ${formatVectorRegister(vs1)}, ${formatVectorRegister(vs2)}`;
			break;
		case 'vd_vs1_rs2':
		case 'vd_vs1_rs2_vm':
			operands = `${formatVectorRegister(vd)}, ${formatVectorRegister(vs1)}, ${formatRegister(vs2)}`;
			break;
		case 'vd_vs1_imm':
		case 'vd_vs1_imm_vm':
			const imm = signExtend(vs1, 5);
			operands = `${formatVectorRegister(vd)}, ${formatVectorRegister(vs1 >> 5 ? vs1 : 0)}, ${formatNumber(imm, this.numberBase)}`; // For imm, vs1 field contains immediate
			break;
		case 'vd_rs1':
		case 'vd_rs1_vm':
			operands = `${formatVectorRegister(vd)}, ${formatRegister(vs1)}`;
			break;
		case 'vd_vs1':
		case 'vd_vs1_vm':
			operands = `${formatVectorRegister(vd)}, ${formatVectorRegister(vs1)}`;
			break;
		default:
			return spec.name;
	}

	// Add mask suffix if masked operation
	if (spec.operandPattern.includes('_vm') && vm === 0) {
		operands += ', v0.t';
	}

	return `${spec.name} ${operands}`;
}

function decodeVLoad(this: Disassembler, spec: InstructionSpec, word: number): string {
	const vd = (word >> 7) & 0x1f;
	const rs1 = (word >> 15) & 0x1f;
	const imm = signExtend((word >> 20) & 0xfff, 12);
	return `${spec.name} ${formatVectorRegister(vd)}, ${formatNumber(imm, this.numberBase)}(${formatRegister(rs1)})`;
}

function decodeVStore(this: Disassembler, spec: InstructionSpec, word: number): string {
	const vs3 = (word >> 7) & 0x1f;
	const rs1 = (word >> 15) & 0x1f;
	const vs2 = (word >> 20) & 0x1f;
	const imm = signExtend(((word >> 25) & 0x7f) << 5 | vs3, 12);
	return `${spec.name} ${formatVectorRegister(vs2)}, ${formatNumber(imm, this.numberBase)}(${formatRegister(rs1)})`;
}

