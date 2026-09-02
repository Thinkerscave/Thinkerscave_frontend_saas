import { unwrapApiResponse } from './api-response.util';
import { PageResponse } from '../models/api-response.model';

export type PageNumberToken = number | 'ellipsis';

export interface AppPageChangeEvent {
  /** 0-based page index (Spring / PrimeNG compatible). */
  page: number;
  first: number;
  rows: number;
  pageCount: number;
}

export interface RawPageLike<T> {
  content?: T[];
  page?: number;
  number?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
  first?: boolean;
  last?: boolean;
  sort?: string | { sorted?: boolean };
}

const EMPTY_PAGE: PageResponse<never> = {
  content: [],
  page: 0,
  number: 0,
  size: 10,
  totalElements: 0,
  totalPages: 0,
  first: true,
  last: true
};

/** Normalise Spring `Page` (`number`) and backend `PageResponse` (`page`) into one shape. */
export function normalizePagedResult<T>(raw: unknown, fallbackSize = 10): PageResponse<T> {
  const data = unwrapPagePayload<T>(raw);
  const content = Array.isArray(data.content) ? data.content : [];
  const size = data.size && data.size > 0 ? data.size : fallbackSize;
  const page = data.page ?? data.number ?? 0;
  const totalElements = data.totalElements ?? content.length;
  const totalPages = data.totalPages ?? (size > 0 ? Math.ceil(totalElements / size) : 0);

  return {
    content,
    page,
    number: page,
    size,
    totalElements,
    totalPages,
    first: data.first ?? page <= 0,
    last: data.last ?? (totalPages === 0 || page >= totalPages - 1),
    sort: typeof data.sort === 'string' ? data.sort : undefined
  };
}

export function emptyPagedResult<T>(size = 10): PageResponse<T> {
  return { ...EMPTY_PAGE, size, content: [] };
}

export function slicePage<T>(items: T[], page: number, size: number): T[] {
  const start = Math.max(0, page) * Math.max(1, size);
  return items.slice(start, start + size);
}

export function pageRange(page: number, size: number, total: number): { start: number; end: number } {
  if (total <= 0) {
    return { start: 0, end: 0 };
  }
  const start = page * size + 1;
  const end = Math.min((page + 1) * size, total);
  return { start, end };
}

export function clampPage(page: number, totalPages: number): number {
  if (totalPages <= 0) {
    return 0;
  }
  return Math.min(Math.max(0, page), totalPages - 1);
}

export function toPageChangeEvent(page: number, size: number, total: number): AppPageChangeEvent {
  const pageCount = size > 0 ? Math.max(1, Math.ceil(total / size)) : 1;
  return {
    page,
    first: page * size,
    rows: size,
    pageCount
  };
}

/**
 * Compact page list: first, last, current ±1, with ellipses for gaps.
 * `current` is 0-based; returned numbers are 0-based page indexes.
 */
export function buildPageItems(current: number, totalPages: number): PageNumberToken[] {
  if (totalPages <= 0) {
    return [];
  }
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  const pages = new Set<number>();
  pages.add(0);
  pages.add(totalPages - 1);
  for (let i = current - 1; i <= current + 1; i++) {
    if (i >= 0 && i < totalPages) {
      pages.add(i);
    }
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const tokens: PageNumberToken[] = [];
  let previous = -1;
  for (const value of sorted) {
    if (previous >= 0 && value - previous > 1) {
      tokens.push('ellipsis');
    }
    tokens.push(value);
    previous = value;
  }
  return tokens;
}

function unwrapPagePayload<T>(raw: unknown): RawPageLike<T> {
  if (!raw || typeof raw !== 'object') {
    return {};
  }
  const unwrapped = unwrapApiResponse<RawPageLike<T>>(raw, raw as RawPageLike<T>);
  if (unwrapped && typeof unwrapped === 'object' && 'content' in unwrapped) {
    return unwrapped;
  }
  return raw as RawPageLike<T>;
}
