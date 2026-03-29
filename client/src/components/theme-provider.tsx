import type { PropsWithChildren } from 'react'
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps as NextThemeProviderProps } from 'next-themes'

type ThemeProviderProps = PropsWithChildren<
  Omit<NextThemeProviderProps, 'children'>
>

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
