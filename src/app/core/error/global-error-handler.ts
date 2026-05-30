import { ErrorHandler, Injectable, inject } from '@angular/core';
import { LoggerService } from '../services/logger.service';
import { environment } from '../../../environments/environment';

/**
 * Catches unhandled JavaScript errors and promise rejections
 * that slip past component-level error handling.
 *
 * Responsibilities:
 *  - Log the full error to the centralised LoggerService
 *  - Prevent the default Angular ErrorHandler from swallowing stack traces
 *  - Provide a single hook for future remote error reporting (e.g. Sentry)
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly logger = inject(LoggerService);

  constructor() {
    this.logger.setLevel(environment.production ? 'warn' : 'debug');
  }

  handleError(error: unknown): void {
    const unwrapped = this.unwrap(error);
    this.logger.error('Unhandled error', unwrapped);
  }

  private unwrap(error: unknown): unknown {
    // Angular wraps some errors; extract the original
    if (error && typeof error === 'object' && 'rejection' in error) {
      return (error as { rejection: unknown }).rejection;
    }
    return error;
  }
}
