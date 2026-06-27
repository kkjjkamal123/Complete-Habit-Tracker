import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'dark' | 'light';

const THEME_KEY = 'dailytrack.theme';
const ACCENT_KEY = 'dailytrack.accent';
const NAME_KEY = 'dailytrack.name';

const DEFAULT_ACCENT = '#ff5c2b';

/** Curated accent swatches for the picker. */
// eslint-disable-next-line react-refresh/only-export-components
export const ACCENT_PRESETS = [
  '#ff5c2b', // tangerine
  '#e5484d', // red
  '#ec4899', // pink
  '#8b5cf6', // violet
  '#6366f1', // indigo
  '#2d7ff9', // blue
  '#14b8a6', // teal
  '#18b26b', // green
  '#f5a524', // amber
];

interface Ctx {
  theme: Theme;
  toggle: () => void;
  accent: string;
  setAccent: (c: string) => void;
  name: string;
  setName: (n: string) => void;
}

const ThemeCtx = createContext<Ctx>({
  theme: 'dark',
  toggle: () => {},
  accent: DEFAULT_ACCENT,
  setAccent: () => {},
  name: '',
  setName: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem(THEME_KEY) as Theme | null;
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });
  const [accent, setAccent] = useState<string>(() => localStorage.getItem(ACCENT_KEY) || DEFAULT_ACCENT);
  const [name, setName] = useState<string>(() => localStorage.getItem(NAME_KEY) || '');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.setProperty('--c-accent', accent);
    localStorage.setItem(ACCENT_KEY, accent);
  }, [accent]);

  useEffect(() => {
    localStorage.setItem(NAME_KEY, name);
  }, [name]);

  return (
    <ThemeCtx.Provider
      value={{
        theme,
        toggle: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
        accent,
        setAccent,
        name,
        setName,
      }}
    >
      {children}
    </ThemeCtx.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(ThemeCtx);
