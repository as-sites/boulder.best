import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import '@boulder.best/shadcn/globals.css';

export const metadata: Metadata = {
	description: 'track your bouldering progress at boulder.best',
	title: 'boulder da best',
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="en">
			<body>{children}</body>
		</html>
	);
}
