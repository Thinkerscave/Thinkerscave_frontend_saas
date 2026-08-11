import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';

export type FeedbackSeverity = 'success' | 'info' | 'warn' | 'error';

export interface FeedbackOptions {
  /** Toast lifetime in ms. Errors default longer so users notice without scrolling. */
  life?: number;
  /** Sticky toast until dismissed (use sparingly for blocking failures). */
  sticky?: boolean;
  /** Extra key for deduping rapid identical toasts. */
  key?: string;
}

/**
 * Standard user feedback for SaaS pages (PrimeNG Toast).
 *
 * Prefer this over ad-hoc banners for action outcomes (save / create / fail).
 * Keep field-level validation under the input in red; use toasts for the
 * summary so users see it immediately even when scrolled to the bottom.
 *
 * See {@link ./FEEDBACK_STANDARDS.md}.
 */
@Injectable({ providedIn: 'root' })
export class UiFeedbackService {
  private readonly messages = inject(MessageService);

  success(summary: string, detail?: string, options?: FeedbackOptions): void {
    this.show('success', summary, detail, { life: 4500, ...options });
  }

  info(summary: string, detail?: string, options?: FeedbackOptions): void {
    this.show('info', summary, detail, { life: 4500, ...options });
  }

  warn(summary: string, detail?: string, options?: FeedbackOptions): void {
    this.show('warn', summary, detail, { life: 6000, ...options });
  }

  error(summary: string, detail?: string, options?: FeedbackOptions): void {
    this.show('error', summary, detail, { life: 8000, sticky: false, ...options });
  }

  /** Validation / business failure that should interrupt the user briefly. */
  formError(detail: string, summary = 'Please fix the highlighted fields'): void {
    this.error(summary, detail, { life: 9000 });
  }

  clear(key?: string): void {
    if (key) {
      this.messages.clear(key);
      return;
    }
    this.messages.clear();
  }

  private show(
    severity: FeedbackSeverity,
    summary: string,
    detail?: string,
    options?: FeedbackOptions
  ): void {
    this.messages.add({
      severity,
      summary,
      detail: detail || undefined,
      life: options?.sticky ? undefined : (options?.life ?? 5000),
      sticky: options?.sticky ?? false,
      key: options?.key,
      closable: true
    });
  }
}
