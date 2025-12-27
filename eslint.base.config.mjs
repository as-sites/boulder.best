import nx from '@nx/eslint-plugin';
import perfectionist from 'eslint-plugin-perfectionist';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig([
	...nx.configs['flat/base'],
	...nx.configs['flat/typescript'],
	...nx.configs['flat/javascript'],
	{
		ignores: ['**/dist', '**/out-tsc'],
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
		rules: {
			'@typescript-eslint/no-import-type-side-effects': 'error',
			'no-restricted-imports': [
				'error',
				{
					paths: [
						{
							importNames: ['default'],
							message: 'Use named imports instead: import { useState } from "react";',
							name: 'react',
						},
					],
					patterns: [
						{
							group: ['react'],
							importNamePattern: '^\\*$',
							message:
								'Use named imports instead of namespace imports: import { useState } from "react";',
						},
					],
				},
			],
		},
	},
	tseslint.configs.disableTypeChecked,
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
		rules: {
			'arrow-body-style': ['error', 'as-needed'],
		},
	},
]);

const reactConfig = defineConfig([
	{
		files: ['**/*.ts', '**/*.tsx', '**/*.cts', '**/*.mts'],
		rules: {
			'react/forward-ref-uses-ref': 'error',
			'react/function-component-definition': [
				'error',
				{
					namedComponents: 'arrow-function',
					unnamedComponents: 'arrow-function',
				},
			],
			'react/hook-use-state': 'error',
			'react/jsx-fragments': ['error', 'syntax'],
			'react/jsx-handler-names': 'error',
			'react/jsx-no-useless-fragment': 'error',
			'react/jsx-pascal-case': 'error',
		},
	},
]);

export { reactConfig as react };
