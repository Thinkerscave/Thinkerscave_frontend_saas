import { Injectable } from '@angular/core';
import { AppListViewMode } from '../../shared/config/ui-standards';

export interface ListContextState {
  page?: number;
  size?: number;
  search?: string;
  sort?: string;
  tab?: string;
  view?: AppListViewMode;
  filters?: Record<string, string | number | boolean | null | undefined>;
}

const STORAGE_PREFIX = 'tc.list.ctx.';

/**
 * Preserves list pagination/search/filter state when the user opens a
 * detail/edit page and returns with Back. State is session-scoped so a
 * fresh sidebar visit still starts clean after the tab is closed.
 */
@Injectable({ providedIn: 'root' })
export class ListContextService {
  save(key: string, state: ListContextState): void {
    try {
      sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }

  peek(key: string): ListContextState | null {
    try {
      const raw = sessionStorage.getItem(STORAGE_PREFIX + key);
      if (!raw) {
        return null;
      }
      return JSON.parse(raw) as ListContextState;
    } catch {
      return null;
    }
  }

  consume(key: string): ListContextState | null {
    const state = this.peek(key);
    this.clear(key);
    return state;
  }

  clear(key: string): void {
    try {
      sessionStorage.removeItem(STORAGE_PREFIX + key);
    } catch {
      /* ignore */
    }
  }
}
