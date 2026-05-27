import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

/**
 * One result row rendered by {@link GlobalSearchComponent}.
 *
 * Implementations of {@link GlobalSearchProvider} return these grouped by
 * their `category` (e.g. "Students", "Invoices", "Pages").
 */
export interface GlobalSearchResult {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  category: string;
  /** Router path (string or commands[]) — when present the wizard navigates here on selection. */
  link?: string | any[];
  /** Optional arbitrary payload returned via the (selected) output. */
  payload?: any;
}

/**
 * Provider contract. Pages register a concrete provider in their bootstrap.
 * The default {@link DefaultGlobalSearchProvider} returns an empty list and
 * exists so the component can be dropped in without configuration.
 */
@Injectable({ providedIn: 'root' })
export abstract class GlobalSearchProvider {
  abstract search(term: string): Observable<GlobalSearchResult[]>;
}

@Injectable({ providedIn: 'root' })
export class DefaultGlobalSearchProvider extends GlobalSearchProvider {
  search(_term: string): Observable<GlobalSearchResult[]> {
    return of([]);
  }
}
