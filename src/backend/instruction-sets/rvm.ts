import type { InstructionSpec } from "../instruction-types"

const rv32mBase: InstructionSpec[] = [
    {
        name: "mul",
        format: "R",
        opcode: 0b0110011,
        funct3: 0b000,
        funct7: 0b0000001,
        operandPattern: "rd_rs1_rs2",
    },
    {
        name: "mulh",
        format: "R",
        opcode: 0b0110011,
        funct3: 0b001,
        funct7: 0b0000001,
        operandPattern: "rd_rs1_rs2",
    },
    {
        name: "mulhsu",
        format: "R",
        opcode: 0b0110011,
        funct3: 0b010,
        funct7: 0b0000001,
        operandPattern: "rd_rs1_rs2",
    },
    {
        name: "mulhu",
        format: "R",
        opcode: 0b0110011,
        funct3: 0b011,
        funct7: 0b0000001,
        operandPattern: "rd_rs1_rs2",
    },
    {
        name: "div",
        format: "R",
        opcode: 0b0110011,
        funct3: 0b100,
        funct7: 0b0000001,
        operandPattern: "rd_rs1_rs2",
    },
    {
        name: "divu",
        format: "R",
        opcode: 0b0110011,
        funct3: 0b101,
        funct7: 0b0000001,
        operandPattern: "rd_rs1_rs2",
    },
    {
        name: "rem",
        format: "R",
        opcode: 0b0110011,
        funct3: 0b110,
        funct7: 0b0000001,
        operandPattern: "rd_rs1_rs2",
    },
    {
        name: "remu",
        format: "R",
        opcode: 0b0110011,
        funct3: 0b111,
        funct7: 0b0000001,
        operandPattern: "rd_rs1_rs2",
    },
]

const rv64mWord: InstructionSpec[] = [
    {
        name: "mulw",
        format: "R",
        opcode: 0b0111011,
        funct3: 0b000,
        funct7: 0b0000001,
        operandPattern: "rd_rs1_rs2",
        minXlen: 64,
    },
    {
        name: "divw",
        format: "R",
        opcode: 0b0111011,
        funct3: 0b100,
        funct7: 0b0000001,
        operandPattern: "rd_rs1_rs2",
        minXlen: 64,
    },
    {
        name: "divuw",
        format: "R",
        opcode: 0b0111011,
        funct3: 0b101,
        funct7: 0b0000001,
        operandPattern: "rd_rs1_rs2",
        minXlen: 64,
    },
    {
        name: "remw",
        format: "R",
        opcode: 0b0111011,
        funct3: 0b110,
        funct7: 0b0000001,
        operandPattern: "rd_rs1_rs2",
        minXlen: 64,
    },
    {
        name: "remuw",
        format: "R",
        opcode: 0b0111011,
        funct3: 0b111,
        funct7: 0b0000001,
        operandPattern: "rd_rs1_rs2",
        minXlen: 64,
    },
]

export const rv32mInstructions: InstructionSpec[] = [...rv32mBase]
export const rv64mInstructions: InstructionSpec[] = [...rv64mWord]
