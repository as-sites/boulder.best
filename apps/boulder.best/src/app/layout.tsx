import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { Geist, Geist_Mono } from 'next/font/google';

import { Providers } from '../components/providers';

const fontSans = Geist({
	subsets: ['latin'],
	variable: '--font-sans',
});

const fontMono = Geist_Mono({
	subsets: ['latin'],
	variable: '--font-mono',
});

import '@boulder.best/shadcn/globals.css';

export const metadata: Metadata = {
	appleWebApp: {
		capable: true,
		statusBarStyle: 'black-translucent',
		title: 'boulder.best',
	},
	applicationName: 'boulder.best',
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
	title: 'boulder.best - Track Your Climbing Progress',
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased `}>
				<Providers>
					<div className="flex items-center justify-center min-h-svh">
						<div className="flex flex-col items-center justify-center gap-4">
							{children}
						</div>
					</div>
				</Providers>
			</body>
		</html>
	);
}
