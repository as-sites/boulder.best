import next from '@next/eslint-plugin-next';
import nx from '@nx/eslint-plugin';

import baseConfig, { react } from '../../eslint.base.config.mjs';

export default [
	...baseConfig,
	...nx.configs['flat/react-typescript'],
	{
		ignores: ['.next/**/*', '**/out-tsc'],
	},
	next.configs.recommended,
	...react,
];
