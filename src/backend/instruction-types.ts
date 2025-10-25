export type InstructionFormat = 'R' | 'I' | 'S' | 'B' | 'U' | 'J';

export type OperandPattern =
	| 'rd_rs1_rs2'
	| 'rd_rs1_imm12'
	| 'rd_mem'
	| 'rs2_mem'
	| 'rs1_rs2_branch'
	| 'rd_imm20'
	| 'rd_jump'
	| 'none'
	| 'fence'
	| 'rd_csr_rs1'
	| 'rd_csr_imm5';

export interface InstructionSpec {
	name: string;
	format: InstructionFormat;
	opcode: number;
	funct3?: number;
	funct7?: number;
	operandPattern: OperandPattern;
	immBits?: number;
	unsignedImmediate?: boolean;
	fixedImmediate?: number;
}
