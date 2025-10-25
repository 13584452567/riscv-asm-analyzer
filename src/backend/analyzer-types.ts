import type { XLenMode, XLen } from './instruction-set';

export interface AnalyzerOptions {
	xlen?: XLenMode;
}

export interface AnalyzerResultBase {
	detectedXlen: XLen;
	mode: XLenMode;
}
