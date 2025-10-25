import type { InstructionSpec } from '../instruction-types';

// RISC-V Vector Extension (RVV)

// Vector Configuration Instructions
const rvvConfigurationInstructions: InstructionSpec[] = [
	{
		name: 'vsetvli',
		format: 'V',
		opcode: 0b1010111,
		funct3: 0b111,
		operandPattern: 'rd_rs1_imm',
		minXlen: 32
	},
	{
		name: 'vsetvl',
		format: 'R',
		opcode: 0b1010111,
		funct3: 0b111,
		operandPattern: 'rd_rs1_rs2',
		minXlen: 32
	}
];

// Vector Arithmetic Instructions
const rvvArithmeticInstructions: InstructionSpec[] = [
	// Vector-Vector Operations
	{
		name: 'vadd.vv',
		format: 'V',
		opcode: 0b1010111,
		funct6: 0b000000,
		funct3: 0b000,
		operandPattern: 'vd_vs1_vs2',
		vm: true,
		minXlen: 32
	},
	{
		name: 'vadd.vv.mask',
		format: 'V',
		opcode: 0b1010111,
		funct6: 0b000000,
		funct3: 0b000,
		operandPattern: 'vd_vs1_vs2_vm',
		vm: false,
		minXlen: 32
	},
	{
		name: 'vsub.vv',
		format: 'V',
		opcode: 0b1010111,
		funct6: 0b000010,
		funct3: 0b000,
		operandPattern: 'vd_vs1_vs2',
		vm: true,
		minXlen: 32
	},
	{
		name: 'vmin.vv',
		format: 'V',
		opcode: 0b1010111,
		funct6: 0b000101,
		funct3: 0b000,
		operandPattern: 'vd_vs1_vs2',
		vm: true,
		minXlen: 32
	},
	{
		name: 'vmax.vv',
		format: 'V',
		opcode: 0b1010111,
		funct6: 0b000111,
		funct3: 0b000,
		operandPattern: 'vd_vs1_vs2',
		vm: true,
		minXlen: 32
	},
	{
		name: 'vmul.vv',
		format: 'V',
		opcode: 0b1010111,
		funct6: 0b100101,
		funct3: 0b000,
		operandPattern: 'vd_vs1_vs2',
		vm: true,
		minXlen: 32
	},
	{
		name: 'vdiv.vv',
		format: 'V',
		opcode: 0b1010111,
		funct6: 0b100000,
		funct3: 0b000,
		operandPattern: 'vd_vs1_vs2',
		vm: true,
		minXlen: 32
	},
	{
		name: 'vrem.vv',
		format: 'V',
		opcode: 0b1010111,
		funct6: 0b100001,
		funct3: 0b000,
		operandPattern: 'vd_vs1_vs2',
		vm: true,
		minXlen: 32
	},

	// Vector-Scalar Operations
	{
		name: 'vadd.vx',
		format: 'V',
		opcode: 0b1010111,
		funct6: 0b000000,
		funct3: 0b100,
		operandPattern: 'vd_vs1_rs2',
		vm: true,
		minXlen: 32
	},
	{
		name: 'vsub.vx',
		format: 'V',
		opcode: 0b1010111,
		funct6: 0b000010,
		funct3: 0b100,
		operandPattern: 'vd_vs1_rs2',
		vm: true,
		minXlen: 32
	},
	{
		name: 'vmul.vx',
		format: 'V',
		opcode: 0b1010111,
		funct6: 0b100101,
		funct3: 0b100,
		operandPattern: 'vd_vs1_rs2',
		vm: true,
		minXlen: 32
	},

	// Vector-Immediate Operations
	{
		name: 'vadd.vi',
		format: 'V',
		opcode: 0b1010111,
		funct6: 0b000000,
		funct3: 0b011,
		operandPattern: 'vd_vs1_imm',
		vm: true,
		minXlen: 32
	}
];

// Vector Logic Instructions
const rvvLogicInstructions: InstructionSpec[] = [
	{
		name: 'vand.vv',
		format: 'V',
		opcode: 0b1010111,
		funct6: 0b001001,
		funct3: 0b000,
		operandPattern: 'vd_vs1_vs2',
		vm: true,
		minXlen: 32
	},
	{
		name: 'vor.vv',
		format: 'V',
		opcode: 0b1010111,
		funct6: 0b001010,
		funct3: 0b000,
		operandPattern: 'vd_vs1_vs2',
		vm: true,
		minXlen: 32
	},
	{
		name: 'vxor.vv',
		format: 'V',
		opcode: 0b1010111,
		funct6: 0b001011,
		funct3: 0b000,
		operandPattern: 'vd_vs1_vs2',
		vm: true,
		minXlen: 32
	},
	{
		name: 'vand.vx',
		format: 'V',
		opcode: 0b1010111,
		funct6: 0b001001,
		funct3: 0b100,
		operandPattern: 'vd_vs1_rs2',
		vm: true,
		minXlen: 32
	},
	{
		name: 'vor.vx',
		format: 'V',
		opcode: 0b1010111,
		funct6: 0b001010,
		funct3: 0b100,
		operandPattern: 'vd_vs1_rs2',
		vm: true,
		minXlen: 32
	},
	{
		name: 'vxor.vx',
		format: 'V',
		opcode: 0b1010111,
		funct6: 0b001011,
		funct3: 0b100,
		operandPattern: 'vd_vs1_rs2',
		vm: true,
		minXlen: 32
	}
];

// Vector Shift Instructions
const rvvShiftInstructions: InstructionSpec[] = [
	{
		name: 'vsll.vv',
		format: 'V',
		opcode: 0b1010111,
		funct6: 0b100101,
		funct3: 0b000,
		operandPattern: 'vd_vs1_vs2',
		vm: true,
		minXlen: 32
	},
	{
		name: 'vsrl.vv',
		format: 'V',
		opcode: 0b1010111,
		funct6: 0b101000,
		funct3: 0b000,
		operandPattern: 'vd_vs1_vs2',
		vm: true,
		minXlen: 32
	},
	{
		name: 'vsra.vv',
		format: 'V',
		opcode: 0b1010111,
		funct6: 0b101001,
		funct3: 0b000,
		operandPattern: 'vd_vs1_vs2',
		vm: true,
		minXlen: 32
	},
	{
		name: 'vsll.vx',
		format: 'V',
		opcode: 0b1010111,
		funct6: 0b100101,
		funct3: 0b100,
		operandPattern: 'vd_vs1_rs2',
		vm: true,
		minXlen: 32
	},
	{
		name: 'vsrl.vx',
		format: 'V',
		opcode: 0b1010111,
		funct6: 0b101000,
		funct3: 0b100,
		operandPattern: 'vd_vs1_rs2',
		vm: true,
		minXlen: 32
	},
	{
		name: 'vsra.vx',
		format: 'V',
		opcode: 0b1010111,
		funct6: 0b101001,
		funct3: 0b100,
		operandPattern: 'vd_vs1_rs2',
		vm: true,
		minXlen: 32
	}
];

// Vector Comparison Instructions
const rvvComparisonInstructions: InstructionSpec[] = [
	{
		name: 'vmseq.vv',
		format: 'V',
		opcode: 0b1010111,
		funct6: 0b011000,
		funct3: 0b000,
		operandPattern: 'vd_vs1_vs2',
		vm: true,
		minXlen: 32
	},
	{
		name: 'vmsne.vv',
		format: 'V',
		opcode: 0b1010111,
		funct6: 0b011001,
		funct3: 0b000,
		operandPattern: 'vd_vs1_vs2',
		vm: true,
		minXlen: 32
	},
	{
		name: 'vmslt.vv',
		format: 'V',
		opcode: 0b1010111,
		funct6: 0b011011,
		funct3: 0b000,
		operandPattern: 'vd_vs1_vs2',
		vm: true,
		minXlen: 32
	},
	{
		name: 'vmsle.vv',
		format: 'V',
		opcode: 0b1010111,
		funct6: 0b011101,
		funct3: 0b000,
		operandPattern: 'vd_vs1_vs2',
		vm: true,
		minXlen: 32
	},
	{
		name: 'vmseq.vx',
		format: 'V',
		opcode: 0b1010111,
		funct6: 0b011000,
		funct3: 0b100,
		operandPattern: 'vd_vs1_rs2',
		vm: true,
		minXlen: 32
	},
	{
		name: 'vmsne.vx',
		format: 'V',
		opcode: 0b1010111,
		funct6: 0b011001,
		funct3: 0b100,
		operandPattern: 'vd_vs1_rs2',
		vm: true,
		minXlen: 32
	}
];

// Vector Load/Store Instructions
const rvvLoadStoreInstructions: InstructionSpec[] = [
	{
		name: 'vle8.v',
		format: 'VL',
		opcode: 0b0000111,
		funct3: 0b000,
		operandPattern: 'vd_mem',
		minXlen: 32
	},
	{
		name: 'vle16.v',
		format: 'VL',
		opcode: 0b0000111,
		funct3: 0b101,
		operandPattern: 'vd_mem',
		minXlen: 32
	},
	{
		name: 'vle32.v',
		format: 'VL',
		opcode: 0b0000111,
		funct3: 0b110,
		operandPattern: 'vd_mem',
		minXlen: 32
	},
	{
		name: 'vle64.v',
		format: 'VL',
		opcode: 0b0000111,
		funct3: 0b111,
		operandPattern: 'vd_mem',
		minXlen: 64
	},
	{
		name: 'vse8.v',
		format: 'VS',
		opcode: 0b0100111,
		funct3: 0b000,
		operandPattern: 'vs_mem',
		minXlen: 32
	},
	{
		name: 'vse16.v',
		format: 'VS',
		opcode: 0b0100111,
		funct3: 0b101,
		operandPattern: 'vs_mem',
		minXlen: 32
	},
	{
		name: 'vse32.v',
		format: 'VS',
		opcode: 0b0100111,
		funct3: 0b110,
		operandPattern: 'vs_mem',
		minXlen: 32
	},
	{
		name: 'vse64.v',
		format: 'VS',
		opcode: 0b0100111,
		funct3: 0b111,
		operandPattern: 'vs_mem',
		minXlen: 64
	}
];

// Vector Reduction Instructions
const rvvReductionInstructions: InstructionSpec[] = [
	{
		name: 'vredsum.vs',
		format: 'V',
		opcode: 0b1010111,
		funct6: 0b000000,
		funct3: 0b010,
		operandPattern: 'vd_vs1_vs2',
		vm: true,
		minXlen: 32
	},
	{
		name: 'vredmax.vs',
		format: 'V',
		opcode: 0b1010111,
		funct6: 0b000111,
		funct3: 0b010,
		operandPattern: 'vd_vs1_vs2',
		vm: true,
		minXlen: 32
	},
	{
		name: 'vredmin.vs',
		format: 'V',
		opcode: 0b1010111,
		funct6: 0b000101,
		funct3: 0b010,
		operandPattern: 'vd_vs1_vs2',
		vm: true,
		minXlen: 32
	}
];

export const rvvInstructions: InstructionSpec[] = [
	...rvvConfigurationInstructions,
	...rvvArithmeticInstructions,
	...rvvLogicInstructions,
	...rvvShiftInstructions,
	...rvvComparisonInstructions,
	...rvvLoadStoreInstructions,
	...rvvReductionInstructions
];
