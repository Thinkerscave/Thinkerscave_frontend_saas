import { Injectable } from '@angular/core';

/**
 * In-memory list snapshots so SPA navigations back to a list can soft-refresh
 * instead of flashing a blank initial skeleton.
 */
@Injectable({ providedIn: 'root' })
export class ListSnapshotCache {
  private readonly store = new Map<string, unknown>();

  set<T>(key: string, value: T): void {
    this.store.set(key, value);
  }

  get<T>(key: string): T | null {
    return (this.store.get(key) as T | undefined) ?? null;
  }

  clear(key: string): void {
    this.store.delete(key);
  }
}
