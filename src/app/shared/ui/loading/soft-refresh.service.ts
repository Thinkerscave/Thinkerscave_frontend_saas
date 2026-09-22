import { Injectable } from '@angular/core';

/**
 * Soft SPA refresh intents between routes (create → directory) without
 * forcing a blank remount skeleton when prior list data is still useful.
 */
export interface SoftRefreshIntent {
  key: string;
  at: number;
  hint?: string;
}

@Injectable({ providedIn: 'root' })
export class SoftRefreshService {
  private pending = new Map<string, SoftRefreshIntent>();

  /** Call after a successful mutation before navigating back to a list. */
  mark(key: string, hint?: string): void {
    this.pending.set(key, { key, at: Date.now(), hint });
  }

  /** Returns and clears a pending soft-refresh for the list page. */
  consume(key: string, maxAgeMs = 60_000): SoftRefreshIntent | null {
    const intent = this.pending.get(key);
    if (!intent) {
      return null;
    }
    this.pending.delete(key);
    if (Date.now() - intent.at > maxAgeMs) {
      return null;
    }
    return intent;
  }

  peek(key: string): boolean {
    return this.pending.has(key);
  }
}

/** Shared soft-refresh keys */
export const SoftRefreshKeys = {
  studentsDirectory: 'students.directory',
  staffDirectory: 'staff.directory',
  admissionsApplications: 'admissions.applications',
  admissionsLeads: 'admissions.leads',
  feesOutstanding: 'fees.outstanding'
} as const;
