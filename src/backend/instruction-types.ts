export type InstructionFormat = 'R' | 'I' | 'S' | 'B' | 'U' | 'J' | 'FR' | 'FI' | 'FS';

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
	| 'rd_csr_imm5'
	| 'rd_rs1_imm6'
	| 'rd_rs1'
	| 'fd_fs1_fs2'
	| 'fd_fs1'
	| 'fd_rs1'
	| 'fs2_fs1_rs1'
	| 'rd_fs1'
	| 'rd_fs1_fs2';

export type XLen = 32 | 64 | 128;
export type XLenMode = 'auto' | XLen;

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
	minXlen?: XLen;
}
