import { AnalyzerError } from './errors';
import { instructionsByName, InstructionSpec, type XLenMode, type XLen } from './instruction-set';
import type { AnalyzerOptions, AnalyzerResultBase } from './analyzer-types';
import { parseRegister, parseFloatRegister, parseVectorRegister } from './registers';
import { formatHex, formatNumber, parseImmediate } from './utils';


export interface AssembleDetailedResult extends AnalyzerResultBase {
	output: string;
	words: number[];
}

export function assemble(source: string, options?: AnalyzerOptions): string {
	return assembleDetailed(source, options).output;
}

export function assembleDetailed(source: string, options?: AnalyzerOptions): AssembleDetailedResult {
	const mode = options?.xlen ?? 'auto';
	const isEmbedded = options?.isEmbedded ?? false;
	const assembler = new Assembler(mode, isEmbedded);
	const { words, detectedXlen } = assembler.assemble(source);
	return {
		output: words.map(w => formatNumber(w, options?.numberBase ?? 'hex')).join('\n'),
		words,
		detectedXlen,
		mode
	};
}

class Assembler {
	private readonly mode: XLenMode;
	private readonly isEmbedded: boolean;
	private detectedXlen: XLen;

	constructor(mode: XLenMode, isEmbedded: boolean = false) {
		this.mode = mode;
		this.isEmbedded = isEmbedded;
		this.detectedXlen = typeof mode === 'number' ? mode : 32;
	}

	public assemble(source: string): { words: number[]; detectedXlen: XLen } {
		const lines = source.split(/\r?\n/);
		const words: number[] = [];
		for (let i = 0; i < lines.length; i += 1) {
			const lineNumber = i + 1;
			const line = stripComment(lines[i]);
			if (!line.trim()) {
				continue;
			}
			const { mnemonic, operands } = parseLine(line, lineNumber);
			const produced = this.assembleInstructionOrPseudo(mnemonic, operands, lineNumber);
			for (const w of produced) {
				words.push(w >>> 0);
			}
		}
		const detected = this.mode === 'auto' ? this.detectedXlen : (this.mode as XLen);
		return { words, detectedXlen: detected };
	}

	private assembleInstructionOrPseudo(mnemonic: string, operands: string[], line: number): number[] {
		const spec = instructionsByName.get(mnemonic);
		if (spec) {
			return [this.assembleSingle(spec, operands, line) >>> 0];
		}

		// Try to expand as a pseudo-instruction
		const expanded = expandPseudo(mnemonic, operands, line, this.isEmbedded, this.mode, this.detectedXlen);
		if (!expanded) {
			throw new AnalyzerError(`Unsupported instruction '${mnemonic}'`, line);
		}
		const words: number[] = [];
		for (const inst of expanded) {
			const innerSpec = instructionsByName.get(inst.mnemonic);
			if (!innerSpec) {
				throw new AnalyzerError(`Internal error expanding pseudo '${mnemonic}' -> '${inst.mnemonic}'`, line);
			}
			words.push(this.assembleSingle(innerSpec, inst.operands, line) >>> 0);
		}
		return words;
	}

	private assembleSingle(spec: InstructionSpec, operands: string[], line: number): number {
		this.ensureSupportedXlen(spec, line);

		switch (spec.operandPattern) {
			case 'rd_rs1_rs2':
				return assembleRType(spec, operands, line, this.isEmbedded);
			case 'rd_rs1':
				return spec.format === 'I' ? assembleIType(spec, operands, line, this.isEmbedded) : assembleRType(spec, operands, line, this.isEmbedded);
			case 'rd_rs1_imm12':
				return assembleIType(spec, operands, line, this.isEmbedded);
			case 'rd_mem':
				return assembleLoad(spec, operands, line, this.isEmbedded);
			case 'rs2_mem':
				return assembleStore(spec, operands, line, this.isEmbedded);
			case 'rs1_rs2_branch':
				return assembleBranch(spec, operands, line, this.isEmbedded);
			case 'rd_imm20':
				return assembleUType(spec, operands, line, this.isEmbedded);
			case 'rd_jump':
				return assembleJump(spec, operands, line, this.isEmbedded);
			case 'none':
				return assembleZeroOperand(spec, operands, line);
			case 'fence':
				return assembleFence(spec, operands, line);
			case 'rd_csr_rs1':
				return assembleCsrRegister(spec, operands, line, this.isEmbedded);
			case 'rd_csr_imm5':
				return assembleCsrImmediate(spec, operands, line, this.isEmbedded);
			case 'rd_rs1_imm6':
				return assembleIType(spec, operands, line, this.isEmbedded);
			case 'fd_fs1_fs2':
			case 'fd_fs1':
			case 'fd_rs1':
			case 'rd_fs1':
			case 'rd_fs1_fs2':
				return assembleFloatRType(spec, operands, line);
			case 'fd_fs1_fs2_fs3':
				return assembleFloatR4Type(spec, operands, line);
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
				return assembleVType(spec, operands, line);
			case 'vd_mem':
				return assembleVLoad(spec, operands, line);
			case 'vs_mem':
				return assembleVStore(spec, operands, line);
			default:
				throw new AnalyzerError(`Unhandled operand pattern for '${spec.name}'`, line);
		}
	}

	private ensureSupportedXlen(spec: InstructionSpec, line: number): void {
		const required = (spec.minXlen ?? 32) as XLen;
		if (this.mode === 'auto') {
			if (required > this.detectedXlen) {
				this.detectedXlen = required;
			}
			return;
		}
		if (required > this.mode) {
			throw new AnalyzerError(
				`Instruction '${spec.name}' requires XLEN ≥ ${required}, but current mode is XLEN=${this.mode}`,
				line
			);
		}
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
	const end = Math.min(...indices);
	return value.slice(0, end);
}

function parseLine(line: string, lineNumber: number): { mnemonic: string; operands: string[] } {
	const normalized = line
		.replace(/[,\t]/g, ' ')
		.split(' ')
		.map(part => part.trim())
		.filter(Boolean);
	if (normalized.length === 0) {
		throw new AnalyzerError('Empty instruction.', lineNumber);
	}
	const [mnemonicRaw, ...operandTokens] = normalized;
	return {
		mnemonic: mnemonicRaw.toLowerCase(),
		operands: operandTokens
	};
}

function ensureOperandCount(operands: string[], expected: number, line: number, description: string): void {
	if (operands.length !== expected) {
		throw new AnalyzerError(`Expected ${expected} operand(s) for ${description}, received ${operands.length}`, line);
	}
}

function parseRegisterOperand(token: string, role: string, line: number, isEmbedded: boolean): number {
	try {
		return parseRegister(token, isEmbedded);
	} catch (error) {
		if (error instanceof AnalyzerError) {
			throw error;
		}
		throw new AnalyzerError(`Invalid ${role} register '${token}'`, line);
	}
}

function parseFloatRegisterOperand(token: string, role: string, line: number): number {
	try {
		return parseFloatRegister(token);
	} catch (error) {
		if (error instanceof AnalyzerError) {
			throw error;
		}
		throw new AnalyzerError(`Invalid ${role} float register '${token}'`, line);
	}
}

function assembleRType(spec: InstructionSpec, operands: string[], line: number, isEmbedded: boolean): number {
	let rd = 0, rs1 = 0, rs2 = 0;

	if (spec.operandPattern === 'rd_rs1') {
		ensureOperandCount(operands, 2, line, spec.name);
		rd = parseRegisterOperand(operands[0], 'rd', line, isEmbedded);
		rs1 = parseRegisterOperand(operands[1], 'rs1', line, isEmbedded);
		rs2 = 0; // rs2 is ignored for LR instructions
	} else {
		ensureOperandCount(operands, 3, line, spec.name);
		rd = parseRegisterOperand(operands[0], 'rd', line, isEmbedded);
		rs1 = parseRegisterOperand(operands[1], 'rs1', line, isEmbedded);
		rs2 = parseRegisterOperand(operands[2], 'rs2', line, isEmbedded);
	}

	if (spec.funct3 === undefined || spec.funct7 === undefined) {
		throw new AnalyzerError(`Missing funct fields for '${spec.name}'`, line);
	}
	return (
		((spec.funct7 & 0x7f) << 25) |
		((rs2 & 0x1f) << 20) |
		((rs1 & 0x1f) << 15) |
		((spec.funct3 & 0x7) << 12) |
		((rd & 0x1f) << 7) |
		(spec.opcode & 0x7f)
	);
}

function assembleFloatRType(spec: InstructionSpec, operands: string[], line: number): number {
	let fd = 0, fs1 = 0, fs2 = 0, rs1 = 0, rd = 0;

	switch (spec.operandPattern) {
		case 'fd_fs1_fs2':
			ensureOperandCount(operands, 3, line, spec.name);
			fd = parseFloatRegisterOperand(operands[0], 'fd', line);
			fs1 = parseFloatRegisterOperand(operands[1], 'fs1', line);
			fs2 = parseFloatRegisterOperand(operands[2], 'fs2', line);
			break;
		case 'fd_fs1':
			ensureOperandCount(operands, 2, line, spec.name);
			fd = parseFloatRegisterOperand(operands[0], 'fd', line);
			fs1 = parseFloatRegisterOperand(operands[1], 'fs1', line);
			break;
		case 'fd_rs1':
			ensureOperandCount(operands, 2, line, spec.name);
			fd = parseFloatRegisterOperand(operands[0], 'fd', line);
			rs1 = parseRegisterOperand(operands[1], 'rs1', line, false);
			break;
		case 'rd_fs1':
			ensureOperandCount(operands, 2, line, spec.name);
			rd = parseRegisterOperand(operands[0], 'rd', line, false);
			fs1 = parseFloatRegisterOperand(operands[1], 'fs1', line);
			break;
		case 'rd_fs1_fs2':
			ensureOperandCount(operands, 3, line, spec.name);
			rd = parseRegisterOperand(operands[0], 'rd', line, false);
			fs1 = parseFloatRegisterOperand(operands[1], 'fs1', line);
			fs2 = parseFloatRegisterOperand(operands[2], 'fs2', line);
			break;
		default:
			throw new AnalyzerError(`Unsupported float operand pattern for '${spec.name}'`, line);
	}

	if (spec.funct3 === undefined || spec.funct7 === undefined) {
		throw new AnalyzerError(`Missing funct fields for '${spec.name}'`, line);
	}
	return (
		((spec.funct7 & 0x7f) << 25) |
		((fs2 & 0x1f) << 20) |
		((fs1 & 0x1f) << 15) |
		((spec.funct3 & 0x7) << 12) |
		(((rd | fd) & 0x1f) << 7) |
		(spec.opcode & 0x7f)
	);
}

function assembleFloatR4Type(spec: InstructionSpec, operands: string[], line: number): number {
	if (operands.length !== 4) {
		throw new AnalyzerError(`Expected 4 operands, got ${operands.length}`, line);
	}
	const fd = parseFloatRegister(operands[0]);
	const fs1 = parseFloatRegister(operands[1]);
	const fs2 = parseFloatRegister(operands[2]);
	const fs3 = parseFloatRegister(operands[3]);

	let word = 0;
	word |= spec.opcode;
	word |= fd << 7;
	word |= spec.funct2! << 12;
	word |= fs1 << 15;
	word |= fs2 << 20;
	word |= fs3 << 27;
	return word;
}

function assembleFloatIType(spec: InstructionSpec, operands: string[], line: number): number {
	ensureOperandCount(operands, 3, line, spec.name);
	const fd = parseFloatRegisterOperand(operands[0], 'fd', line);
	const rs1 = parseRegisterOperand(operands[1], 'rs1', line, false);
	const imm = parseImmediate(operands[2], { bits: 12, signed: true, line, label: 'offset' });
	return (
		((imm & 0xfff) << 20) |
		((rs1 & 0x1f) << 15) |
		((spec.funct3! & 0x7) << 12) |
		((fd & 0x1f) << 7) |
		(spec.opcode & 0x7f)
	);
}

function assembleFloatSType(spec: InstructionSpec, operands: string[], line: number): number {
	ensureOperandCount(operands, 3, line, spec.name);
	const fs2 = parseFloatRegisterOperand(operands[0], 'fs2', line);
	const rs1 = parseRegisterOperand(operands[2], 'rs1', line, false);
	const imm = parseImmediate(operands[1], { bits: 12, signed: true, line, label: 'offset' });
	const imm11_5 = (imm >> 5) & 0x7f;
	const imm4_0 = imm & 0x1f;
	return (
		((imm11_5 & 0x7f) << 25) |
		((fs2 & 0x1f) << 20) |
		((rs1 & 0x1f) << 15) |
		((spec.funct3! & 0x7) << 12) |
		((imm4_0 & 0x1f) << 7) |
		(spec.opcode & 0x7f)
	);
}

function assembleIType(spec: InstructionSpec, operands: string[], line: number, isEmbedded: boolean): number {
	const hasFixedImm = spec.fixedImmediate !== undefined;
	const expectedOperands = hasFixedImm ? 2 : 3;
	ensureOperandCount(operands, expectedOperands, line, spec.name);
	const rd = parseRegisterOperand(operands[0], 'rd', line, isEmbedded);
	const rs1 = parseRegisterOperand(operands[1], 'rs1', line, isEmbedded);
	const imm = hasFixedImm ? spec.fixedImmediate! : parseImmediate(operands[2], {
		bits: spec.immBits ?? 12,
		signed: !(spec.unsignedImmediate ?? false),
		line,
		label: 'immediate'
	});
	const immMask = (1 << (spec.immBits ?? 12)) - 1;
	let word =
		((imm & immMask) << 20) |
		((rs1 & 0x1f) << 15) |
		(((spec.funct3 ?? 0) & 0x7) << 12) |
		((rd & 0x1f) << 7) |
		(spec.opcode & 0x7f);
	if (spec.funct7 !== undefined) {
		word |= (spec.funct7 & 0x7f) << 25;
	}
	return word;
}

function assembleLoad(spec: InstructionSpec, operands: string[], line: number, isEmbedded: boolean): number {
	ensureOperandCount(operands, 2, line, spec.name);
	const isFloat = spec.format === 'FI';
	const rd = isFloat
		? parseFloatRegisterOperand(operands[0], 'rd', line)
		: parseRegisterOperand(operands[0], 'rd', line, isEmbedded);
	const { base, offset } = parseMemoryOperand(operands[1], line, isEmbedded);
	const immMask = (1 << 12) - 1;
	return (
		((offset & immMask) << 20) |
		((base & 0x1f) << 15) |
		(((spec.funct3 ?? 0) & 0x7) << 12) |
		((rd & 0x1f) << 7) |
		(spec.opcode & 0x7f)
	);
}

function assembleStore(spec: InstructionSpec, operands: string[], line: number, isEmbedded: boolean): number {
	ensureOperandCount(operands, 2, line, spec.name);
	const isFloat = spec.format === 'FS';
	const rs2 = isFloat
		? parseFloatRegisterOperand(operands[0], 'rs2', line)
		: parseRegisterOperand(operands[0], 'rs2', line, isEmbedded);
	const { base, offset } = parseMemoryOperand(operands[1], line, isEmbedded);
	const immMask = (1 << 12) - 1;
	const imm = offset & immMask;
	const immHi = (imm >> 5) & 0x7f;
	const immLo = imm & 0x1f;
	return (
		(immHi << 25) |
		((rs2 & 0x1f) << 20) |
		((base & 0x1f) << 15) |
		(((spec.funct3 ?? 0) & 0x7) << 12) |
		(immLo << 7) |
		(spec.opcode & 0x7f)
	);
}

function assembleBranch(spec: InstructionSpec, operands: string[], line: number, isEmbedded: boolean): number {
	ensureOperandCount(operands, 3, line, spec.name);
	const rs1 = parseRegisterOperand(operands[0], 'rs1', line, isEmbedded);
	const rs2 = parseRegisterOperand(operands[1], 'rs2', line, isEmbedded);
	const imm = parseImmediate(operands[2], {
		bits: spec.immBits ?? 13,
		signed: true,
		line,
		label: 'branch offset'
	});
	if ((imm & 0x1) !== 0) {
		throw new AnalyzerError('Branch offset must be aligned to 2 bytes', line);
	}
	const imm12 = (imm >> 12) & 0x1;
	const imm11 = (imm >> 11) & 0x1;
	const imm10_5 = (imm >> 5) & 0x3f;
	const imm4_1 = (imm >> 1) & 0xf;
	return (
		(imm12 << 31) |
		(imm10_5 << 25) |
		((rs2 & 0x1f) << 20) |
		((rs1 & 0x1f) << 15) |
		(((spec.funct3 ?? 0) & 0x7) << 12) |
		(imm4_1 << 8) |
		(imm11 << 7) |
		(spec.opcode & 0x7f)
	);
}

function assembleUType(spec: InstructionSpec, operands: string[], line: number, isEmbedded: boolean): number {
	ensureOperandCount(operands, 2, line, spec.name);
	const rd = parseRegisterOperand(operands[0], 'rd', line, isEmbedded);
	const imm = parseImmediate(operands[1], {
		bits: spec.immBits ?? 20,
		signed: true,
		line,
		label: 'immediate'
	});
	const immMask = (1 << (spec.immBits ?? 20)) - 1;
	return (
		((imm & immMask) << 12) |
		((rd & 0x1f) << 7) |
		(spec.opcode & 0x7f)
	);
}

function assembleJump(spec: InstructionSpec, operands: string[], line: number, isEmbedded: boolean): number {
	ensureOperandCount(operands, 2, line, spec.name);
	const rd = parseRegisterOperand(operands[0], 'rd', line, isEmbedded);
	const imm = parseImmediate(operands[1], {
		bits: spec.immBits ?? 21,
		signed: true,
		line,
		label: 'jump offset'
	});
	if ((imm & 0x1) !== 0) {
		throw new AnalyzerError('Jump offset must be aligned to 2 bytes', line);
	}
	const imm20 = (imm >> 20) & 0x1;
	const imm19_12 = (imm >> 12) & 0xff;
	const imm11 = (imm >> 11) & 0x1;
	const imm10_1 = (imm >> 1) & 0x3ff;
	return (
		(imm20 << 31) |
		(imm10_1 << 21) |
		(imm11 << 20) |
		(imm19_12 << 12) |
		((rd & 0x1f) << 7) |
		(spec.opcode & 0x7f)
	);
}

function assembleZeroOperand(spec: InstructionSpec, operands: string[], line: number): number {
	ensureOperandCount(operands, 0, line, spec.name);
	const immBits = spec.immBits ?? 12;
	const immMask = (1 << immBits) - 1;
	const imm = (spec.fixedImmediate ?? 0) & immMask;
	return (
		(imm << 20) |
		(((spec.funct3 ?? 0) & 0x7) << 12) |
		(spec.opcode & 0x7f)
	);
}

function assembleFence(spec: InstructionSpec, operands: string[], line: number): number {
	if (operands.length !== 0 && operands.length !== 2) {
		throw new AnalyzerError(`Expected 0 or 2 operand(s) for ${spec.name}, received ${operands.length}`, line);
	}
	let predMask = 0xf;
	let succMask = 0xf;
	if (operands.length === 2) {
		predMask = parseFenceMask(operands[0], line);
		succMask = parseFenceMask(operands[1], line);
	}
	const immBits = spec.immBits ?? 12;
	const immMask = (1 << immBits) - 1;
	const baseImm = spec.fixedImmediate ?? 0;
	const imm = (baseImm | ((succMask & 0xf) << 4) | (predMask & 0xf)) & immMask;
	return (
		(imm << 20) |
		(((spec.funct3 ?? 0) & 0x7) << 12) |
		(spec.opcode & 0x7f)
	);
}

function parseFenceMask(token: string, line: number): number {
	const normalized = token.trim().toLowerCase();
	if (normalized === '0') {
		return 0;
	}
	let mask = 0;
	for (const ch of normalized) {
		switch (ch) {
			case 'i':
				mask |= 0x8;
				break;
			case 'o':
				mask |= 0x4;
				break;
			case 'r':
				mask |= 0x2;
				break;
			case 'w':
				mask |= 0x1;
				break;
			default:
				throw new AnalyzerError(`Invalid fence operand '${token}'`, line);
		}
	}
	return mask;
}

function assembleCsrRegister(spec: InstructionSpec, operands: string[], line: number, isEmbedded: boolean): number {
	ensureOperandCount(operands, 3, line, spec.name);
	const rd = parseRegisterOperand(operands[0], 'rd', line, isEmbedded);
	const csr = parseImmediate(operands[1], { bits: 12, signed: false, line, label: 'csr' });
	const rs1 = parseRegisterOperand(operands[2], 'rs1', line, isEmbedded);
	return (
		((csr & 0xfff) << 20) |
		((rs1 & 0x1f) << 15) |
		(((spec.funct3 ?? 0) & 0x7) << 12) |
		((rd & 0x1f) << 7) |
		(spec.opcode & 0x7f)
	);
}

function assembleCsrImmediate(spec: InstructionSpec, operands: string[], line: number, isEmbedded: boolean): number {
	ensureOperandCount(operands, 3, line, spec.name);
	const rd = parseRegisterOperand(operands[0], 'rd', line, isEmbedded);
	const csr = parseImmediate(operands[1], { bits: 12, signed: false, line, label: 'csr' });
	const zimm = parseImmediate(operands[2], { bits: 5, signed: false, line, label: 'immediate' });
	return (
		((csr & 0xfff) << 20) |
		((zimm & 0x1f) << 15) |
		(((spec.funct3 ?? 0) & 0x7) << 12) |
		((rd & 0x1f) << 7) |
		(spec.opcode & 0x7f)
	);
}

function parseMemoryOperand(token: string, line: number, isEmbedded: boolean): { base: number; offset: number } {
	const trimmed = token.trim();
	const open = trimmed.indexOf('(');
	const close = trimmed.indexOf(')', open + 1);
	if (open <= 0 || close !== trimmed.length - 1) {
		throw new AnalyzerError(`Invalid memory operand '${token}'`, line);
	}
	const offsetToken = trimmed.slice(0, open) || '0';
	const baseToken = trimmed.slice(open + 1, close);
	const offset = parseImmediate(offsetToken, { bits: 12, signed: true, line, label: 'offset' });
	const base = parseRegisterOperand(baseToken, 'base', line, isEmbedded);
	return { base, offset };
}

function assembleVType(spec: InstructionSpec, operands: string[], line: number): number {
	// Parse operands based on pattern
	let vd = 0, vs1 = 0, vs2 = 0, rs2 = 0, imm = 0, vm = 1;

	switch (spec.operandPattern) {
		case 'vd_vs1_vs2':
		case 'vd_vs1_vs2_vm':
			ensureOperandCount(operands, 3, line, spec.name);
			vd = parseVectorRegister(operands[0]);
			vs1 = parseVectorRegister(operands[1]);
			vs2 = parseVectorRegister(operands[2]);
			if (spec.operandPattern === 'vd_vs1_vs2_vm') {
				vm = 0; // masked operation
			}
			break;
		case 'vd_vs1_rs2':
		case 'vd_vs1_rs2_vm':
			ensureOperandCount(operands, 3, line, spec.name);
			vd = parseVectorRegister(operands[0]);
			vs1 = parseVectorRegister(operands[1]);
			rs2 = parseRegister(operands[2], false); // scalar register
			if (spec.operandPattern === 'vd_vs1_rs2_vm') {
				vm = 0;
			}
			break;
		case 'vd_vs1_imm':
		case 'vd_vs1_imm_vm':
			ensureOperandCount(operands, 3, line, spec.name);
			vd = parseVectorRegister(operands[0]);
			vs1 = parseVectorRegister(operands[1]);
			imm = parseImmediate(operands[2], { bits: 5, signed: true, line, label: 'immediate' });
			if (spec.operandPattern === 'vd_vs1_imm_vm') {
				vm = 0;
			}
			break;
		case 'vd_rs1':
		case 'vd_rs1_vm':
			ensureOperandCount(operands, 2, line, spec.name);
			vd = parseVectorRegister(operands[0]);
			rs2 = parseRegister(operands[1], false); // rs1 field used for scalar
			if (spec.operandPattern === 'vd_rs1_vm') {
				vm = 0;
			}
			break;
		case 'vd_vs1':
		case 'vd_vs1_vm':
			ensureOperandCount(operands, 2, line, spec.name);
			vd = parseVectorRegister(operands[0]);
			vs1 = parseVectorRegister(operands[1]);
			if (spec.operandPattern === 'vd_vs1_vm') {
				vm = 0;
			}
			break;
		default:
			throw new AnalyzerError(`Unsupported vector operand pattern '${spec.operandPattern}'`, line);
	}

	// Build the instruction word
	let word = spec.opcode & 0x7f;

	// Add vm field (bit 25)
	word |= (vm & 0x1) << 25;

	// Add vs2 field (bits 24:20)
	word |= (vs2 & 0x1f) << 20;

	// Add vs1/rs1 field (bits 19:15)
	const rs1Field = spec.operandPattern.includes('rs2') ? rs2 : vs1;
	word |= (rs1Field & 0x1f) << 15;

	// Add funct3 field (bits 14:12)
	word |= ((spec.funct3 ?? 0) & 0x7) << 12;

	// Add vd field (bits 11:7)
	word |= (vd & 0x1f) << 7;

	// Add funct6 field (bits 31:26)
	word |= ((spec.funct6 ?? 0) & 0x3f) << 26;

	// For immediate operations, add imm to rs1 field
	if (spec.operandPattern.includes('imm')) {
		word |= (imm & 0x1f) << 15;
	}

	return word;
}

function assembleVLoad(spec: InstructionSpec, operands: string[], line: number): number {
	ensureOperandCount(operands, 2, line, spec.name);
	const vd = parseVectorRegister(operands[0]);
	const { base, offset } = parseMemoryOperand(operands[1], line, false);

	return (
		((offset & 0xfff) << 20) |
		((base & 0x1f) << 15) |
		(((spec.funct3 ?? 0) & 0x7) << 12) |
		((vd & 0x1f) << 7) |
		(spec.opcode & 0x7f)
	);
}

function assembleVStore(spec: InstructionSpec, operands: string[], line: number): number {
	ensureOperandCount(operands, 2, line, spec.name);
	const vs = parseVectorRegister(operands[0]);
	const { base, offset } = parseMemoryOperand(operands[1], line, false);

	return (
		(((offset >> 5) & 0x7f) << 25) |
		((vs & 0x1f) << 20) |
		((base & 0x1f) << 15) |
		(((spec.funct3 ?? 0) & 0x7) << 12) |
		((offset & 0x1f) << 7) |
		(spec.opcode & 0x7f)
	);
}

// ------------------ Pseudo-instruction expansion ------------------
type ExpandedInst = { mnemonic: string; operands: string[] };

function fitsSigned(value: number, bits: number): boolean {
	const min = -(1 << (bits - 1));
	const max = (1 << (bits - 1)) - 1;
	return value >= min && value <= max;
}

function expandPseudo(
	mnemonic: string,
	operands: string[],
	line: number,
	isEmbedded: boolean,
	mode: XLenMode,
	detectedXlen: XLen
): ExpandedInst[] | null {
	const m = mnemonic.toLowerCase();
	const rd = (i: number) => operands[i];
	const rs = (i: number) => operands[i];

	switch (m) {
		case 'nop':
			ensureOperandCount(operands, 0, line, 'nop');
			return [{ mnemonic: 'addi', operands: ['x0', 'x0', '0'] }];
		case 'mv':
			ensureOperandCount(operands, 2, line, 'mv');
			return [{ mnemonic: 'addi', operands: [rd(0), rs(1), '0'] }];
		case 'not':
			ensureOperandCount(operands, 2, line, 'not');
			return [{ mnemonic: 'xori', operands: [rd(0), rs(1), '-1'] }];
		case 'neg':
			ensureOperandCount(operands, 2, line, 'neg');
			return [{ mnemonic: 'sub', operands: [rd(0), 'x0', rs(1)] }];
		case 'negw':
			ensureOperandCount(operands, 2, line, 'negw');
			return [{ mnemonic: 'subw', operands: [rd(0), 'x0', rs(1)] }];
		case 'sext.w':
			ensureOperandCount(operands, 2, line, 'sext.w');
			return [{ mnemonic: 'addiw', operands: [rd(0), rs(1), '0'] }];
		case 'seqz':
			ensureOperandCount(operands, 2, line, 'seqz');
			return [{ mnemonic: 'sltiu', operands: [rd(0), rs(1), '1'] }];
		case 'snez':
			ensureOperandCount(operands, 2, line, 'snez');
			return [{ mnemonic: 'sltu', operands: [rd(0), 'x0', rs(1)] }];
		case 'sltz':
			ensureOperandCount(operands, 2, line, 'sltz');
			return [{ mnemonic: 'slt', operands: [rd(0), rs(1), 'x0'] }];
		case 'sgtz':
			ensureOperandCount(operands, 2, line, 'sgtz');
			return [{ mnemonic: 'slt', operands: [rd(0), 'x0', rs(1)] }];
		case 'beqz':
			ensureOperandCount(operands, 2, line, 'beqz');
			return [{ mnemonic: 'beq', operands: [rs(0), 'x0', operands[1]] }];
		case 'bnez':
			ensureOperandCount(operands, 2, line, 'bnez');
			return [{ mnemonic: 'bne', operands: [rs(0), 'x0', operands[1]] }];
		case 'blez':
			ensureOperandCount(operands, 2, line, 'blez');
			return [{ mnemonic: 'bge', operands: ['x0', rs(0), operands[1]] }];
		case 'bgez':
			ensureOperandCount(operands, 2, line, 'bgez');
			return [{ mnemonic: 'bge', operands: [rs(0), 'x0', operands[1]] }];
		case 'bltz':
			ensureOperandCount(operands, 2, line, 'bltz');
			return [{ mnemonic: 'blt', operands: [rs(0), 'x0', operands[1]] }];
		case 'bgtz':
			ensureOperandCount(operands, 2, line, 'bgtz');
			return [{ mnemonic: 'blt', operands: ['x0', rs(0), operands[1]] }];
		case 'j':
			ensureOperandCount(operands, 1, line, 'j');
			return [{ mnemonic: 'jal', operands: ['x0', operands[0]] }];
		case 'jr':
			ensureOperandCount(operands, 1, line, 'jr');
			return [{ mnemonic: 'jalr', operands: ['x0', operands[0], '0'] }];
		case 'ret':
			ensureOperandCount(operands, 0, line, 'ret');
			return [{ mnemonic: 'jalr', operands: ['x0', 'x1', '0'] }];
		case 'jal':
			// Pseudo form: jal offset  => jal x1, offset
			if (operands.length === 1) {
				return [{ mnemonic: 'jal', operands: ['x1', operands[0]] }];
			}
			return null; // real jal handled elsewhere
		case 'li': {
			ensureOperandCount(operands, 2, line, 'li');
			const dest = operands[0];
			// Limit: support 32-bit signed immediates for now
			const imm = parseImmediate(operands[1], { bits: 32, signed: true, line, label: 'immediate' });
			// If fits in 12-bit signed, use addi
			if (fitsSigned(imm, 12)) {
				return [{ mnemonic: 'addi', operands: [dest, 'x0', String(imm)] }];
			}
			// General case: LUI + ADDI with rounding
			const upper = (imm + 0x800) >> 12; // arithmetic
			const lower = imm - (upper << 12);
			// Ensure lower fits 12-bit signed
			if (!fitsSigned(lower, 12)) {
				throw new AnalyzerError(`Cannot encode immediate ${imm} in 12-bit addi after LUI`, line);
			}
			const seq: ExpandedInst[] = [];
			if (upper !== 0) {
				seq.push({ mnemonic: 'lui', operands: [dest, String(upper)] });
				if (lower !== 0) {
					seq.push({ mnemonic: 'addi', operands: [dest, dest, String(lower)] });
				}
			} else {
				// Rare case: no upper bits, just addi
				seq.push({ mnemonic: 'addi', operands: [dest, 'x0', String(lower)] });
			}
			return seq;
		}
		default:
			return null;
	}
}


