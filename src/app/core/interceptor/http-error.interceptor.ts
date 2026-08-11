import { inject } from '@angular/core';
import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest
} from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

/**
 * Centralized HTTP error interceptor.
 *
 * Responsibilities (kept distinct from {@link authInterceptor} which handles
 * 401/403 + token refresh):
 *  - Surface a single, user-friendly toast for every failing request
 *  - Normalize the backend's `ApiResponse` error envelope into a single message
 *  - Suppress noisy 401 toasts (handled by authInterceptor's refresh/redirect)
 *  - Honour a per-request opt-out via the `X-Skip-Error-Toast` header
 *  - Redirect on 503 maintenance and offline conditions
 */
export const httpErrorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
) => {
  const messageService = inject(MessageService);
  const router = inject(Router);

  const skipToast = req.headers.has('X-Skip-Error-Toast');
  const cleaned = skipToast ? req.clone({ headers: req.headers.delete('X-Skip-Error-Toast') }) : req;

  return next(cleaned).pipe(
    catchError((err: HttpErrorResponse) => {
      if (skipToast) {
        return throwError(() => err);
      }

      const { summary, detail, severity } = describeError(err);

      // 401 is owned by authInterceptor — avoid double-toasting while refresh runs.
      if (err.status !== 401) {
        messageService.add({ severity, summary, detail, life: severity === 'error' ? 8000 : 5000 });
      }

      if (err.status === 503) {
        router.navigate(['/maintenance']).catch(() => void 0);
      }

      return throwError(() => err);
    })
  );
};

interface NormalizedError {
  summary: string;
  detail: string;
  severity: 'error' | 'warn' | 'info';
}

function describeError(err: HttpErrorResponse): NormalizedError {
  if (err.status === 0) {
    return { summary: 'Network unavailable', detail: 'Please check your connection and try again.', severity: 'warn' };
  }

  const body = err.error ?? {};
  // Common backend envelopes: { message, errors[] } or { detail } or string
  const message =
    (typeof body === 'string' ? body : null) ??
    body?.message ??
    body?.detail ??
    body?.error ??
    err.message;

  switch (err.status) {
    case 400: return { summary: 'Invalid request', detail: message || 'Please review the highlighted fields.', severity: 'warn' };
    case 401: return { summary: 'Session expired',  detail: message || 'Please sign in again.', severity: 'warn' };
    case 403: return { summary: 'Access denied',    detail: message || 'You do not have permission to perform this action.', severity: 'warn' };
    case 404: return { summary: 'Not found',        detail: message || 'The requested resource is unavailable.', severity: 'warn' };
    case 409: return { summary: 'Conflict',         detail: message || 'This action conflicts with existing data.', severity: 'warn' };
    case 422: return { summary: 'Validation failed', detail: message || 'Some fields are invalid.', severity: 'warn' };
    case 429: return { summary: 'Too many requests', detail: message || 'Please wait a moment before retrying.', severity: 'warn' };
    case 503: return { summary: 'Service unavailable', detail: message || 'The service is temporarily down for maintenance.', severity: 'error' };
    default:
      if (err.status >= 500) {
        return { summary: 'Server error', detail: message || 'Something went wrong on our side.', severity: 'error' };
      }
      return { summary: 'Request failed', detail: message || 'Unexpected error.', severity: 'error' };
  }
}
