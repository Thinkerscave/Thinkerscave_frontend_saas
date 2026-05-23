export type ThemeMode = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'thinkerscave.theme-mode';

export const THEME_CLASSES: Record<ThemeMode, string> = {
  light: 'tc-theme-light',
  dark: 'tc-theme-dark'
};

export const THEME_TRANSITION_CLASS = 'tc-theme-transition';

export const THEME_MODES: ThemeMode[] = ['light', 'dark'];