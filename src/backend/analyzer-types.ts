import type { XLenMode, XLen } from './instruction-set';

export interface AnalyzerOptions {
	xlen?: XLenMode;
	isEmbedded?: boolean;
	vectorEnabled?: boolean;
	floatEnabled?: boolean;
	vlen?: number; // Vector Length (VLEN)
}

export interface AnalyzerResultBase {
	detectedXlen: XLen;
	mode: XLenMode;
	vectorEnabled?: boolean;
	floatEnabled?: boolean;
	vlen?: number;
}
