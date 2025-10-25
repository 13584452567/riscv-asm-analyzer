import type { InstructionSpec } from '../instruction-types';

// RV32B/RV64B Zbb Standard Extension
const zbbInstructions: InstructionSpec[] = [
	{
		name: 'clz',
		format: 'I',
		opcode: 0b0010011,
		funct3: 0b001,
		operandPattern: 'rd_rs1',
		fixedImmediate: 0b011000000000
	},
	{
		name: 'ctz',
		format: 'I',
		opcode: 0b0010011,
		funct3: 0b001,
		operandPattern: 'rd_rs1_imm12',
		fixedImmediate: 0b011000000001
	},
	{
		name: 'cpop',
		format: 'I',
		opcode: 0b0010011,
		funct3: 0b001,
		operandPattern: 'rd_rs1_imm12',
		fixedImmediate: 0b011000000010
	},
	{
		name: 'sext.b',
		format: 'I',
		opcode: 0b0010011,
		funct3: 0b001,
		operandPattern: 'rd_rs1_imm12',
		fixedImmediate: 0b011000000100
	},
	{
		name: 'sext.h',
		format: 'I',
		opcode: 0b0010011,
		funct3: 0b001,
		operandPattern: 'rd_rs1_imm12',
		fixedImmediate: 0b011000000101
	},
	{
		name: 'clzw',
		format: 'I',
		opcode: 0b0011011,
		funct3: 0b001,
		operandPattern: 'rd_rs1_imm12',
		fixedImmediate: 0b011000000000,
		minXlen: 64
	},
	{
		name: 'ctzw',
		format: 'I',
		opcode: 0b0011011,
		funct3: 0b001,
		operandPattern: 'rd_rs1_imm12',
		fixedImmediate: 0b011000000001,
		minXlen: 64
	},
	{
		name: 'cpopw',
		format: 'I',
		opcode: 0b0011011,
		funct3: 0b001,
		operandPattern: 'rd_rs1_imm12',
		fixedImmediate: 0b011000000010,
		minXlen: 64
	},
	{
		name: 'andn',
		format: 'R',
		opcode: 0b0110011,
		funct3: 0b111,
		funct7: 0b0100000,
		operandPattern: 'rd_rs1_rs2'
	},
	{
		name: 'orn',
		format: 'R',
		opcode: 0b0110011,
		funct3: 0b110,
		funct7: 0b0100000,
		operandPattern: 'rd_rs1_rs2'
	},
	{
		name: 'xnor',
		format: 'R',
		opcode: 0b0110011,
		funct3: 0b100,
		funct7: 0b0100000,
		operandPattern: 'rd_rs1_rs2'
	},
	{
		name: 'rol',
		format: 'R',
		opcode: 0b0110011,
		funct3: 0b001,
		funct7: 0b0110000,
		operandPattern: 'rd_rs1_rs2'
	},
	{
		name: 'ror',
		format: 'R',
		opcode: 0b0110011,
		funct3: 0b101,
		funct7: 0b0110000,
		operandPattern: 'rd_rs1_rs2'
	},
	{
		name: 'rolw',
		format: 'R',
		opcode: 0b0111011,
		funct3: 0b001,
		funct7: 0b0110000,
		operandPattern: 'rd_rs1_rs2',
		minXlen: 64
	},
	{
		name: 'rorw',
		format: 'R',
		opcode: 0b0111011,
		funct3: 0b101,
		funct7: 0b0110000,
		operandPattern: 'rd_rs1_rs2',
		minXlen: 64
	},
	{
		name: 'rori',
		format: 'I',
		opcode: 0b0010011,
		funct3: 0b101,
		funct7: 0b0110000,
		operandPattern: 'rd_rs1_imm6',
		immBits: 6
	},
	{
		name: 'roriw',
		format: 'I',
		opcode: 0b0011011,
		funct3: 0b101,
		funct7: 0b0110000,
		operandPattern: 'rd_rs1_imm6',
		immBits: 5,
		minXlen: 64
	}
];

// RV32B/RV64B Zbs Standard Extension
const zbsInstructions: InstructionSpec[] = [
	{
		name: 'bset',
		format: 'R',
		opcode: 0b0110011,
		funct3: 0b001,
		funct7: 0b0010000,
		operandPattern: 'rd_rs1_rs2'
	},
	{
		name: 'bclr',
		format: 'R',
		opcode: 0b0110011,
		funct3: 0b001,
		funct7: 0b0100000,
		operandPattern: 'rd_rs1_rs2'
	},
	{
		name: 'binv',
		format: 'R',
		opcode: 0b0110011,
		funct3: 0b001,
		funct7: 0b0110000,
		operandPattern: 'rd_rs1_rs2'
	},
	{
		name: 'bext',
		format: 'R',
		opcode: 0b0110011,
		funct3: 0b101,
		funct7: 0b0100000,
		operandPattern: 'rd_rs1_rs2'
	},
	{
		name: 'bseti',
		format: 'I',
		opcode: 0b0010011,
		funct3: 0b001,
		funct7: 0b0010000,
		operandPattern: 'rd_rs1_imm6',
		immBits: 6
	},
	{
		name: 'bclri',
		format: 'I',
		opcode: 0b0010011,
		funct3: 0b101,
		funct7: 0b0010000,
		operandPattern: 'rd_rs1_imm6',
		immBits: 6
	},
	{
		name: 'binvi',
		format: 'I',
		opcode: 0b0010011,
		funct3: 0b101,
		funct7: 0b0110000,
		operandPattern: 'rd_rs1_imm6',
		immBits: 6
	},
	{
		name: 'bexti',
		format: 'I',
		opcode: 0b0010011,
		funct3: 0b101,
		funct7: 0b0100000,
		operandPattern: 'rd_rs1_imm6',
		immBits: 6
	}
];

export const rvbInstructions: InstructionSpec[] = [...zbbInstructions, ...zbsInstructions];

