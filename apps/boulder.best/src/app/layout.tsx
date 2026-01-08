import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import '@boulder.best/shadcn/globals.css';

export const metadata: Metadata = {
	appleWebApp: {
		capable: true,
		statusBarStyle: 'black-translucent',
		title: 'Boulder Best',
	},
	applicationName: 'Boulder Best',
	description: 'Best boulder tracking and climbing app',
	icons: {
		apple: [{ sizes: '180x180', type: 'image/png', url: '/manifest/apple-touch-icon.png' }],
		icon: [
			{ sizes: '16x16', type: 'image/png', url: '/manifest/favicon-16x16.png' },
			{ sizes: '32x32', type: 'image/png', url: '/manifest/favicon-32x32.png' },
			{ sizes: '48x48', type: 'image/png', url: '/manifest/favicon-48x48.png' },
			{ sizes: 'any', url: '/manifest/favicon.ico' },
		],
	},
	manifest: '/manifest/site.webmanifest',
	other: {
		'msapplication-config': '/manifest/browserconfig.xml',
		'msapplication-TileColor': '#FF4FD8',
	},
	title: 'Boulder Best - Track Your Climbing Progress',
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="en">
			<body>{children}</body>
		</html>
	);
}
