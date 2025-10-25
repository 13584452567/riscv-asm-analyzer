import type { InstructionSpec } from '../instruction-types';

const wordImmediateInstructions: InstructionSpec[] = [
	{
		name: 'addiw',
		format: 'I',
		opcode: 0b0011011,
		funct3: 0b000,
		operandPattern: 'rd_rs1_imm12',
		minXlen: 64
	},
	{
		name: 'slliw',
		format: 'I',
		opcode: 0b0011011,
		funct3: 0b001,
		funct7: 0b0000000,
		operandPattern: 'rd_rs1_imm12',
		immBits: 5,
		unsignedImmediate: true,
		minXlen: 64
	},
	{
		name: 'srliw',
		format: 'I',
		opcode: 0b0011011,
		funct3: 0b101,
		funct7: 0b0000000,
		operandPattern: 'rd_rs1_imm12',
		immBits: 5,
		unsignedImmediate: true,
		minXlen: 64
	},
	{
		name: 'sraiw',
		format: 'I',
		opcode: 0b0011011,
		funct3: 0b101,
		funct7: 0b0100000,
		operandPattern: 'rd_rs1_imm12',
		immBits: 5,
		unsignedImmediate: true,
		minXlen: 64
	}
];

const wordRegisterInstructions: InstructionSpec[] = [
	{
		name: 'addw',
		format: 'R',
		opcode: 0b0111011,
		funct3: 0b000,
		funct7: 0b0000000,
		operandPattern: 'rd_rs1_rs2',
		minXlen: 64
	},
	{
		name: 'subw',
		format: 'R',
		opcode: 0b0111011,
		funct3: 0b000,
		funct7: 0b0100000,
		operandPattern: 'rd_rs1_rs2',
		minXlen: 64
	},
	{
		name: 'sllw',
		format: 'R',
		opcode: 0b0111011,
		funct3: 0b001,
		funct7: 0b0000000,
		operandPattern: 'rd_rs1_rs2',
		minXlen: 64
	},
	{
		name: 'srlw',
		format: 'R',
		opcode: 0b0111011,
		funct3: 0b101,
		funct7: 0b0000000,
		operandPattern: 'rd_rs1_rs2',
		minXlen: 64
	},
	{
		name: 'sraw',
		format: 'R',
		opcode: 0b0111011,
		funct3: 0b101,
		funct7: 0b0100000,
		operandPattern: 'rd_rs1_rs2',
		minXlen: 64
	}
];

const loadInstructions: InstructionSpec[] = [
	{
		name: 'lwu',
		format: 'I',
		opcode: 0b0000011,
		funct3: 0b110,
		operandPattern: 'rd_mem',
		minXlen: 64
	},
	{
		name: 'ld',
		format: 'I',
		opcode: 0b0000011,
		funct3: 0b011,
		operandPattern: 'rd_mem',
		minXlen: 64
	}
];

const storeInstructions: InstructionSpec[] = [
	{
		name: 'sd',
		format: 'S',
		opcode: 0b0100011,
		funct3: 0b011,
		operandPattern: 'rs2_mem',
		minXlen: 64
	}
];

export const rv64iInstructions: InstructionSpec[] = [
	...wordImmediateInstructions,
	...wordRegisterInstructions,
	...loadInstructions,
	...storeInstructions
];
