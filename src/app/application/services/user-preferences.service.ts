import { Injectable, inject } from '@angular/core';
import { LoginService } from '../../core/services/login.service';

/**
 * Personal UI preferences scoped to the signed-in user + this browser.
 * Keys: tc.u.{userCode|userName|id}.{name}
 */
@Injectable({ providedIn: 'root' })
export class UserPreferencesService {
  private readonly loginService = inject(LoginService);

  /** Re-apply stored prefs for the current user (call after login / org switch). */
  applyStoredPreferences(): void {
    this.applyAccent(this.get('accent', '#1F3A93'));
    this.applyReduceMotion(this.getBool('reduceMotion', false));
  }

  userScopeKey(): string {
    const u: any = this.loginService.getUser();
    return String(u?.userCode || u?.userName || u?.id || 'guest').trim().toLowerCase();
  }

  storageKey(name: string): string {
    return `tc.u.${this.userScopeKey()}.${name}`;
  }

  get(name: string, fallback: string): string {
    try {
      const scoped = localStorage.getItem(this.storageKey(name));
      if (scoped != null) {
        return scoped;
      }
      // One-time migrate from legacy global keys
      const legacy = localStorage.getItem(`tc.${name}`);
      if (legacy != null) {
        localStorage.setItem(this.storageKey(name), legacy);
        return legacy;
      }
      return fallback;
    } catch {
      return fallback;
    }
  }

  getBool(name: string, fallback: boolean): boolean {
    const v = this.get(name, fallback ? 'true' : 'false');
    return v === 'true';
  }

  set(name: string, value: string): void {
    try {
      localStorage.setItem(this.storageKey(name), value);
    } catch {
      /* ignore */
    }
  }

  setBool(name: string, value: boolean): void {
    this.set(name, value ? 'true' : 'false');
  }

  applyAccent(color: string): void {
    const html = document.documentElement;
    const accent = (color || '#1F3A93').trim();
    html.style.setProperty('--tc-accent', accent);
    html.style.setProperty('--saas-primary', accent);
    html.style.setProperty('--tc-primary-500', accent);
    html.style.setProperty('--tc-primary-600', accent);
    html.style.setProperty('--tc-primary-700', `color-mix(in srgb, ${accent} 82%, black)`);
    html.style.setProperty('--tc-primary-400', `color-mix(in srgb, ${accent} 72%, white)`);
    html.style.setProperty('--tc-primary-300', `color-mix(in srgb, ${accent} 55%, white)`);
    html.style.setProperty('--tc-primary-100', `color-mix(in srgb, ${accent} 18%, white)`);
    html.style.setProperty('--tc-primary-50', `color-mix(in srgb, ${accent} 10%, white)`);
    html.style.setProperty('--p-primary-color', accent);
    html.style.setProperty('--primary-color', accent);
  }

  applyReduceMotion(enabled: boolean): void {
    document.documentElement.classList.toggle('tc-reduce-motion', enabled);
  }

  /** Clear visual prefs when signing out so the next account starts clean. */
  clearVisualOverrides(): void {
    const html = document.documentElement;
    html.classList.remove('tc-reduce-motion', 'tc-large-text', 'tc-high-contrast');
    html.removeAttribute('data-density');
    ['--tc-accent', '--saas-primary', '--tc-primary-500', '--tc-primary-600', '--tc-primary-700',
      '--tc-primary-400', '--tc-primary-300', '--tc-primary-100', '--tc-primary-50',
      '--p-primary-color', '--primary-color'].forEach((prop) => html.style.removeProperty(prop));
  }
}
