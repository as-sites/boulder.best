import nx from '@nx/eslint-plugin';
import perfectionist from 'eslint-plugin-perfectionist';

export default [
	...nx.configs['flat/base'],
	...nx.configs['flat/typescript'],
	...nx.configs['flat/javascript'],
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
		plugins: {},
		// Override or add rules here
		rules: {},
	},
];
