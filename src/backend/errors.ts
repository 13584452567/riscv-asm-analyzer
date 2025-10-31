export class AnalyzerError extends Error {
    public readonly line?: number

    constructor(message: string, line?: number) {
        super(line ? `Line ${line}: ${message}` : message)
        this.name = "AnalyzerError"
        this.line = line
    }
}
