import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

/**
 * App-shell settings drawer controller.
 * Settings are personal preferences — opened as an overlay, not a full page.
 */
@Injectable({ providedIn: 'root' })
export class SettingsUiService {
  private readonly router = inject(Router);

  readonly isOpen = signal(false);
  private returnUrl = '/app';

  open(): void {
    const current = this.router.url || '/app';
    if (!current.startsWith('/app/settings')) {
      this.returnUrl = current;
    }
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  /** URL to restore when the user leaves a dedicated /app/settings entry. */
  consumeReturnUrl(): string {
    const url = this.returnUrl || '/app';
    this.returnUrl = '/app';
    return url;
  }
}
