import * as assert from 'assert';
import * as vscode from 'vscode';

suite('RISC-V Analyzer Extension', () => {
	test('commands are registered', async () => {
		const commands = await vscode.commands.getCommands(true);
		assert.ok(commands.includes('riscv-asm-analyzer.openSidebar'));
		assert.ok(commands.includes('riscv-asm-analyzer.loadSelection'));
	});
});
