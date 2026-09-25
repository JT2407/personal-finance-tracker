import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useThemeStore } from '@/store/themeStore';

/**
 * Theme toggle — switches between dark ("serious money" default) and light.
 * Applies the theme via the store, which handles the transition-suppression
 * snap swap (no smear crossfade across the whole page).
 */
export function ThemeToggle() {
  const { theme, toggle } = useThemeStore();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'grid h-9 w-9 place-items-center rounded-control text-[rgb(var(--text-secondary))]',
        'transition-[background-color,color,transform] duration-150 ease-out',
        'hover:bg-[rgb(var(--surface-sunken))] hover:text-[rgb(var(--text-primary))]',
        'active:scale-[0.97]'
      )}
    >
      {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </button>
  );
}
