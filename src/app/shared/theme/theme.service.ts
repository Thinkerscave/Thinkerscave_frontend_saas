import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';
import { LoginService } from '../../core/services/login.service';

import { THEME_CLASSES, THEME_MODES, THEME_STORAGE_KEY, THEME_TRANSITION_CLASS, ThemeMode } from './theme.constants';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly loginService = inject(LoginService);
  private readonly mode = signal<ThemeMode>(this.resolveInitialTheme());
  /** When true (auth/login surfaces), force light chrome regardless of stored preference. */
  private readonly authSurface = signal(false);

  readonly themeMode = this.mode.asReadonly();
  readonly isDarkTheme = computed(() => !this.authSurface() && this.mode() === 'dark');

  constructor() {
    this.applyVisualTheme(false);
  }

  setTheme(mode: ThemeMode): void {
    this.mode.set(mode);
    this.persistTheme(mode);
    this.applyVisualTheme(true);
  }

  toggleTheme(): void {
    this.setTheme(this.mode() === 'dark' ? 'light' : 'dark');
  }

  /**
   * Auth / marketing surfaces stay on the standard light look.
   * Stored preference is preserved and re-applied after login.
   */
  setAuthSurface(active: boolean): void {
    this.authSurface.set(active);
    this.applyVisualTheme(false);
  }

  /** Reload theme for the signed-in user (after login). */
  reloadForCurrentUser(): void {
    const stored = this.readStoredTheme();
    if (stored) {
      this.mode.set(stored);
    }
    this.authSurface.set(false);
    this.applyVisualTheme(false);
  }

  private resolveInitialTheme(): ThemeMode {
    const storedTheme = this.readStoredTheme();
    if (storedTheme) {
      return storedTheme;
    }
    return 'light';
  }

  private applyVisualTheme(animate: boolean): void {
    const effective: ThemeMode = this.authSurface() ? 'light' : this.mode();
    const root = this.document.documentElement;

    if (animate) {
      root.classList.add(THEME_TRANSITION_CLASS);
      this.document.defaultView?.setTimeout(() => root.classList.remove(THEME_TRANSITION_CLASS), 220);
    }

    root.classList.toggle(THEME_CLASSES.light, effective === 'light');
    root.classList.toggle(THEME_CLASSES.dark, effective === 'dark');
    root.setAttribute('data-theme', effective);
    root.style.colorScheme = effective;
  }

  private userThemeKey(): string {
    const u: any = this.loginService.getUser();
    const scope = String(u?.userCode || u?.userName || u?.id || '').trim().toLowerCase();
    return scope ? `${THEME_STORAGE_KEY}.${scope}` : THEME_STORAGE_KEY;
  }

  private readStoredTheme(): ThemeMode | null {
    try {
      const storage = this.document.defaultView?.localStorage;
      if (!storage) {
        return null;
      }
      const scoped = storage.getItem(this.userThemeKey()) as ThemeMode | null;
      if (scoped && THEME_MODES.includes(scoped)) {
        return scoped;
      }
      const legacy = storage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
      return legacy && THEME_MODES.includes(legacy) ? legacy : null;
    } catch {
      return null;
    }
  }

  private persistTheme(mode: ThemeMode): void {
    try {
      this.document.defaultView?.localStorage.setItem(this.userThemeKey(), mode);
    } catch {
      return;
    }
  }
}
