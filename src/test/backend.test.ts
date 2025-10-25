import * as assert from 'assert';
import { assemble, disassemble, AnalyzerError } from '../backend';

describe('RISC-V assembler backend', () => {
	it('assembles addi instruction', () => {
		const result = assemble('addi x1, x0, 1');
		assert.strictEqual(result, '0x00100093');
	});

	it('assembles multiple instructions preserving order', () => {
		const source = ['addi x1, x0, 1', 'add x3, x1, x2', 'sw x3, 0(x0)'].join('\n');
		const result = assemble(source).split('\n');
		assert.deepStrictEqual(result, ['0x00100093', '0x002081b3', '0x00302023']);
	});

	it('reports line information on assembly errors', () => {
		try {
			assemble('addi wrong, x0, 1');
			assert.fail('Expected to throw');
		} catch (error) {
			assert.ok(error instanceof AnalyzerError);
			assert.match(error.message, /Line 1/);
		}
	});
});

describe('RISC-V disassembler backend', () => {
	it('disassembles addi instruction', () => {
		const result = disassemble('0x00100093');
		assert.strictEqual(result, 'addi x1, x0, 1');
	});

	it('disassembles jal instruction', () => {
		const result = disassemble('0x000000ef');
		assert.strictEqual(result, 'jal x1, 0');
	});

	it('round-trips assemble/disassemble', () => {
		const source = ['addi x5, x0, 8', 'sw x5, 0(x2)', 'beq x5, x0, 8'].join('\n');
		const machine = assemble(source);
		const assembly = disassemble(machine);
		const lines = assembly.split('\n');
		assert.strictEqual(lines.length, 3);
		assert.strictEqual(lines[0], 'addi x5, x0, 8');
	});
});
