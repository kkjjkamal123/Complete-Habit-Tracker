import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { MotionConfig } from 'framer-motion';

// eslint-disable-next-line react-refresh/only-export-components
export const ANIM_CATEGORIES = [
  { key: 'page', label: 'Page transitions' },
  { key: 'lists', label: 'Lists & cards' },
  { key: 'counters', label: 'Number count-ups' },
  { key: 'charts', label: 'Bars & charts' },
  { key: 'hover', label: 'Hover effects' },
  { key: 'ambient', label: 'Ambient loops' },
  { key: 'confetti', label: 'Celebrations' },
] as const;

export type AnimKey = (typeof ANIM_CATEGORIES)[number]['key'];
export type AnimPrefs = Record<AnimKey, boolean>;
export type Preset = 'full' | 'reduced' | 'off' | 'custom';

const FULL: AnimPrefs = {
  page: true, lists: true, counters: true, charts: true, hover: true, ambient: true, confetti: true,
};
const OFF: AnimPrefs = {
  page: false, lists: false, counters: false, charts: false, hover: false, ambient: false, confetti: false,
};
const REDUCED: AnimPrefs = {
  page: true, lists: true, counters: false, charts: true, hover: false, ambient: false, confetti: false,
};

// eslint-disable-next-line react-refresh/only-export-components
export const PRESETS: Record<Exclude<Preset, 'custom'>, AnimPrefs> = {
  full: FULL,
  reduced: REDUCED,
  off: OFF,
};

const KEY = 'dailytrack.anim';

function detectDefault(): AnimPrefs {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? REDUCED : FULL;
}

function presetOf(p: AnimPrefs): Preset {
  for (const name of ['full', 'reduced', 'off'] as const) {
    if (ANIM_CATEGORIES.every((c) => PRESETS[name][c.key] === p[c.key])) return name;
  }
  return 'custom';
}

interface Ctx {
  prefs: AnimPrefs;
  preset: Preset;
  setPreset: (p: Exclude<Preset, 'custom'>) => void;
  toggle: (k: AnimKey) => void;
  instant: boolean;
}

const MotionCtx = createContext<Ctx>({
  prefs: FULL,
  preset: 'full',
  setPreset: () => {},
  toggle: () => {},
  instant: false,
});

export function MotionProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<AnimPrefs>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return { ...FULL, ...(JSON.parse(raw) as Partial<AnimPrefs>) };
    } catch {
      /* ignore */
    }
    return detectDefault();
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(prefs));
    const el = document.documentElement;
    ANIM_CATEGORIES.forEach((c) => el.setAttribute(`data-m-${c.key}`, prefs[c.key] ? '1' : '0'));
    el.toggleAttribute('data-m-off', ANIM_CATEGORIES.every((c) => !prefs[c.key]));
  }, [prefs]);

  const instant = ANIM_CATEGORIES.every((c) => !prefs[c.key]);

  return (
    <MotionCtx.Provider
      value={{
        prefs,
        preset: presetOf(prefs),
        setPreset: (p) => setPrefs(PRESETS[p]),
        toggle: (k) => setPrefs((s) => ({ ...s, [k]: !s[k] })),
        instant,
      }}
    >
      <MotionConfig
        reducedMotion={instant ? 'always' : 'never'}
        transition={instant ? { duration: 0 } : undefined}
      >
        {children}
      </MotionConfig>
    </MotionCtx.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useMotion = () => useContext(MotionCtx);
