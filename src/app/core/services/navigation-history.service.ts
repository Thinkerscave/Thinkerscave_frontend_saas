import { Injectable, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

/**
 * In-app URL stack used by the shared Back control.
 * Tracks Angular navigations (not the browser's full history) so Back always
 * returns to the previous product screen — e.g. Directory → Profile → Fee
 * returns to Profile, not Directory.
 */
@Injectable({ providedIn: 'root' })
export class NavigationHistoryService {
  private readonly router = inject(Router);
  private stack: string[] = [];
  private popped = false;

  constructor() {
    const initial = this.normalize(this.router.url);
    if (this.isAppUrl(initial)) {
      this.stack = [initial];
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', () => {
        this.popped = true;
      });
    }

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => {
        const url = this.normalize(event.urlAfterRedirects);
        if (!this.isAppUrl(url)) {
          return;
        }

        if (this.popped) {
          this.popped = false;
          const idx = this.stack.lastIndexOf(url);
          if (idx >= 0) {
            this.stack = this.stack.slice(0, idx + 1);
          } else {
            this.pushOrReplace(url);
          }
          return;
        }

        this.pushOrReplace(url);
      });
  }

  hasPrevious(): boolean {
    return this.stack.length > 1;
  }

  /** Drop the current entry and return the previous in-app URL (left on the stack as current). */
  consumePrevious(): string | null {
    if (this.stack.length < 2) {
      return null;
    }
    this.stack.pop();
    return this.stack[this.stack.length - 1] ?? null;
  }

  private pushOrReplace(url: string): void {
    const last = this.stack[this.stack.length - 1];
    if (!last) {
      this.stack.push(url);
      return;
    }
    if (last === url) {
      return;
    }
    if (this.pathOnly(last) === this.pathOnly(url)) {
      this.stack[this.stack.length - 1] = url;
      return;
    }
    this.stack.push(url);
    if (this.stack.length > 60) {
      this.stack.shift();
    }
  }

  private normalize(url: string): string {
    const trimmed = (url || '').trim() || '/';
    const [pathAndQuery] = trimmed.split('#');
    const value = pathAndQuery.startsWith('/') ? pathAndQuery : `/${pathAndQuery}`;
    return value.length > 1 ? value.replace(/\/+$/, '') : value;
  }

  private pathOnly(url: string): string {
    return url.split('?')[0];
  }

  private isAppUrl(url: string): boolean {
    const path = this.pathOnly(url);
    return path === '/app' || path.startsWith('/app/');
  }
}
