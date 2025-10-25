import type { XLenMode, XLen } from './instruction-set';

export interface AnalyzerOptions {
	xlen?: XLenMode;
	isEmbedded?: boolean;
	floatEnabled?: boolean;
	doubleEnabled?: boolean;
	quadEnabled?: boolean;
	vlen?: number; // Vector Length (VLEN)
}

export interface AnalyzerResultBase {
	detectedXlen: XLen;
	mode: XLenMode;
	floatEnabled?: boolean;
	doubleEnabled?: boolean;
	quadEnabled?: boolean;
	vlen?: number;
}
