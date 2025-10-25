import type { InstructionSpec } from '../instruction-types';

// RISC-V Single-Precision Floating-Point Extension (RVF) Instructions
// Based on RISC-V F Single-Precision Floating-Point Extension Specification

// Floating-Point Load/Store Instructions
const floatingPointLoadStoreInstructions: InstructionSpec[] = [
	{
		name: 'flw',
		format: 'FI',
		opcode: 0b0000111,
		funct3: 0b010,
		operandPattern: 'fd_rs1',
		minXlen: 32
	},
	{
		name: 'fsw',
		format: 'FS',
		opcode: 0b0100111,
		funct3: 0b010,
		operandPattern: 'fs2_fs1_rs1',
		minXlen: 32
	}
];

// Floating-Point Arithmetic Instructions
const floatingPointArithmeticInstructions: InstructionSpec[] = [
	{
		name: 'fadd.s',
		format: 'FR',
		opcode: 0b1010011,
		funct7: 0b0000000,
		funct3: 0b000,
		operandPattern: 'fd_fs1_fs2',
		minXlen: 32
	},
	{
		name: 'fsub.s',
		format: 'FR',
		opcode: 0b1010011,
		funct7: 0b0000100,
		funct3: 0b000,
		operandPattern: 'fd_fs1_fs2',
		minXlen: 32
	},
	{
		name: 'fmul.s',
		format: 'FR',
		opcode: 0b1010011,
		funct7: 0b0001000,
		funct3: 0b000,
		operandPattern: 'fd_fs1_fs2',
		minXlen: 32
	},
	{
		name: 'fdiv.s',
		format: 'FR',
		opcode: 0b1010011,
		funct7: 0b0001100,
		funct3: 0b000,
		operandPattern: 'fd_fs1_fs2',
		minXlen: 32
	},
	{
		name: 'fsqrt.s',
		format: 'FR',
		opcode: 0b1010011,
		funct7: 0b0101100,
		funct3: 0b000,
		operandPattern: 'fd_fs1',
		minXlen: 32
	},
	{
		name: 'fmin.s',
		format: 'FR',
		opcode: 0b1010011,
		funct7: 0b0010100,
		funct3: 0b000,
		operandPattern: 'fd_fs1_fs2',
		minXlen: 32
	},
	{
		name: 'fmax.s',
		format: 'FR',
		opcode: 0b1010011,
		funct7: 0b0010100,
		funct3: 0b001,
		operandPattern: 'fd_fs1_fs2',
		minXlen: 32
	}
];

// Floating-Point Comparison Instructions
const floatingPointComparisonInstructions: InstructionSpec[] = [
	{
		name: 'feq.s',
		format: 'FR',
		opcode: 0b1010011,
		funct7: 0b1010000,
		funct3: 0b010,
		operandPattern: 'rd_fs1_fs2',
		minXlen: 32
	},
	{
		name: 'flt.s',
		format: 'FR',
		opcode: 0b1010011,
		funct7: 0b1010000,
		funct3: 0b001,
		operandPattern: 'rd_fs1_fs2',
		minXlen: 32
	},
	{
		name: 'fle.s',
		format: 'FR',
		opcode: 0b1010011,
		funct7: 0b1010000,
		funct3: 0b000,
		operandPattern: 'rd_fs1_fs2',
		minXlen: 32
	}
];

// Floating-Point Conversion Instructions
const floatingPointConversionInstructions: InstructionSpec[] = [
	{
		name: 'fcvt.w.s',
		format: 'FR',
		opcode: 0b1010011,
		funct7: 0b1100000,
		funct3: 0b000,
		operandPattern: 'rd_fs1',
		minXlen: 32
	},
	{
		name: 'fcvt.wu.s',
		format: 'FR',
		opcode: 0b1010011,
		funct7: 0b1100000,
		funct3: 0b001,
		operandPattern: 'rd_fs1',
		minXlen: 32
	},
	{
		name: 'fcvt.s.w',
		format: 'FR',
		opcode: 0b1010011,
		funct7: 0b1101000,
		funct3: 0b000,
		operandPattern: 'fd_rs1',
		minXlen: 32
	},
	{
		name: 'fcvt.s.wu',
		format: 'FR',
		opcode: 0b1010011,
		funct7: 0b1101000,
		funct3: 0b001,
		operandPattern: 'fd_rs1',
		minXlen: 32
	}
];

// Floating-Point Move Instructions
const floatingPointMoveInstructions: InstructionSpec[] = [
	{
		name: 'fmv.x.w',
		format: 'FR',
		opcode: 0b1010011,
		funct7: 0b1110000,
		funct3: 0b000,
		operandPattern: 'rd_fs1',
		minXlen: 32
	},
	{
		name: 'fmv.w.x',
		format: 'FR',
		opcode: 0b1010011,
		funct7: 0b1111000,
		funct3: 0b000,
		operandPattern: 'fd_rs1',
		minXlen: 32
	}
];

// Floating-Point Classification Instruction
const floatingPointClassificationInstructions: InstructionSpec[] = [
	{
		name: 'fclass.s',
		format: 'FR',
		opcode: 0b1010011,
		funct7: 0b1110000,
		funct3: 0b001,
		operandPattern: 'rd_fs1',
		minXlen: 32
	}
];

export const rvfInstructions: InstructionSpec[] = [
	...floatingPointLoadStoreInstructions,
	...floatingPointArithmeticInstructions,
	...floatingPointComparisonInstructions,
	...floatingPointConversionInstructions,
	...floatingPointMoveInstructions,
	...floatingPointClassificationInstructions
];