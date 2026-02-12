import { fixupPluginRules } from '@eslint/compat';
import next from '@next/eslint-plugin-next';
import importPlugin from 'eslint-plugin-import';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import perfectionist from 'eslint-plugin-perfectionist';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import tsEslint from 'typescript-eslint';

export default defineConfig([
	// ──────────────────────────────────────────────────────────────────
	// Next.js (includes eslint:recommended, @typescript-eslint/recommended,
	// react, react-hooks, jsx-a11y, import, and next rules)
	// ──────────────────────────────────────────────────────────────────

	{
		// Default files, users can overwrite this.
		files: ['**/*.ts', '**/*.tsx', '**/*.cts', '**/*.mts'],
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
			},
			parser: tseslint.parser,
			parserOptions: {
				allowImportExportEverywhere: true,
				// TODO: Is this needed?
				babelOptions: {
					caller: {
						// Eslint supports top level await when a parser for it is included. We enable the parser by default for Babel.
						supportsTopLevelAwait: true,
					},
					presets: ['next/babel'],
				},
				requireConfigFile: false,
				sourceType: 'module',
			},
		},
		name: 'next',
		plugins: {
			'@next/next': next,
			import: importPlugin,
			'jsx-a11y': jsxA11yPlugin,
			react: fixupPluginRules(react),
			'react-hooks': reactHooks,
		},
		rules: {
			...react.configs.recommended.rules,
			...reactHooks.configs.recommended.rules,
			...next.configs.recommended.rules,
			'import/no-anonymous-default-export': 'warn',
			'jsx-a11y/alt-text': [
				'warn',
				{
					elements: ['img'],
					img: ['Image'],
				},
			],
			'jsx-a11y/aria-props': 'warn',
			'jsx-a11y/aria-proptypes': 'warn',
			'jsx-a11y/aria-unsupported-elements': 'warn',
			'jsx-a11y/role-has-required-aria-props': 'warn',
			'jsx-a11y/role-supports-aria-props': 'warn',
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
			'react/jsx-no-target-blank': 'off',
			'react/jsx-no-useless-fragment': 'error',
			'react/jsx-pascal-case': 'error',
			'react/no-unknown-property': 'off',
			'react/prop-types': 'off',
			'react/react-in-jsx-scope': 'off',
		},
		settings: {
			'import/parsers': {
				'@typescript-eslint/parser': ['.ts', '.mts', '.cts', '.tsx', '.d.ts'],
			},
			'import/resolver': {
				node: {
					extensions: ['.js', '.jsx', '.ts', '.tsx'],
				},
				typescript: {
					alwaysTryTypes: true,
				},
			},
			react: {
				version: 'detect',
			},
		},
	},
	{
		// Default files, users can overwrite this.
		files: ['**/*.ts', '**/*.tsx'],
		languageOptions: {
			parser: tsEslint.parser,
			parserOptions: {
				sourceType: 'module',
			},
		},
		name: 'next/typescript',
		plugins: {
			'@typescript-eslint': tsEslint.plugin,
		},
	},
	// Global ignores, users can add more `ignores` or overwrite this by `!<ignore>`.
	{
		ignores: [
			// node_modules/ and .git/ are ignored by default.
			// https://eslint.org/docs/latest/use/configure/configuration-files#globally-ignoring-files-with-ignores
			'.next/**',
			'out/**',
			'build/**',
			'next-env.d.ts',
		],
	},

	// Override default ignores of eslint-config-next
	globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),

	{
		ignores: ['**/dist', '**/out-tsc', '**/test-output', '**/vite.config.*.timestamp*'],
	},

	// ──────────────────────────────────────────────────────────────────
	// TypeScript type-checked + stylistic rules (with project service)
	// https://typescript-eslint.io/users/configs
	// ──────────────────────────────────────────────────────────────────
	...tseslint.configs.recommendedTypeChecked,
	...tseslint.configs.stylisticTypeChecked,
	{
		languageOptions: {
			parserOptions: {
				projectService: true,
			},
		},
	},

	// ──────────────────────────────────────────────────────────────────
	// Rules from @nx/eslint-plugin flat/typescript
	// https://github.com/nrwl/nx/blob/master/packages/eslint-plugin/src/flat-configs/typescript.ts
	// ──────────────────────────────────────────────────────────────────
	{
		files: ['**/*.ts', '**/*.tsx', '**/*.cts', '**/*.mts'],
		rules: {
			'@typescript-eslint/adjacent-overload-signatures': 'error',
			'@typescript-eslint/explicit-function-return-type': 'off',
			'@typescript-eslint/explicit-member-accessibility': 'off',
			'@typescript-eslint/explicit-module-boundary-types': 'off',
			'@typescript-eslint/no-empty-function': 'error',
			'@typescript-eslint/no-empty-interface': 'error',
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/no-inferrable-types': 'error',
			'@typescript-eslint/no-non-null-assertion': 'warn',
			'@typescript-eslint/no-parameter-properties': 'off',
			'@typescript-eslint/no-require-imports': 'off',
			'@typescript-eslint/no-unused-vars': 'warn',
			'@typescript-eslint/prefer-namespace-keyword': 'error',
			'no-empty-function': 'off',
		},
	},

	// ──────────────────────────────────────────────────────────────────
	// Rules from @nx/eslint-plugin flat/javascript
	// https://github.com/nrwl/nx/blob/master/packages/eslint-plugin/src/flat-configs/javascript.ts
	// ──────────────────────────────────────────────────────────────────
	{
		files: ['**/*.js', '**/*.jsx', '**/*.cjs', '**/*.mjs'],
		rules: {
			'@typescript-eslint/adjacent-overload-signatures': 'error',
			'@typescript-eslint/explicit-function-return-type': 'off',
			'@typescript-eslint/explicit-member-accessibility': 'off',
			'@typescript-eslint/explicit-module-boundary-types': 'off',
			'@typescript-eslint/no-empty-function': 'error',
			'@typescript-eslint/no-empty-interface': 'error',
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/no-inferrable-types': 'error',
			'@typescript-eslint/no-non-null-assertion': 'warn',
			'@typescript-eslint/no-parameter-properties': 'off',
			'@typescript-eslint/no-require-imports': 'off',
			'@typescript-eslint/no-unused-vars': 'warn',
			'@typescript-eslint/no-var-requires': 'off',
			'@typescript-eslint/prefer-namespace-keyword': 'error',
			'no-empty-function': 'off',
		},
	},

	// ──────────────────────────────────────────────────────────────────
	// Rules from @nx/eslint-plugin flat/react-typescript
	// https://github.com/nrwl/nx/blob/master/packages/eslint-plugin/src/flat-configs/react-typescript.ts
	// ──────────────────────────────────────────────────────────────────
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
		rules: {
			'@typescript-eslint/no-array-constructor': 'warn',
			'@typescript-eslint/no-namespace': 'error',
			'@typescript-eslint/no-unused-expressions': [
				'error',
				{
					allowShortCircuit: true,
					allowTaggedTemplates: true,
					allowTernary: true,
				},
			],

			'@typescript-eslint/no-unused-vars': [
				'warn',
				{
					args: 'none',
					ignoreRestSiblings: true,
				},
			],
			'@typescript-eslint/no-use-before-define': [
				'warn',
				{
					classes: false,
					functions: false,
					typedefs: false,
					variables: false,
				},
			],
			'@typescript-eslint/no-useless-constructor': 'warn',
			// TypeScript's noFallthroughCasesInSwitch option is more robust
			'default-case': 'off',
			// TypeScript equivalents of ESLint rules
			'no-array-constructor': 'off',
			// tsc already handles these
			'no-dupe-class-members': 'off',
			'no-undef': 'off',
			'no-unused-vars': 'off',
			'no-use-before-define': 'off',
			'no-useless-constructor': 'off',
		},
	},

	// ──────────────────────────────────────────────────────────────────
	// Perfectionist (import/object/type sorting)
	// ──────────────────────────────────────────────────────────────────
	{
		extends: [perfectionist.configs['recommended-natural']],
		rules: {
			'perfectionist/sort-imports': [
				'error',
				{
					newlinesBetween: 0,
				},
			],
		},
	},

	// ──────────────────────────────────────────────────────────────────
	// Custom rules
	// ──────────────────────────────────────────────────────────────────
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
		rules: {
			'@typescript-eslint/no-import-type-side-effects': 'error',
		},
	},

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
		rules: {
			'arrow-body-style': ['error', 'as-needed'],
			'object-shorthand': ['error', 'always'],
		},
	},

	// ──────────────────────────────────────────────────────────────────
	// App route overrides (merged from apps/boulder.best/eslint.config.mjs)
	// Default exports are required for Next.js page/layout components
	// ──────────────────────────────────────────────────────────────────
	{
		files: ['src/app/**/*.tsx', 'src/app/**/*.ts'],
		rules: {
			'react/function-component-definition': 'off',
		},
	},

	{
		files: ['prettier.config.mjs', 'postcss.config.mjs', 'eslint.config.mjs', 'next.config.ts'],
		rules: {
			'import/no-anonymous-default-export': 'off',
		},
	},
	// ──────────────────────────────────────────────────────────────────
	// Disable annoying type-checked & stylistic rules
	// ──────────────────────────────────────────────────────────────────
	{
		rules: {
			// Warns on floating (unhandled) promises — useful but noisy; use void prefix to silence
			'@typescript-eslint/no-floating-promises': 'warn',
			'@typescript-eslint/no-misused-promises': 'off',
			// The no-unsafe-* family: extremely noisy when any `any` types exist
			'@typescript-eslint/no-unsafe-argument': 'off',
			'@typescript-eslint/no-unsafe-assignment': 'off',
			'@typescript-eslint/no-unsafe-call': 'off',
			'@typescript-eslint/no-unsafe-member-access': 'off',
		},
	},

	// ──────────────────────────────────────────────────────────────────
	// Disable type-checked rules for JS files (configs, scripts, etc.)
	// Must be last so it overrides any type-checked rules re-enabled above
	// ──────────────────────────────────────────────────────────────────
	{
		extends: [tseslint.configs.disableTypeChecked],
		files: ['**/*.js', '**/*.jsx', '**/*.cjs', '**/*.mjs'],
	},
	{
		files: ['src/components/shadcn/**/*.tsx'],
		rules: {
			'@typescript-eslint/prefer-nullish-coalescing': 'off',
			'react/hook-use-state': 'off',
		},
	},
]);
