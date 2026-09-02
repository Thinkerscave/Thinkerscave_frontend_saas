export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
    timestamp: string;
}

/**
 * Canonical paged payload. Backend PageResponse uses `page`; Spring Data Page
 * uses `number`. Always read through `normalizePagedResult()` so both work.
 */
export interface PageResponse<T> {
    content: T[];
    page: number;
    /** Spring Data alias of `page`. Prefer `page` in new code. */
    number?: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
    sort?: string;
}
