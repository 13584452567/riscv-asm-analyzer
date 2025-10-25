export type InstructionFormat =
	| 'R'
	| 'I'
	| 'S'
	| 'B'
	| 'U'
	| 'J'
	| 'FR'
	| 'FI'
	| 'FS'
	| 'FR4'
	| 'CR'
	| 'CI'
	| 'CSS'
	| 'CIW'
	| 'CL'
	| 'CS'
	| 'CA'
	| 'CB'
	| 'CJ';

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
	| 'rd_fs1_fs2'
	| 'fd_fs1_fs2_fs3'
	| 'rd_rs2'
	| 'rd_nzimm6'
	| 'rs2_nzimm6'
	| 'rd_rs1_nzuimm6'
	| 'rd_nzuimm6'
	| 'rd_rs1_nzimm6'
	| 'rd_rs1_nzimm5'
	| 'rd_nzimm5'
	| 'rs1_rs2_nzimm5'
	| 'rd_nzimm11'
	| 'rs1_nzimm5'
	| 'rd_rs1_rs2';

export type XLen = 32 | 64 | 128;
export type XLenMode = 'auto' | XLen;

export interface InstructionSpec {
	name: string;
	format: InstructionFormat;
	opcode: number;
	funct2?: number;
	funct3?: number;
	funct4?: number;
	funct6?: number;
	funct7?: number;
	operandPattern: OperandPattern;
	immBits?: number;
	unsignedImmediate?: boolean;
	fixedImmediate?: number;
	minXlen?: XLen;
}
