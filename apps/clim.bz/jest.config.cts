const nextJest = require('next/jest.js');

const createJestConfig = nextJest({
	dir: './',
});

const config = {
	coverageDirectory: '../../coverage/apps/clim.bz',
	displayName: 'clim.bz',
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
	preset: '../../jest.preset.js',
	testEnvironment: 'jsdom',
	transform: {
		'^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
	},
};

module.exports = createJestConfig(config);
