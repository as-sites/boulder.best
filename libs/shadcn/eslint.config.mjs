import nx from '@nx/eslint-plugin';
import baseConfig from '../../eslint.base.config.mjs';

export default [
	...baseConfig,
	{
		files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
		languageOptions: {
			parserOptions: {
				project: ['libs/shadcn/tsconfig.*?.json'],
			},
		},
	},
	...nx.configs['flat/react'],
	{
		files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
		// Override or add rules here
		rules: {},
	},
	{
		ignores: ['**/out-tsc'],
	},
];
