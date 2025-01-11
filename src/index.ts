import { Plugin } from 'vite';
import ts from 'typescript';
import path from 'node:path';

type ViteTscPluginOptions = {
    tsConfigPath?: string; // Optional parameter to specify custom tsconfig path
};

function viteTscPlugin(options: ViteTscPluginOptions = {}): Plugin {
    let sourcemapOption: boolean | 'inline' | 'hidden' = false;

    return {
        name: 'vite-plugin-tsc',
        enforce: 'pre', // Ensure this runs before other plugins

        configResolved(config) {
            // Capture the sourcemap option from Vite's build configuration
            sourcemapOption = config.build.sourcemap;
        },

        async transform(code, id) {
            // Only process TypeScript files
            if (!id.endsWith('.ts') && !id.endsWith('.tsx')) {
                return;
            }

            // Resolve the TypeScript configuration
            const tsConfigPath =
                options.tsConfigPath ??
                ts.findConfigFile(
                    path.dirname(id),
                    ts.sys.fileExists,
                    'tsconfig.json'
                );

            if (!tsConfigPath) {
                throw new Error('Unable to find tsconfig.json');
            }

            const tsConfig = ts.readConfigFile(tsConfigPath, ts.sys.readFile);
            if (tsConfig.error) {
                throw new Error(
                    `Error reading tsconfig.json: ${ts.flattenDiagnosticMessageText(tsConfig.error.messageText, '\n', 4)}`
                );
            }

            const compilerOptions = ts.parseJsonConfigFileContent(
                tsConfig.config,
                ts.sys,
                path.dirname(tsConfigPath)
            ).options;

            // Create a program to check for type errors
            const program = ts.createProgram([id], compilerOptions);
            const diagnostics = ts.getPreEmitDiagnostics(program);

            if (diagnostics.length > 0) {
                const formattedDiagnostics =
                    ts.formatDiagnosticsWithColorAndContext(diagnostics, {
                        getCanonicalFileName: (fileName) => fileName,
                        getCurrentDirectory: ts.sys.getCurrentDirectory,
                        getNewLine: () => ts.sys.newLine
                    });
                throw new Error(`TypeScript Errors:\n${formattedDiagnostics}`);
            }

            // Transpile the code using TypeScript
            const output = ts.transpileModule(code, {
                compilerOptions: {
                    ...compilerOptions,
                    module: ts.ModuleKind.ESNext, // Ensure Vite-compatible output
                    sourceMap: !!sourcemapOption // Enable source map if required
                },
                fileName: id
            });

            let map = output.sourceMapText
                ? JSON.parse(output.sourceMapText)
                : undefined;

            if (sourcemapOption === 'inline' && output.sourceMapText) {
                // Append the source map as a data URI
                const base64Map = Buffer.from(
                    output.sourceMapText || ''
                ).toString('base64');
                output.outputText += `\n//# sourceMappingURL=data:application/json;base64,${base64Map}`;
            } else if (sourcemapOption === 'hidden') {
                // Suppress the sourcemap comment but include the map
                map = { ...map, file: undefined };
            }

            // Return the transpiled code and sourcemap
            return {
                code: output.outputText,
                map
            };
        },

        configureServer(server) {
            server.watcher.on('change', (filePath) => {
                if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
                    const module = server.moduleGraph.getModuleById(filePath);
                    if (module) {
                        server.moduleGraph.invalidateModule(module);
                    }
                }
            });
        }
    };
}

export default viteTscPlugin;
