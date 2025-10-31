import type { InstructionSpec } from "../instruction-types"

// RISC-V Double-Precision Floating-Point Extension (RVD) Instructions
// Based on RISC-V D Double-Precision Floating-Point Extension Specification

// Double-Precision Floating-Point Load/Store Instructions
const doublePrecisionLoadStoreInstructions: InstructionSpec[] = [
    {
        name: "fld",
        format: "FI",
        opcode: 0b0000111,
        funct3: 0b011,
        operandPattern: "rd_mem",
        minXlen: 32,
    },
    {
        name: "fsd",
        format: "FS",
        opcode: 0b0100111,
        funct3: 0b011,
        operandPattern: "rs2_mem",
        minXlen: 32,
    },
]

// Double-Precision Floating-Point Arithmetic Instructions
const doublePrecisionArithmeticInstructions: InstructionSpec[] = [
    {
        name: "fadd.d",
        format: "FR",
        opcode: 0b1010011,
        funct7: 0b0000001,
        funct3: 0b000,
        operandPattern: "fd_fs1_fs2",
        minXlen: 32,
    },
    {
        name: "fsub.d",
        format: "FR",
        opcode: 0b1010011,
        funct7: 0b0000101,
        funct3: 0b000,
        operandPattern: "fd_fs1_fs2",
        minXlen: 32,
    },
    {
        name: "fmul.d",
        format: "FR",
        opcode: 0b1010011,
        funct7: 0b0001001,
        funct3: 0b000,
        operandPattern: "fd_fs1_fs2",
        minXlen: 32,
    },
    {
        name: "fdiv.d",
        format: "FR",
        opcode: 0b1010011,
        funct7: 0b0001101,
        funct3: 0b000,
        operandPattern: "fd_fs1_fs2",
        minXlen: 32,
    },
    {
        name: "fsqrt.d",
        format: "FR",
        opcode: 0b1010011,
        funct7: 0b0101101,
        funct3: 0b000,
        operandPattern: "fd_fs1",
        minXlen: 32,
    },
    {
        name: "fsgnj.d",
        format: "FR",
        opcode: 0b1010011,
        funct7: 0b0010001,
        funct3: 0b000,
        operandPattern: "fd_fs1_fs2",
        minXlen: 32,
    },
    {
        name: "fsgnjn.d",
        format: "FR",
        opcode: 0b1010011,
        funct7: 0b0010001,
        funct3: 0b001,
        operandPattern: "fd_fs1_fs2",
        minXlen: 32,
    },
    {
        name: "fsgnjx.d",
        format: "FR",
        opcode: 0b1010011,
        funct7: 0b0010001,
        funct3: 0b010,
        operandPattern: "fd_fs1_fs2",
        minXlen: 32,
    },
    {
        name: "fmin.d",
        format: "FR",
        opcode: 0b1010011,
        funct7: 0b0010101,
        funct3: 0b000,
        operandPattern: "fd_fs1_fs2",
        minXlen: 32,
    },
    {
        name: "fmax.d",
        format: "FR",
        opcode: 0b1010011,
        funct7: 0b0010101,
        funct3: 0b001,
        operandPattern: "fd_fs1_fs2",
        minXlen: 32,
    },
]

// Double-Precision Floating-Point Comparison Instructions
const doublePrecisionComparisonInstructions: InstructionSpec[] = [
    {
        name: "feq.d",
        format: "FR",
        opcode: 0b1010011,
        funct7: 0b1010001,
        funct3: 0b010,
        operandPattern: "rd_fs1_fs2",
        minXlen: 32,
    },
    {
        name: "flt.d",
        format: "FR",
        opcode: 0b1010011,
        funct7: 0b1010001,
        funct3: 0b001,
        operandPattern: "rd_fs1_fs2",
        minXlen: 32,
    },
    {
        name: "fle.d",
        format: "FR",
        opcode: 0b1010011,
        funct7: 0b1010001,
        funct3: 0b000,
        operandPattern: "rd_fs1_fs2",
        minXlen: 32,
    },
]

// Double-Precision Floating-Point Conversion Instructions
const doublePrecisionConversionInstructions: InstructionSpec[] = [
    {
        name: "fcvt.w.d",
        format: "FR",
        opcode: 0b1010011,
        funct7: 0b1100001,
        funct3: 0b000,
        operandPattern: "rd_fs1",
        minXlen: 32,
    },
    {
        name: "fcvt.wu.d",
        format: "FR",
        opcode: 0b1010011,
        funct7: 0b1100001,
        funct3: 0b001,
        operandPattern: "rd_fs1",
        minXlen: 32,
    },
    {
        name: "fcvt.d.w",
        format: "FR",
        opcode: 0b1010011,
        funct7: 0b1101001,
        funct3: 0b000,
        operandPattern: "fd_rs1",
        minXlen: 32,
    },
    {
        name: "fcvt.d.wu",
        format: "FR",
        opcode: 0b1010011,
        funct7: 0b1101001,
        funct3: 0b001,
        operandPattern: "fd_rs1",
        minXlen: 32,
    },
    {
        name: "fcvt.l.d",
        format: "FR",
        opcode: 0b1010011,
        funct7: 0b1100001,
        funct3: 0b010,
        operandPattern: "rd_fs1",
        minXlen: 64,
    },
    {
        name: "fcvt.lu.d",
        format: "FR",
        opcode: 0b1010011,
        funct7: 0b1100001,
        funct3: 0b011,
        operandPattern: "rd_fs1",
        minXlen: 64,
    },
    {
        name: "fcvt.d.l",
        format: "FR",
        opcode: 0b1010011,
        funct7: 0b1101001,
        funct3: 0b010,
        operandPattern: "fd_rs1",
        minXlen: 64,
    },
    {
        name: "fcvt.d.lu",
        format: "FR",
        opcode: 0b1010011,
        funct7: 0b1101001,
        funct3: 0b011,
        operandPattern: "fd_rs1",
        minXlen: 64,
    },
    {
        name: "fcvt.s.d",
        format: "FR",
        opcode: 0b1010011,
        funct7: 0b0100000,
        funct3: 0b001,
        operandPattern: "fd_fs1",
        minXlen: 32,
    },
    {
        name: "fcvt.d.s",
        format: "FR",
        opcode: 0b1010011,
        funct7: 0b0100001,
        funct3: 0b000,
        operandPattern: "fd_fs1",
        minXlen: 32,
    },
]

// Double-Precision Floating-Point Move Instructions
const doublePrecisionMoveInstructions: InstructionSpec[] = [
    {
        name: "fmv.x.d",
        format: "FR",
        opcode: 0b1010011,
        funct7: 0b1110001,
        funct3: 0b000,
        operandPattern: "rd_fs1",
        minXlen: 64,
    },
    {
        name: "fmv.d.x",
        format: "FR",
        opcode: 0b1010011,
        funct7: 0b1111001,
        funct3: 0b000,
        operandPattern: "fd_rs1",
        minXlen: 64,
    },
]

// Double-Precision Floating-Point Classification Instruction
const doublePrecisionClassificationInstructions: InstructionSpec[] = [
    {
        name: "fclass.d",
        format: "FR",
        opcode: 0b1010011,
        funct7: 0b1110001,
        funct3: 0b001,
        operandPattern: "rd_fs1",
        minXlen: 32,
    },
]

export const rvdInstructions: InstructionSpec[] = [
    ...doublePrecisionLoadStoreInstructions,
    ...doublePrecisionArithmeticInstructions,
    ...doublePrecisionComparisonInstructions,
    ...doublePrecisionConversionInstructions,
    ...doublePrecisionMoveInstructions,
    ...doublePrecisionClassificationInstructions,
]
