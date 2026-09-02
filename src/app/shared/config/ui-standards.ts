/**
 * Application-wide UI defaults. List pages and paginated APIs should consume
 * these values instead of hard-coding page sizes or view modes.
 */
export type AppListViewMode = 'table' | 'grid';

const PAGE_SIZE_DEFAULT = 10;

export const UI_PAGINATION = {
  defaultSize: PAGE_SIZE_DEFAULT,
  options: [10, 20, 50, 100] as number[],
  maxSize: 100,
  /** Same as defaultSize/options — grid and table share one page size. */
  table: {
    defaultSize: PAGE_SIZE_DEFAULT,
    options: [10, 20, 50, 100]
  },
  /** Same as defaultSize/options — grid and table share one page size. */
  grid: {
    defaultSize: PAGE_SIZE_DEFAULT,
    options: [10, 20, 50, 100]
  }
};

export const UI_VIEW = {
  /** Factory default when the user has not chosen a preference yet. */
  defaultMode: 'table' as AppListViewMode
};

export const UI_SEARCH = {
  /** Wait this long after the last keystroke before querying the backend. */
  debounceMs: 350
};

export const UI_PAGINATION_QUERY = {
  pageParam: 'page',
  sizeParam: 'size',
  sortParam: 'sort'
};

export function pageSizeOptions(): number[] {
  return UI_PAGINATION.options;
}

export function defaultPageSize(): number {
  return UI_PAGINATION.defaultSize;
}

/** @deprecated Grid and table share one size. Prefer pageSizeOptions(). */
export function pageSizeOptionsForView(_mode?: AppListViewMode): number[] {
  return UI_PAGINATION.options;
}

/** @deprecated Grid and table share one size. Prefer defaultPageSize(). */
export function defaultPageSizeForView(_mode?: AppListViewMode): number {
  return UI_PAGINATION.defaultSize;
}

/** Keep the current size when it is a standard option; otherwise snap to the default. */
export function resolvePageSizeForView(_mode?: AppListViewMode, currentSize?: number): number {
  if (currentSize && UI_PAGINATION.options.includes(currentSize)) {
    return currentSize;
  }
  return UI_PAGINATION.defaultSize;
}

export function isAppListViewMode(value: unknown): value is AppListViewMode {
  return value === 'table' || value === 'grid';
}
