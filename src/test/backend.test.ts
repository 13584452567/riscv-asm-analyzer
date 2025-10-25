import * as assert from 'assert';
import { assemble, disassemble, AnalyzerError } from '../backend';

describe('RISC-V assembler backend', () => {
	it('assembles addi instruction', () => {
		const result = assemble('addi x1, x0, 1');
		assert.strictEqual(result, '0x00100093');
	});

	it('assembles slli instruction with shamt', () => {
		const result = assemble('slli x5, x6, 3');
		assert.strictEqual(result, '0x00319293');
	});

	it('assembles addiw instruction', () => {
		const result = assemble('addiw x1, x2, -1');
		assert.strictEqual(result, '0xfff1009b');
	});

	it('assembles slliw instruction', () => {
		const result = assemble('slliw x3, x4, 7');
		assert.strictEqual(result, '0x0072119b');
	});

	it('assembles addw instruction', () => {
		const result = assemble('addw x5, x6, x7');
		assert.strictEqual(result, '0x007302bb');
	});

	it('assembles ld instruction', () => {
		const result = assemble('ld x8, 16(x9)');
		assert.strictEqual(result, '0x0104b403');
	});

	it('assembles sd instruction with negative offset', () => {
		const result = assemble('sd x10, -8(x11)');
		assert.strictEqual(result, '0xfea5bc23');
	});

	it('assembles fence instruction with default operands', () => {
		const result = assemble('fence');
		assert.strictEqual(result, '0x0ff0000f');
	});

	it('assembles csrrw instruction', () => {
		const result = assemble('csrrw x3, 0x305, x1');
		assert.strictEqual(result, '0x305091f3');
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

	it('disassembles slli instruction', () => {
		const result = disassemble('0x00319293');
		assert.strictEqual(result, 'slli x5, x6, 3');
	});

	it('disassembles addiw instruction', () => {
		const result = disassemble('0xfff1009b');
		assert.strictEqual(result, 'addiw x1, x2, -1');
	});

	it('disassembles slliw instruction', () => {
		const result = disassemble('0x0072119b');
		assert.strictEqual(result, 'slliw x3, x4, 7');
	});

	it('disassembles addw instruction', () => {
		const result = disassemble('0x007302bb');
		assert.strictEqual(result, 'addw x5, x6, x7');
	});

	it('disassembles ld instruction', () => {
		const result = disassemble('0x0104b403');
		assert.strictEqual(result, 'ld x8, 16(x9)');
	});

	it('disassembles sd instruction', () => {
		const result = disassemble('0xfea5bc23');
		assert.strictEqual(result, 'sd x10, -8(x11)');
	});

	it('disassembles jal instruction', () => {
		const result = disassemble('0x000000ef');
		assert.strictEqual(result, 'jal x1, 0');
	});

	it('disassembles fence instruction', () => {
		const result = disassemble('0x0ff0000f');
		assert.strictEqual(result, 'fence');
	});

	it('disassembles csrrw instruction', () => {
		const result = disassemble('0x305091f3');
		assert.strictEqual(result, 'csrrw x3, 0x305, x1');
	});

	it('disassembles ecall instruction', () => {
		const result = disassemble('0x00000073');
		assert.strictEqual(result, 'ecall');
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
