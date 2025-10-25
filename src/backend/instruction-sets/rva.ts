import type { InstructionSpec } from '../instruction-types';

// RISC-V Atomic Extension (RVA) Instructions
// Based on RISC-V A Atomic Extension Specification

// Load-Reserved/Store-Conditional Instructions
const loadReservedStoreConditionalInstructions: InstructionSpec[] = [
	{
		name: 'lr.w',
		format: 'R',
		opcode: 0b0101111,
		funct3: 0b010,
		funct7: 0b00010,
		operandPattern: 'rd_rs1',
		minXlen: 32
	},
	{
		name: 'lr.d',
		format: 'R',
		opcode: 0b0101111,
		funct3: 0b011,
		funct7: 0b00010,
		operandPattern: 'rd_rs1',
		minXlen: 64
	},
	{
		name: 'sc.w',
		format: 'R',
		opcode: 0b0101111,
		funct3: 0b010,
		funct7: 0b00011,
		operandPattern: 'rd_rs1_rs2',
		minXlen: 32
	},
	{
		name: 'sc.d',
		format: 'R',
		opcode: 0b0101111,
		funct3: 0b011,
		funct7: 0b00011,
		operandPattern: 'rd_rs1_rs2',
		minXlen: 64
	}
];

// Atomic Memory Operation Instructions
const atomicMemoryOperationInstructions: InstructionSpec[] = [
	// Atomic Swap
	{
		name: 'amoswap.w',
		format: 'R',
		opcode: 0b0101111,
		funct3: 0b010,
		funct7: 0b00001,
		operandPattern: 'rd_rs1_rs2',
		minXlen: 32
	},
	{
		name: 'amoswap.d',
		format: 'R',
		opcode: 0b0101111,
		funct3: 0b011,
		funct7: 0b00001,
		operandPattern: 'rd_rs1_rs2',
		minXlen: 64
	},
	// Atomic Add
	{
		name: 'amoadd.w',
		format: 'R',
		opcode: 0b0101111,
		funct3: 0b010,
		funct7: 0b00000,
		operandPattern: 'rd_rs1_rs2',
		minXlen: 32
	},
	{
		name: 'amoadd.d',
		format: 'R',
		opcode: 0b0101111,
		funct3: 0b011,
		funct7: 0b00000,
		operandPattern: 'rd_rs1_rs2',
		minXlen: 64
	},
	// Atomic And
	{
		name: 'amoand.w',
		format: 'R',
		opcode: 0b0101111,
		funct3: 0b010,
		funct7: 0b01100,
		operandPattern: 'rd_rs1_rs2',
		minXlen: 32
	},
	{
		name: 'amoand.d',
		format: 'R',
		opcode: 0b0101111,
		funct3: 0b011,
		funct7: 0b01100,
		operandPattern: 'rd_rs1_rs2',
		minXlen: 64
	},
	// Atomic Or
	{
		name: 'amoor.w',
		format: 'R',
		opcode: 0b0101111,
		funct3: 0b010,
		funct7: 0b01000,
		operandPattern: 'rd_rs1_rs2',
		minXlen: 32
	},
	{
		name: 'amoor.d',
		format: 'R',
		opcode: 0b0101111,
		funct3: 0b011,
		funct7: 0b01000,
		operandPattern: 'rd_rs1_rs2',
		minXlen: 64
	},
	// Atomic Xor
	{
		name: 'amoxor.w',
		format: 'R',
		opcode: 0b0101111,
		funct3: 0b010,
		funct7: 0b00100,
		operandPattern: 'rd_rs1_rs2',
		minXlen: 32
	},
	{
		name: 'amoxor.d',
		format: 'R',
		opcode: 0b0101111,
		funct3: 0b011,
		funct7: 0b00100,
		operandPattern: 'rd_rs1_rs2',
		minXlen: 64
	},
	// Atomic Min Signed
	{
		name: 'amomin.w',
		format: 'R',
		opcode: 0b0101111,
		funct3: 0b010,
		funct7: 0b10000,
		operandPattern: 'rd_rs1_rs2',
		minXlen: 32
	},
	{
		name: 'amomin.d',
		format: 'R',
		opcode: 0b0101111,
		funct3: 0b011,
		funct7: 0b10000,
		operandPattern: 'rd_rs1_rs2',
		minXlen: 64
	},
	// Atomic Max Signed
	{
		name: 'amomax.w',
		format: 'R',
		opcode: 0b0101111,
		funct3: 0b010,
		funct7: 0b10100,
		operandPattern: 'rd_rs1_rs2',
		minXlen: 32
	},
	{
		name: 'amomax.d',
		format: 'R',
		opcode: 0b0101111,
		funct3: 0b011,
		funct7: 0b10100,
		operandPattern: 'rd_rs1_rs2',
		minXlen: 64
	},
	// Atomic Min Unsigned
	{
		name: 'amominu.w',
		format: 'R',
		opcode: 0b0101111,
		funct3: 0b010,
		funct7: 0b11000,
		operandPattern: 'rd_rs1_rs2',
		minXlen: 32
	},
	{
		name: 'amominu.d',
		format: 'R',
		opcode: 0b0101111,
		funct3: 0b011,
		funct7: 0b11000,
		operandPattern: 'rd_rs1_rs2',
		minXlen: 64
	},
	// Atomic Max Unsigned
	{
		name: 'amomaxu.w',
		format: 'R',
		opcode: 0b0101111,
		funct3: 0b010,
		funct7: 0b11100,
		operandPattern: 'rd_rs1_rs2',
		minXlen: 32
	},
	{
		name: 'amomaxu.d',
		format: 'R',
		opcode: 0b0101111,
		funct3: 0b011,
		funct7: 0b11100,
		operandPattern: 'rd_rs1_rs2',
		minXlen: 64
	}
];

export const rvaInstructions: InstructionSpec[] = [
	...loadReservedStoreConditionalInstructions,
	...atomicMemoryOperationInstructions
];