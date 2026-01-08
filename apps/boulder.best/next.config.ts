// @ts-check

import { composePlugins, withNx } from '@nx/next';

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
	// Use this to set Nx-specific options
	// See: https://nx.dev/recipes/next/next-config-setup
	nx: {},
	typescript: {
		// !! WARN !!
		// Dangerously allow production builds to successfully complete even if
		// your project has type errors.
		// !! WARN !!
		ignoreBuildErrors: true,
	},
};

const plugins = [
	// Add more Next.js plugins to this list if needed.
	withNx,
];

export default composePlugins(...plugins)(nextConfig);
