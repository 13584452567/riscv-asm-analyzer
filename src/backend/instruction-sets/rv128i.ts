import type { InstructionSpec } from '../instruction-types';

const loadStoreInstructions: InstructionSpec[] = [
	{
		name: 'lq',
		format: 'I',
		opcode: 0b0000011,
		funct3: 0b010,
		operandPattern: 'rd_mem',
		minXlen: 128
	},
	{
		name: 'sq',
		format: 'S',
		opcode: 0b0100011,
		funct3: 0b010,
		operandPattern: 'rs2_mem',
		minXlen: 128
	}
];

export const rv128iInstructions: InstructionSpec[] = [...loadStoreInstructions];
