import { AnalyzerError } from './errors';
import { instructionsByName, InstructionSpec } from './instruction-set';
import { parseRegister } from './registers';
import { formatHex, parseImmediate } from './utils';

export function assemble(source: string): string {
	const assembler = new Assembler();
	const words = assembler.assemble(source);
	return words.map(formatHex).join('\n');
}

class Assembler {
	public assemble(source: string): number[] {
		const lines = source.split(/\r?\n/);
		const words: number[] = [];
		for (let i = 0; i < lines.length; i += 1) {
			const lineNumber = i + 1;
			const line = stripComment(lines[i]);
			if (!line.trim()) {
				continue;
			}
			const { mnemonic, operands } = parseLine(line, lineNumber);
			const word = this.assembleInstruction(mnemonic, operands, lineNumber);
			words.push(word >>> 0);
		}
		return words;
	}

	private assembleInstruction(mnemonic: string, operands: string[], line: number): number {
		const spec = instructionsByName.get(mnemonic);
		if (!spec) {
			throw new AnalyzerError(`Unsupported instruction '${mnemonic}'`, line);
		}

		switch (spec.operandPattern) {
			case 'rd_rs1_rs2':
				return assembleRType(spec, operands, line);
			case 'rd_rs1_imm12':
				return assembleIType(spec, operands, line);
			case 'rd_mem':
				return assembleLoad(spec, operands, line);
			case 'rs2_mem':
				return assembleStore(spec, operands, line);
			case 'rs1_rs2_branch':
				return assembleBranch(spec, operands, line);
			case 'rd_imm20':
				return assembleUType(spec, operands, line);
			case 'rd_jump':
				return assembleJump(spec, operands, line);
			default:
				throw new AnalyzerError(`Unhandled operand pattern for '${spec.name}'`, line);
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

function parseRegisterOperand(token: string, role: string, line: number): number {
	try {
		return parseRegister(token);
	} catch (error) {
		if (error instanceof AnalyzerError) {
			throw error;
		}
		throw new AnalyzerError(`Invalid ${role} register '${token}'`, line);
	}
}

function assembleRType(spec: InstructionSpec, operands: string[], line: number): number {
	ensureOperandCount(operands, 3, line, spec.name);
	const rd = parseRegisterOperand(operands[0], 'rd', line);
	const rs1 = parseRegisterOperand(operands[1], 'rs1', line);
	const rs2 = parseRegisterOperand(operands[2], 'rs2', line);
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

function assembleIType(spec: InstructionSpec, operands: string[], line: number): number {
	ensureOperandCount(operands, 3, line, spec.name);
	const rd = parseRegisterOperand(operands[0], 'rd', line);
	const rs1 = parseRegisterOperand(operands[1], 'rs1', line);
	const imm = parseImmediate(operands[2], {
		bits: spec.immBits ?? 12,
		signed: !(spec.unsignedImmediate ?? false),
		line,
		label: 'immediate'
	});
	const immMask = (1 << (spec.immBits ?? 12)) - 1;
	return (
		((imm & immMask) << 20) |
		((rs1 & 0x1f) << 15) |
		(((spec.funct3 ?? 0) & 0x7) << 12) |
		((rd & 0x1f) << 7) |
		(spec.opcode & 0x7f)
	);
}

function assembleLoad(spec: InstructionSpec, operands: string[], line: number): number {
	ensureOperandCount(operands, 2, line, spec.name);
	const rd = parseRegisterOperand(operands[0], 'rd', line);
	const { base, offset } = parseMemoryOperand(operands[1], line);
	const immMask = (1 << 12) - 1;
	return (
		((offset & immMask) << 20) |
		((base & 0x1f) << 15) |
		(((spec.funct3 ?? 0) & 0x7) << 12) |
		((rd & 0x1f) << 7) |
		(spec.opcode & 0x7f)
	);
}

function assembleStore(spec: InstructionSpec, operands: string[], line: number): number {
	ensureOperandCount(operands, 2, line, spec.name);
	const rs2 = parseRegisterOperand(operands[0], 'rs2', line);
	const { base, offset } = parseMemoryOperand(operands[1], line);
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

function assembleBranch(spec: InstructionSpec, operands: string[], line: number): number {
	ensureOperandCount(operands, 3, line, spec.name);
	const rs1 = parseRegisterOperand(operands[0], 'rs1', line);
	const rs2 = parseRegisterOperand(operands[1], 'rs2', line);
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

function assembleUType(spec: InstructionSpec, operands: string[], line: number): number {
	ensureOperandCount(operands, 2, line, spec.name);
	const rd = parseRegisterOperand(operands[0], 'rd', line);
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

function assembleJump(spec: InstructionSpec, operands: string[], line: number): number {
	ensureOperandCount(operands, 2, line, spec.name);
	const rd = parseRegisterOperand(operands[0], 'rd', line);
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

function parseMemoryOperand(token: string, line: number): { base: number; offset: number } {
	const trimmed = token.trim();
	const open = trimmed.indexOf('(');
	const close = trimmed.indexOf(')', open + 1);
	if (open <= 0 || close !== trimmed.length - 1) {
		throw new AnalyzerError(`Invalid memory operand '${token}'`, line);
	}
	const offsetToken = trimmed.slice(0, open) || '0';
	const baseToken = trimmed.slice(open + 1, close);
	const offset = parseImmediate(offsetToken, { bits: 12, signed: true, line, label: 'offset' });
	const base = parseRegisterOperand(baseToken, 'base', line);
	return { base, offset };
}
