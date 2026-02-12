import type { ReactNode } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

export const Providers = ({ children }: { children: ReactNode }) => (
	<NextThemesProvider
		attribute="class"
		defaultTheme="system"
		disableTransitionOnChange
		enableColorScheme
		enableSystem
	>
		{children}
	</NextThemesProvider>
);
