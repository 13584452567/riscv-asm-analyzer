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

const eCanonicalNames = [
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
	'a5'
] as const;

const aliasToNumber = new Map<string, number>();

for (let i = 0; i < canonicalNames.length; i += 1) {
	const alias = canonicalNames[i];
	aliasToNumber.set(alias, i);
	aliasToNumber.set(`x${i}`, i);
}

const eAliasToNumber = new Map<string, number>();

for (let i = 0; i < eCanonicalNames.length; i += 1) {
	const alias = eCanonicalNames[i];
	eAliasToNumber.set(alias, i);
	eAliasToNumber.set(`x${i}`, i);
}

export function parseRegister(token: string, isEmbedded: boolean = false): number {
	const normalized = token.trim().toLowerCase();
	if (!normalized) {
		throw new Error('Missing register operand');
	}
	const aliasMap = isEmbedded ? eAliasToNumber : aliasToNumber;
	const value = aliasMap.get(normalized);
	if (typeof value === 'number') {
		return value;
	}
	throw new Error(`Unknown register '${token}'`);
}

export function formatRegister(register: number, isEmbedded: boolean = false): string {
	if (Number.isInteger(register) && register >= 0 && register < 32) {
		return `x${register}`;
	}
	return `x${register & (isEmbedded ? 0xf : 0x1f)}`;
}

export function parseFloatRegister(token: string): number {
	const normalized = token.trim().toLowerCase();
	if (!normalized) {
		throw new Error('Missing float register operand');
	}
	if (normalized.startsWith('f')) {
		const num = parseInt(normalized.slice(1), 10);
		if (!isNaN(num) && num >= 0 && num < 32) {
			return num;
		}
	}
	throw new Error(`Unknown float register '${token}'`);
}

export function formatFloatRegister(register: number): string {
	if (Number.isInteger(register) && register >= 0 && register < 32) {
		return `f${register}`;
	}
	return `f${register & 0x1f}`;
}

export function parseVectorRegister(token: string): number {
	const trimmed = token.trim();
	const match = trimmed.match(/^v(\d+)$/);
	if (!match) {
		throw new Error(`Invalid vector register '${token}'`);
	}
	const regNum = parseInt(match[1], 10);
	if (regNum < 0 || regNum > 31) {
		throw new Error(`Vector register number ${regNum} out of range (0-31)`);
	}
	return regNum;
}

export function formatVectorRegister(register: number): string {
	if (Number.isInteger(register) && register >= 0 && register < 32) {
		return `v${register}`;
	}
	return `v${register & 0x1f}`;
}
