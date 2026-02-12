#!/usr/bin/env node
import favicons from 'favicons';
import { access, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const rootDir = join(import.meta.dirname, '..');

try {
	console.log('🎨 Generating all favicon variants from logo.svg...');

	const source = join(rootDir, 'public', 'logo.svg');
	const publicDir = join(rootDir, 'public');
	const outputDir = join(rootDir, 'public', 'manifest');

	// Verify the source logo file exists
	try {
		await access(source);
	} catch {
		console.error(`❌ Source file not found: ${source}`);
		console.error('   Please ensure logo.svg exists in the public directory.');
		process.exit(1);
	}

	// Ensure the output directory exists
	await mkdir(outputDir, { recursive: true });

	/** @type {import('favicons').FaviconOptions} */
	const configuration = {
		appDescription: 'Best boulder tracking and climbing app',
		appleStatusBarStyle: 'black-translucent',
		appName: 'Boulder Best',
		appShortName: 'Boulder',
		background: '#ffffff',
		display: 'standalone',
		icons: {
			android: true, // Android homescreen icon
			appleIcon: true, // Apple touch icons
			appleStartup: false, // Apple startup images (usually not needed)
			favicons: true, // Regular favicons
			windows: true, // Windows tiles
			yandex: false, // Yandex browser
		},
		orientation: 'any',
		path: '/manifest/',
		scope: '/',
		start_url: '/',
		theme_color: '#FF4FD8',
	};

	const response = await favicons(source, configuration);

	await Promise.all([
		...response.images.map((image) =>
			writeFile(
				join(image.name === 'favicon.ico' ? publicDir : outputDir, image.name),
				image.contents,
			),
		),
		...response.files.map((file) => writeFile(join(outputDir, file.name), file.contents)),
		writeFile(join(rootDir, 'src', 'app', 'favicon-meta.txt'), response.html.join('\n')),
	]);

	console.log('✅ Generated favicons in public/manifest/:');
	response.images.forEach((img) => console.log(`   📄 ${img.name}`));
	response.files.forEach((file) => console.log(`   📄 ${file.name}`));
	console.log(`\n💡 HTML meta tags saved to: src/app/favicon-meta.txt`);
	console.log('   Note: All icons are served from /manifest/ path.');
} catch (error) {
	console.error('❌ Error generating favicons:', error);
	process.exit(1);
}
