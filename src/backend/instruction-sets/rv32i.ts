import type { InstructionSpec } from '../instruction-types';

const rTypeInstructions: InstructionSpec[] = [
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
		name: 'sll',
		format: 'R',
		opcode: 0b0110011,
		funct3: 0b001,
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
		name: 'xor',
		format: 'R',
		opcode: 0b0110011,
		funct3: 0b100,
		funct7: 0b0000000,
		operandPattern: 'rd_rs1_rs2'
	},
	{
		name: 'srl',
		format: 'R',
		opcode: 0b0110011,
		funct3: 0b101,
		funct7: 0b0000000,
		operandPattern: 'rd_rs1_rs2'
	},
	{
		name: 'sra',
		format: 'R',
		opcode: 0b0110011,
		funct3: 0b101,
		funct7: 0b0100000,
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
		name: 'and',
		format: 'R',
		opcode: 0b0110011,
		funct3: 0b111,
		funct7: 0b0000000,
		operandPattern: 'rd_rs1_rs2'
	}
];

const immediateInstructions: InstructionSpec[] = [
	{
		name: 'addi',
		format: 'I',
		opcode: 0b0010011,
		funct3: 0b000,
		operandPattern: 'rd_rs1_imm12'
	},
	{
		name: 'slti',
		format: 'I',
		opcode: 0b0010011,
		funct3: 0b010,
		operandPattern: 'rd_rs1_imm12'
	},
	{
		name: 'sltiu',
		format: 'I',
		opcode: 0b0010011,
		funct3: 0b011,
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
		name: 'ori',
		format: 'I',
		opcode: 0b0010011,
		funct3: 0b110,
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
		name: 'slli',
		format: 'I',
		opcode: 0b0010011,
		funct3: 0b001,
		funct7: 0b0000000,
		operandPattern: 'rd_rs1_imm12',
		immBits: 5,
		unsignedImmediate: true
	},
	{
		name: 'srli',
		format: 'I',
		opcode: 0b0010011,
		funct3: 0b101,
		funct7: 0b0000000,
		operandPattern: 'rd_rs1_imm12',
		immBits: 5,
		unsignedImmediate: true
	},
	{
		name: 'srai',
		format: 'I',
		opcode: 0b0010011,
		funct3: 0b101,
		funct7: 0b0100000,
		operandPattern: 'rd_rs1_imm12',
		immBits: 5,
		unsignedImmediate: true
	},
	{
		name: 'jalr',
		format: 'I',
		opcode: 0b1100111,
		funct3: 0b000,
		operandPattern: 'rd_rs1_imm12'
	}
];

const loadInstructions: InstructionSpec[] = [
	{
		name: 'lb',
		format: 'I',
		opcode: 0b0000011,
		funct3: 0b000,
		operandPattern: 'rd_mem'
	},
	{
		name: 'lh',
		format: 'I',
		opcode: 0b0000011,
		funct3: 0b001,
		operandPattern: 'rd_mem'
	},
	{
		name: 'lw',
		format: 'I',
		opcode: 0b0000011,
		funct3: 0b010,
		operandPattern: 'rd_mem'
	},
	{
		name: 'lbu',
		format: 'I',
		opcode: 0b0000011,
		funct3: 0b100,
		operandPattern: 'rd_mem'
	},
	{
		name: 'lhu',
		format: 'I',
		opcode: 0b0000011,
		funct3: 0b101,
		operandPattern: 'rd_mem'
	}
];

const storeInstructions: InstructionSpec[] = [
	{
		name: 'sb',
		format: 'S',
		opcode: 0b0100011,
		funct3: 0b000,
		operandPattern: 'rs2_mem'
	},
	{
		name: 'sh',
		format: 'S',
		opcode: 0b0100011,
		funct3: 0b001,
		operandPattern: 'rs2_mem'
	},
	{
		name: 'sw',
		format: 'S',
		opcode: 0b0100011,
		funct3: 0b010,
		operandPattern: 'rs2_mem'
	}
];

const branchInstructions: InstructionSpec[] = [
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
		name: 'bltu',
		format: 'B',
		opcode: 0b1100011,
		funct3: 0b110,
		operandPattern: 'rs1_rs2_branch',
		immBits: 13
	},
	{
		name: 'bgeu',
		format: 'B',
		opcode: 0b1100011,
		funct3: 0b111,
		operandPattern: 'rs1_rs2_branch',
		immBits: 13
	}
];

const systemInstructions: InstructionSpec[] = [
	{
		name: 'fence',
		format: 'I',
		opcode: 0b0001111,
		funct3: 0b000,
		operandPattern: 'fence',
		immBits: 12,
		unsignedImmediate: true
	},
	{
		name: 'fence.i',
		format: 'I',
		opcode: 0b0001111,
		funct3: 0b001,
		operandPattern: 'none',
		immBits: 12,
		unsignedImmediate: true,
		fixedImmediate: 0x100
	},
	{
		name: 'ecall',
		format: 'I',
		opcode: 0b1110011,
		funct3: 0b000,
		operandPattern: 'none',
		immBits: 12,
		fixedImmediate: 0x000
	},
	{
		name: 'ebreak',
		format: 'I',
		opcode: 0b1110011,
		funct3: 0b000,
		operandPattern: 'none',
		immBits: 12,
		fixedImmediate: 0x001
	},
	{
		name: 'csrrw',
		format: 'I',
		opcode: 0b1110011,
		funct3: 0b001,
		operandPattern: 'rd_csr_rs1'
	},
	{
		name: 'csrrs',
		format: 'I',
		opcode: 0b1110011,
		funct3: 0b010,
		operandPattern: 'rd_csr_rs1'
	},
	{
		name: 'csrrc',
		format: 'I',
		opcode: 0b1110011,
		funct3: 0b011,
		operandPattern: 'rd_csr_rs1'
	},
	{
		name: 'csrrwi',
		format: 'I',
		opcode: 0b1110011,
		funct3: 0b101,
		operandPattern: 'rd_csr_imm5',
		immBits: 12,
		unsignedImmediate: true
	},
	{
		name: 'csrrsi',
		format: 'I',
		opcode: 0b1110011,
		funct3: 0b110,
		operandPattern: 'rd_csr_imm5',
		immBits: 12,
		unsignedImmediate: true
	},
	{
		name: 'csrrci',
		format: 'I',
		opcode: 0b1110011,
		funct3: 0b111,
		operandPattern: 'rd_csr_imm5',
		immBits: 12,
		unsignedImmediate: true
	}
];

const upperAndJumpInstructions: InstructionSpec[] = [
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

export const rv32iInstructions: InstructionSpec[] = [
	...rTypeInstructions,
	...immediateInstructions,
	...loadInstructions,
	...storeInstructions,
	...branchInstructions,
	...systemInstructions,
	...upperAndJumpInstructions
];
