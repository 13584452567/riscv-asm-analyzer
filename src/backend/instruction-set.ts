import type { InstructionSpec } from './instruction-types';
import { rv32iInstructions } from './instruction-sets/rv32i';
import { rv64iInstructions } from './instruction-sets/rv64i';
import { rvbInstructions } from './instruction-sets/rvb';

export { InstructionFormat, OperandPattern, InstructionSpec } from './instruction-types';

const instructionGroups: InstructionSpec[][] = [rv32iInstructions, rv64iInstructions, rvbInstructions];

export const instructionSet: InstructionSpec[] = instructionGroups.flat();

export const instructionsByName = new Map<string, InstructionSpec>(
	instructionSet.map(spec => [spec.name, spec])
);

export const instructionsByOpcode = new Map<number, InstructionSpec[]>(
	instructionSet.reduce((acc, spec) => {
		const list = acc.get(spec.opcode) ?? [];
		list.push(spec);
		acc.set(spec.opcode, list);
		return acc;
	}, new Map<number, InstructionSpec[]>())
);
