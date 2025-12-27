import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ReactNode } from 'react';

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
