import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UserPreferencesService {
  applyStoredPreferences(): void {
    this.applyAccent(this.read('tc.accent', '#1F3A93'));
    this.applyA11y(
      this.readBool('tc.reduceMotion', false),
      this.readBool('tc.largeText', false),
      this.readBool('tc.highContrast', false)
    );
    const density = this.read('tc.density', 'comfortable');
    document.documentElement.dataset['density'] = density;
  }

  applyAccent(color: string): void {
    document.documentElement.style.setProperty('--saas-primary', color);
    document.documentElement.style.setProperty('--tc-primary-600', color);
  }

  applyA11y(reduceMotion: boolean, largeText: boolean, highContrast: boolean): void {
    const html = document.documentElement;
    html.classList.toggle('tc-reduce-motion', reduceMotion);
    html.classList.toggle('tc-large-text', largeText);
    html.classList.toggle('tc-high-contrast', highContrast);
  }

  private read(key: string, fallback: string): string {
    try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
  }

  private readBool(key: string, fallback: boolean): boolean {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : value === 'true';
    } catch {
      return fallback;
    }
  }
}
