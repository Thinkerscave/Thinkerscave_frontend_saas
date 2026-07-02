import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

const REFRESH_BUFFER_MS = 60_000;

/**
 * Holds the access token in memory only (never localStorage/sessionStorage).
 * Refresh tokens stay in HttpOnly cookies when the backend supports them;
 * until then they are managed by LoginService storage as a transitional fallback.
 */
@Injectable({ providedIn: 'root' })
export class TokenSessionService {
  private accessToken: string | null = null;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly tokenRefreshed$ = new Subject<string>();

  /** Emits the access token on set, or `proactive-refresh` when refresh should run. */
  readonly onTokenRefreshed$ = this.tokenRefreshed$.asObservable();

  setAccessToken(token: string | null): void {
    this.accessToken = token;
    this.scheduleProactiveRefresh(token);
    if (token) {
      this.tokenRefreshed$.next(token);
    }
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  clear(): void {
    this.accessToken = null;
    this.clearRefreshTimer();
  }

  private scheduleProactiveRefresh(token: string | null): void {
    this.clearRefreshTimer();
    if (!token) {
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (typeof payload.exp !== 'number') {
        return;
      }
      const expiresAt = payload.exp * 1000;
      const delay = Math.max(expiresAt - Date.now() - REFRESH_BUFFER_MS, 5_000);
      this.refreshTimer = setTimeout(() => this.tokenRefreshed$.next('proactive-refresh'), delay);
    } catch {
      // Malformed token — interceptor will handle 401
    }
  }

  private clearRefreshTimer(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
}
