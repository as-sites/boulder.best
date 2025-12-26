import react from '@vitejs/plugin-react-swc';
import * as path from 'path';
/// <reference types='vitest' />
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig(() => ({
	// Uncomment this if you are using workers.
	// worker: {
	//  plugins: [],
	// },
	// Configuration for building your library.
	// See: https://vite.dev/guide/build.html#library-mode
	build: {
		commonjsOptions: {
			transformMixedEsModules: true,
		},
		emptyOutDir: true,
		lib: {
			// Could also be a dictionary or array of multiple entry points.
			entry: 'src/index.ts',
			fileName: 'index',
			// Change this to the formats you want to support.
			// Don't forget to update your package.json as well.
			formats: ['es' as const],
			name: '@clim.bz/ui',
		},
		outDir: './dist',
		reportCompressedSize: true,
		rollupOptions: {
			// External packages that should not be bundled into your library.
			external: ['react', 'react-dom', 'react/jsx-runtime'],
		},
	},
	cacheDir: '../../node_modules/.vite/libs/ui',
	plugins: [
		react(),
		dts({
			entryRoot: 'src',
			tsconfigPath: path.join(import.meta.dirname, 'tsconfig.lib.json'),
		}),
	],
	root: import.meta.dirname,
}));
