import perfectionist from 'eslint-plugin-perfectionist';
import { defineConfig } from 'eslint/config';

import baseConfig from './eslint.base.config.mjs';

export default defineConfig([
	...baseConfig,
	{
		ignores: [
			'**/dist',
			'**/out-tsc',
			'**/test-output',
			'**/vite.config.*.timestamp*',
			'**/.next',
		],
	},
	{
		files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
		rules: {
			'@nx/enforce-module-boundaries': [
				'error',
				{
					allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
					depConstraints: [
						{
							onlyDependOnLibsWithTags: ['*'],
							sourceTag: '*',
						},
					],
					enforceBuildableLibDependency: true,
				},
			],
		},
	},
	perfectionist.configs['recommended-natural'],
	{
		files: [
			'**/*.ts',
			'**/*.tsx',
			'**/*.cts',
			'**/*.mts',
			'**/*.js',
			'**/*.jsx',
			'**/*.cjs',
			'**/*.mjs',
		],
		// Override or add rules here
		rules: {},
	},
	{
		files: ['**/*.ts', '**/*.tsx', '**/*.cts', '**/*.mts'],
		languageOptions: {
			parserOptions: {
				projectService: true,
			},
		},
	},
]);
