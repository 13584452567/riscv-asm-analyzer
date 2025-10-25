import type { InstructionSpec } from '../instruction-types';

export const rv32iInstructions: InstructionSpec[] = [
	{
		name: 'add',
		format: 'R',
		opcode: 0b0110011,
		funct3: 0b000,
		funct7: 0b0000000,
		operandPattern: 'rd_rs1_rs2'
	},
	{
		name: 'sub',
		format: 'R',
		opcode: 0b0110011,
		funct3: 0b000,
		funct7: 0b0100000,
		operandPattern: 'rd_rs1_rs2'
	},
	{
		name: 'and',
		format: 'R',
		opcode: 0b0110011,
		funct3: 0b111,
		funct7: 0b0000000,
		operandPattern: 'rd_rs1_rs2'
	},
	{
		name: 'or',
		format: 'R',
		opcode: 0b0110011,
		funct3: 0b110,
		funct7: 0b0000000,
		operandPattern: 'rd_rs1_rs2'
	},
	{
		name: 'xor',
		format: 'R',
		opcode: 0b0110011,
		funct3: 0b100,
		funct7: 0b0000000,
		operandPattern: 'rd_rs1_rs2'
	},
	{
		name: 'slt',
		format: 'R',
		opcode: 0b0110011,
		funct3: 0b010,
		funct7: 0b0000000,
		operandPattern: 'rd_rs1_rs2'
	},
	{
		name: 'sltu',
		format: 'R',
		opcode: 0b0110011,
		funct3: 0b011,
		funct7: 0b0000000,
		operandPattern: 'rd_rs1_rs2'
	},
	{
		name: 'addi',
		format: 'I',
		opcode: 0b0010011,
		funct3: 0b000,
		operandPattern: 'rd_rs1_imm12'
	},
	{
		name: 'andi',
		format: 'I',
		opcode: 0b0010011,
		funct3: 0b111,
		operandPattern: 'rd_rs1_imm12'
	},
	{
		name: 'ori',
		format: 'I',
		opcode: 0b0010011,
		funct3: 0b110,
		operandPattern: 'rd_rs1_imm12'
	},
	{
		name: 'xori',
		format: 'I',
		opcode: 0b0010011,
		funct3: 0b100,
		operandPattern: 'rd_rs1_imm12'
	},
	{
		name: 'jalr',
		format: 'I',
		opcode: 0b1100111,
		funct3: 0b000,
		operandPattern: 'rd_rs1_imm12'
	},
	{
		name: 'lw',
		format: 'I',
		opcode: 0b0000011,
		funct3: 0b010,
		operandPattern: 'rd_mem'
	},
	{
		name: 'sw',
		format: 'S',
		opcode: 0b0100011,
		funct3: 0b010,
		operandPattern: 'rs2_mem'
	},
	{
		name: 'beq',
		format: 'B',
		opcode: 0b1100011,
		funct3: 0b000,
		operandPattern: 'rs1_rs2_branch',
		immBits: 13
	},
	{
		name: 'bne',
		format: 'B',
		opcode: 0b1100011,
		funct3: 0b001,
		operandPattern: 'rs1_rs2_branch',
		immBits: 13
	},
	{
		name: 'blt',
		format: 'B',
		opcode: 0b1100011,
		funct3: 0b100,
		operandPattern: 'rs1_rs2_branch',
		immBits: 13
	},
	{
		name: 'bge',
		format: 'B',
		opcode: 0b1100011,
		funct3: 0b101,
		operandPattern: 'rs1_rs2_branch',
		immBits: 13
	},
	{
		name: 'lui',
		format: 'U',
		opcode: 0b0110111,
		operandPattern: 'rd_imm20',
		immBits: 20
	},
	{
		name: 'auipc',
		format: 'U',
		opcode: 0b0010111,
		operandPattern: 'rd_imm20',
		immBits: 20
	},
	{
		name: 'jal',
		format: 'J',
		opcode: 0b1101111,
		operandPattern: 'rd_jump',
		immBits: 21
	}
];
