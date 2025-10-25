const canonicalNames = [
	'zero',
	'ra',
	'sp',
	'gp',
	'tp',
	't0',
	't1',
	't2',
	's0',
	's1',
	'a0',
	'a1',
	'a2',
	'a3',
	'a4',
	'a5',
	'a6',
	'a7',
	's2',
	's3',
	's4',
	's5',
	's6',
	's7',
	's8',
	's9',
	's10',
	's11',
	't3',
	't4',
	't5',
	't6'
] as const;

const aliasToNumber = new Map<string, number>();

for (let i = 0; i < canonicalNames.length; i += 1) {
	const alias = canonicalNames[i];
	aliasToNumber.set(alias, i);
	aliasToNumber.set(`x${i}`, i);
}

export function parseRegister(token: string): number {
	const normalized = token.trim().toLowerCase();
	if (!normalized) {
		throw new Error('Missing register operand');
	}
	const value = aliasToNumber.get(normalized);
	if (typeof value === 'number') {
		return value;
	}
	throw new Error(`Unknown register '${token}'`);
}

export function formatRegister(register: number): string {
	if (Number.isInteger(register) && register >= 0 && register < 32) {
		return `x${register}`;
	}
	return `x${register & 0x1f}`;
}
