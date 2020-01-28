import ts from "typescript";
import { ProjectOptions } from "./../TSTransformer/types";
import { transformSourceFile } from "./../TSTransformer/nodes/sourceFile";
import { TransformState } from "./../TSTransformer/TransformState";

function createParseConfigFileHost(): ts.ParseConfigFileHost {
	return {
		fileExists: ts.sys.fileExists,
		getCurrentDirectory: ts.sys.getCurrentDirectory,
		onUnRecoverableConfigFileDiagnostic: d => console.error(ts.flattenDiagnosticMessageText(d.messageText, "\n")),
		readDirectory: ts.sys.readDirectory,
		readFile: ts.sys.readFile,
		useCaseSensitiveFileNames: true,
	};
}

export class Project {
	private readonly program: ts.Program;

	constructor(tsConfigPath: string, options: ProjectOptions) {
		const parsedCommandLine = ts.getParsedCommandLineOfConfigFile(tsConfigPath, {}, createParseConfigFileHost());
		if (parsedCommandLine === undefined) throw new Error();
		this.program = ts.createProgram({
			rootNames: parsedCommandLine.fileNames,
			options: parsedCommandLine.options,
		});
	}

	public compile() {
		for (const sourceFile of this.program.getSourceFiles()) {
			if (!sourceFile.isDeclarationFile) {
				transformSourceFile(new TransformState(), sourceFile);
			}
		}
	}
}