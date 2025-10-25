import type { InstructionSpec } from '../instruction-types';

const wordImmediateInstructions: InstructionSpec[] = [
	{
		name: 'addiw',
		format: 'I',
		opcode: 0b0011011,
		funct3: 0b000,
		operandPattern: 'rd_rs1_imm12'
	},
	{
		name: 'slliw',
		format: 'I',
		opcode: 0b0011011,
		funct3: 0b001,
		funct7: 0b0000000,
		operandPattern: 'rd_rs1_imm12',
		immBits: 5,
		unsignedImmediate: true
	},
	{
		name: 'srliw',
		format: 'I',
		opcode: 0b0011011,
		funct3: 0b101,
		funct7: 0b0000000,
		operandPattern: 'rd_rs1_imm12',
		immBits: 5,
		unsignedImmediate: true
	},
	{
		name: 'sraiw',
		format: 'I',
		opcode: 0b0011011,
		funct3: 0b101,
		funct7: 0b0100000,
		operandPattern: 'rd_rs1_imm12',
		immBits: 5,
		unsignedImmediate: true
	}
];

const wordRegisterInstructions: InstructionSpec[] = [
	{
		name: 'addw',
		format: 'R',
		opcode: 0b0111011,
		funct3: 0b000,
		funct7: 0b0000000,
		operandPattern: 'rd_rs1_rs2'
	},
	{
		name: 'subw',
		format: 'R',
		opcode: 0b0111011,
		funct3: 0b000,
		funct7: 0b0100000,
		operandPattern: 'rd_rs1_rs2'
	},
	{
		name: 'sllw',
		format: 'R',
		opcode: 0b0111011,
		funct3: 0b001,
		funct7: 0b0000000,
		operandPattern: 'rd_rs1_rs2'
	},
	{
		name: 'srlw',
		format: 'R',
		opcode: 0b0111011,
		funct3: 0b101,
		funct7: 0b0000000,
		operandPattern: 'rd_rs1_rs2'
	},
	{
		name: 'sraw',
		format: 'R',
		opcode: 0b0111011,
		funct3: 0b101,
		funct7: 0b0100000,
		operandPattern: 'rd_rs1_rs2'
	}
];

const loadInstructions: InstructionSpec[] = [
	{
		name: 'lwu',
		format: 'I',
		opcode: 0b0000011,
		funct3: 0b110,
		operandPattern: 'rd_mem'
	},
	{
		name: 'ld',
		format: 'I',
		opcode: 0b0000011,
		funct3: 0b011,
		operandPattern: 'rd_mem'
	}
];

const storeInstructions: InstructionSpec[] = [
	{
		name: 'sd',
		format: 'S',
		opcode: 0b0100011,
		funct3: 0b011,
		operandPattern: 'rs2_mem'
	}
];

export const rv64iInstructions: InstructionSpec[] = [
	...wordImmediateInstructions,
	...wordRegisterInstructions,
	...loadInstructions,
	...storeInstructions
];
