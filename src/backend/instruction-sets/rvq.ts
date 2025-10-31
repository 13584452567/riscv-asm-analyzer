import type { InstructionSpec } from "../instruction-types"

// RISC-V Quad-Precision Floating-Point Extension (RVQ) Instructions
// Based on RISC-V Q Quad-Precision Floating-Point Extension Specification

// Quad-Precision Floating-Point Load/Store Instructions
const quadPrecisionLoadStoreInstructions: InstructionSpec[] = [
    {
        name: "flq",
        format: "FI",
        opcode: 0b0000111,
        funct3: 0b100,
        operandPattern: "rd_mem",
        minXlen: 32,
    },
    {
        name: "fsq",
        format: "FS",
        opcode: 0b0100111,
        funct3: 0b100,
        operandPattern: "rs2_mem",
        minXlen: 32,
    },
]

// Quad-Precision Floating-Point Arithmetic Instructions
const quadPrecisionArithmeticInstructions: InstructionSpec[] = [
    {
        name: "fadd.q",
        format: "FR",
        opcode: 0b1010011,
        funct7: 0b0000011,
        funct3: 0b000,
        operandPattern: "fd_fs1_fs2",
        minXlen: 32,
    },
    {
        name: "fsub.q",
        format: "FR",
        opcode: 0b1010011,
        funct7: 0b0000111,
        funct3: 0b000,
        operandPattern: "fd_fs1_fs2",
        minXlen: 32,
    },
    {
        name: "fmul.q",
        format: "FR",
        opcode: 0b1010011,
        funct7: 0b0001011,
        funct3: 0b000,
        operandPattern: "fd_fs1_fs2",
        minXlen: 32,
    },
    {
        name: "fdiv.q",
        format: "FR",
        opcode: 0b1010011,
        funct7: 0b0001111,
        funct3: 0b000,
        operandPattern: "fd_fs1_fs2",
        minXlen: 32,
    },
    {
        name: "fsqrt.q",
        format: "FR",
        opcode: 0b1010011,
        funct7: 0b0101111,
        funct3: 0b000,
        operandPattern: "fd_fs1",
        minXlen: 32,
    },
    {
        name: "fsgnj.q",
        format: "FR",
        opcode: 0b1010011,
        funct7: 0b0010011,
        funct3: 0b000,
        operandPattern: "fd_fs1_fs2",
        minXlen: 32,
    },
    {
        name: "fsgnjn.q",
        format: "FR",
        opcode: 0b1010011,
        funct7: 0b0010011,
        funct3: 0b001,
        operandPattern: "fd_fs1_fs2",
        minXlen: 32,
    },
    {
        name: "fsgnjx.q",
        format: "FR",
        opcode: 0b1010011,
        funct7: 0b0010011,
        funct3: 0b010,
        operandPattern: "fd_fs1_fs2",
        minXlen: 32,
    },
    {
        name: "fmin.q",
        format: "FR",
        opcode: 0b1010011,
        funct7: 0b0010111,
        funct3: 0b000,
        operandPattern: "fd_fs1_fs2",
        minXlen: 32,
    },
    {
        name: "fmax.q",
        format: "FR",
        opcode: 0b1010011,
        funct7: 0b0010111,
        funct3: 0b001,
        operandPattern: "fd_fs1_fs2",
        minXlen: 32,
    },
]

// Quad-Precision Floating-Point Fused Multiply-Add Instructions
const quadPrecisionFusedMultiplyAddInstructions: InstructionSpec[] = [
    {
        name: "fmadd.q",
        format: "FR4",
        opcode: 0b1000011,
        funct2: 0b11,
        operandPattern: "fd_fs1_fs2_fs3",
        minXlen: 32,
    },
    {
        name: "fmsub.q",
        format: "FR4",
        opcode: 0b1000111,
        funct2: 0b11,
        operandPattern: "fd_fs1_fs2_fs3",
        minXlen: 32,
    },
    {
        name: "fnmsub.q",
        format: "FR4",
        opcode: 0b1001011,
        funct2: 0b11,
        operandPattern: "fd_fs1_fs2_fs3",
        minXlen: 32,
    },
    {
        name: "fnmadd.q",
        format: "FR4",
        opcode: 0b1001111,
        funct2: 0b11,
        operandPattern: "fd_fs1_fs2_fs3",
        minXlen: 32,
    },
]

// Quad-Precision Floating-Point Comparison Instructions
const quadPrecisionComparisonInstructions: InstructionSpec[] = [
    {
        name: "feq.q",
        format: "FR",
        opcode: 0b1010011,
        funct7: 0b1010011,
        funct3: 0b010,
        operandPattern: "rd_fs1_fs2",
        minXlen: 32,
    },
    {
        name: "flt.q",
        format: "FR",
        opcode: 0b1010011,
        funct7: 0b1010011,
        funct3: 0b001,
        operandPattern: "rd_fs1_fs2",
        minXlen: 32,
    },
    {
        name: "fle.q",
        format: "FR",
        opcode: 0b1010011,
        funct7: 0b1010011,
        funct3: 0b000,
        operandPattern: "rd_fs1_fs2",
        minXlen: 32,
    },
]

// Quad-Precision Floating-Point Conversion Instructions
const quadPrecisionConversionInstructions: InstructionSpec[] = [
    {
        name: "fcvt.w.q",
        format: "FR",
        opcode: 0b1010011,
        funct7: 0b1100011,
        funct3: 0b000,
        operandPattern: "rd_fs1",
        minXlen: 32,
    },
    {
        name: "fcvt.wu.q",
        format: "FR",
        opcode: 0b1010011,
        funct7: 0b1100011,
        funct3: 0b001,
        operandPattern: "rd_fs1",
        minXlen: 32,
    },
    {
        name: "fcvt.q.w",
        format: "FR",
        opcode: 0b1010011,
        funct7: 0b1101011,
        funct3: 0b000,
        operandPattern: "fd_rs1",
        minXlen: 32,
    },
    {
        name: "fcvt.q.wu",
        format: "FR",
        opcode: 0b1010011,
        funct7: 0b1101011,
        funct3: 0b001,
        operandPattern: "fd_rs1",
        minXlen: 32,
    },
    {
        name: "fcvt.l.q",
        format: "FR",
        opcode: 0b1010011,
        funct7: 0b1100011,
        funct3: 0b010,
        operandPattern: "rd_fs1",
        minXlen: 64,
    },
    {
        name: "fcvt.lu.q",
        format: "FR",
        opcode: 0b1010011,
        funct7: 0b1100011,
        funct3: 0b011,
        operandPattern: "rd_fs1",
        minXlen: 64,
    },
    {
        name: "fcvt.q.l",
        format: "FR",
        opcode: 0b1010011,
        funct7: 0b1101011,
        funct3: 0b010,
        operandPattern: "fd_rs1",
        minXlen: 64,
    },
    {
        name: "fcvt.q.lu",
        format: "FR",
        opcode: 0b1010011,
        funct7: 0b1101011,
        funct3: 0b011,
        operandPattern: "fd_rs1",
        minXlen: 64,
    },
    {
        name: "fcvt.s.q",
        format: "FR",
        opcode: 0b1010011,
        funct7: 0b0100000,
        funct3: 0b011,
        operandPattern: "fd_fs1",
        minXlen: 32,
    },
    {
        name: "fcvt.q.s",
        format: "FR",
        opcode: 0b1010011,
        funct7: 0b0100011,
        funct3: 0b000,
        operandPattern: "fd_fs1",
        minXlen: 32,
    },
    {
        name: "fcvt.d.q",
        format: "FR",
        opcode: 0b1010011,
        funct7: 0b0100001,
        funct3: 0b011,
        operandPattern: "fd_fs1",
        minXlen: 32,
    },
    {
        name: "fcvt.q.d",
        format: "FR",
        opcode: 0b1010011,
        funct7: 0b0100011,
        funct3: 0b001,
        operandPattern: "fd_fs1",
        minXlen: 32,
    },
]

// Quad-Precision Floating-Point Move Instructions
const quadPrecisionMoveInstructions: InstructionSpec[] = [
    {
        name: "fmv.x.q",
        format: "FR",
        opcode: 0b1010011,
        funct7: 0b1110011,
        funct3: 0b000,
        operandPattern: "rd_fs1",
        minXlen: 64,
    },
    {
        name: "fmv.q.x",
        format: "FR",
        opcode: 0b1010011,
        funct7: 0b1111011,
        funct3: 0b000,
        operandPattern: "fd_rs1",
        minXlen: 64,
    },
]

// Quad-Precision Floating-Point Classification Instruction
const quadPrecisionClassificationInstructions: InstructionSpec[] = [
    {
        name: "fclass.q",
        format: "FR",
        opcode: 0b1010011,
        funct7: 0b1110011,
        funct3: 0b001,
        operandPattern: "rd_fs1",
        minXlen: 32,
    },
]

export const rvqInstructions: InstructionSpec[] = [
    ...quadPrecisionLoadStoreInstructions,
    ...quadPrecisionArithmeticInstructions,
    ...quadPrecisionFusedMultiplyAddInstructions,
    ...quadPrecisionComparisonInstructions,
    ...quadPrecisionConversionInstructions,
    ...quadPrecisionMoveInstructions,
    ...quadPrecisionClassificationInstructions,
]
