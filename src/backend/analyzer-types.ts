import type { XLenMode, XLen } from './instruction-set';

export interface AnalyzerOptions {
	xlen?: XLenMode;
	isEmbedded?: boolean;
	floatEnabled?: boolean;
	doubleEnabled?: boolean;
	quadEnabled?: boolean;
	vlen?: number; // Vector Length (VLEN)
	// Preferred numeric output base. 'hex' for 0x... (default), 'dec' for decimal
	numberBase?: 'hex' | 'dec';
}

export interface AnalyzerResultBase {
	detectedXlen: XLen;
	mode: XLenMode;
	floatEnabled?: boolean;
	doubleEnabled?: boolean;
	quadEnabled?: boolean;
	vlen?: number;
}
