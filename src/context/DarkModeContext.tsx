import { createContext, useContext, type ReactNode } from 'react';
import { useDarkMode } from '../hooks/useDarkMode';

interface DarkModeContextValue {
  isDark: boolean;
  toggle: () => void;
}

const DarkModeContext = createContext<DarkModeContextValue | null>(null);

export function DarkModeProvider({ children }: { children: ReactNode }) {
  const value = useDarkMode();
  return <DarkModeContext.Provider value={value}>{children}</DarkModeContext.Provider>;
}

export function useDarkModeContext() {
  const ctx = useContext(DarkModeContext);
  if (!ctx) throw new Error('useDarkModeContext must be used within DarkModeProvider');
  return ctx;
}
