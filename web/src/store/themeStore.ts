import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'dark' | 'light';

interface ThemeState {
  theme: Theme;
  toggle: () => void;
  setTheme: (theme: Theme) => void;
}

/**
 * Theme store persisted to localStorage.
 *
 * Per the design skills: a theme flip changes color/background on nearly every
 * element at once, and if transitions run they smear. We inject a temporary
 * `transition: none` rule (the `.theme-transition-off` class), force a reflow,
 * then remove it — so the swap snaps instead of crossfading.
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      toggle: () => {
        const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
        applyThemeSwap(next);
        set({ theme: next });
      },
      setTheme: (theme) => {
        applyThemeSwap(theme);
        set({ theme });
      },
    }),
    {
      name: 'ledger-theme',
    }
  )
);

function applyThemeSwap(next: Theme) {
  const root = document.documentElement;
  root.classList.add('theme-transition-off');
  // Flip the class.
  if (next === 'light') {
    root.classList.remove('dark');
  } else {
    root.classList.add('dark');
  }
  // Force a reflow so the "off" state takes effect cleanly.
  void root.offsetHeight;
  // Remove the suppression on the next frame.
  requestAnimationFrame(() => {
    root.classList.remove('theme-transition-off');
  });
}

/** Apply the persisted theme to the DOM on boot. */
export function applyInitialTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'light') {
    root.classList.remove('dark');
  } else {
    root.classList.add('dark');
  }
}
