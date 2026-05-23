import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';

import { THEME_CLASSES, THEME_MODES, THEME_STORAGE_KEY, THEME_TRANSITION_CLASS, ThemeMode } from './theme.constants';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly mode = signal<ThemeMode>(this.resolveInitialTheme());

  readonly themeMode = this.mode.asReadonly();
  readonly isDarkTheme = computed(() => this.mode() === 'dark');

  constructor() {
    this.applyTheme(this.mode(), false);
  }

  setTheme(mode: ThemeMode): void {
    this.mode.set(mode);
    this.persistTheme(mode);
    this.applyTheme(mode, true);
  }

  toggleTheme(): void {
    this.setTheme(this.mode() === 'dark' ? 'light' : 'dark');
  }

  private resolveInitialTheme(): ThemeMode {
    const storedTheme = this.readStoredTheme();
    if (storedTheme) {
      return storedTheme;
    }

    const browserWindow = this.document.defaultView;
    if (browserWindow?.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'light';
  }

  private applyTheme(mode: ThemeMode, animate: boolean): void {
    const root = this.document.documentElement;

    if (animate) {
      root.classList.add(THEME_TRANSITION_CLASS);
      this.document.defaultView?.setTimeout(() => root.classList.remove(THEME_TRANSITION_CLASS), 220);
    }

    root.classList.toggle(THEME_CLASSES.light, mode === 'light');
    root.classList.toggle(THEME_CLASSES.dark, mode === 'dark');
    root.setAttribute('data-theme', mode);
    root.style.colorScheme = mode;
  }

  private readStoredTheme(): ThemeMode | null {
    try {
      const storedTheme = this.document.defaultView?.localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
      return storedTheme && THEME_MODES.includes(storedTheme) ? storedTheme : null;
    } catch {
      return null;
    }
  }

  private persistTheme(mode: ThemeMode): void {
    try {
      this.document.defaultView?.localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      return;
    }
  }
}