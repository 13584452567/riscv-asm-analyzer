import type { InstructionSpec } from './instruction-types';
import { rv32iInstructions } from './instruction-sets/rv32i';
import { rv64iInstructions } from './instruction-sets/rv64i';
import { rv32mInstructions, rv64mInstructions } from './instruction-sets/rvm';
import { rvbInstructions } from './instruction-sets/rvb';
import { rv128iInstructions } from './instruction-sets/rv128i';
import { rv32eInstructions } from './instruction-sets/rv32e';
import { rv64eInstructions } from './instruction-sets/rv64e';
import { rvaInstructions } from './instruction-sets/rva';
import { rvfInstructions } from './instruction-sets/rvf';
import { rvdInstructions } from './instruction-sets/rvd';

export { InstructionFormat, OperandPattern, InstructionSpec, XLen, XLenMode } from './instruction-types';

const instructionGroups: InstructionSpec[][] = [
	rv32iInstructions,
	rv32mInstructions,
	rv64iInstructions,
	rv64mInstructions,
	rvbInstructions,
	rvfInstructions,
	rvdInstructions,
	rv128iInstructions,
	rv32eInstructions,
	rv64eInstructions,
	rvaInstructions
];

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
