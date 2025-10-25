import { AnalyzerError } from './errors';

export function signExtend(value: number, bits: number): number {
	const shift = 32 - bits;
	return (value << shift) >> shift;
}

export function parseImmediate(
	token: string,
	opts: { bits: number; signed?: boolean; line?: number; label?: string }
): number {
	const { bits, signed = true, line, label = 'immediate' } = opts;
	const sanitized = token.trim();
	if (!sanitized) {
		throw new AnalyzerError(`Missing ${label}`, line);
	}
	const value = parseNumericLiteral(sanitized, line, label);
	validateImmediateRange(value, bits, signed, line, label);
	return value;
}

export function parseNumericLiteral(token: string, line?: number, label = 'value'): number {
	const cleaned = token.replace(/_/g, '').toLowerCase();
	let parsed: number;
	if (/^0x[0-9a-f]+$/.test(cleaned)) {
		parsed = Number.parseInt(cleaned.slice(2), 16);
	} else if (/^0b[01]+$/.test(cleaned)) {
		parsed = Number.parseInt(cleaned.slice(2), 2);
	} else if (/^-?\d+$/.test(cleaned)) {
		parsed = Number.parseInt(cleaned, 10);
	} else {
		throw new AnalyzerError(`Invalid ${label} '${token}'`, line);
	}
	if (!Number.isFinite(parsed)) {
		throw new AnalyzerError(`Invalid ${label} '${token}'`, line);
	}
	return parsed;
}

function validateImmediateRange(
	value: number,
	bits: number,
	signed: boolean,
	line?: number,
	label = 'immediate'
): void {
	const max = signed ? (1 << (bits - 1)) - 1 : (1 << bits) - 1;
	const min = signed ? -(1 << (bits - 1)) : 0;
	if (value < min || value > max) {
		throw new AnalyzerError(`Out of range ${label} '${value}' for ${bits}-bit ${signed ? 'signed' : 'unsigned'} field`, line);
	}
}

export function formatHex(value: number): string {
	const normalized = value >>> 0;
	return `0x${normalized.toString(16).padStart(8, '0')}`;
}
