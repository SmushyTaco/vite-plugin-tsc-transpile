import { defineConfig } from 'vite';
import viteTscPlugin from './src/index.js';
import dts from 'vite-plugin-dts';
import { fileURLToPath } from 'url';
import path from 'path';

export default defineConfig({
    build: {
        lib: {
            entry: path.resolve(
                path.dirname(fileURLToPath(import.meta.url)),
                'src/index.ts'
            ),
            formats: ['es', 'cjs'],
            fileName: (format) => (format === 'es' ? 'index.mjs' : 'index.cjs')
        },
        rollupOptions: {
            external: ['vite', 'typescript', 'path']
        },
        sourcemap: true,
        minify: false
    },
    plugins: [viteTscPlugin(), dts()]
});
