import { Injectable, inject } from '@angular/core';
import { ConfirmationService } from 'primeng/api';

/** Key shared with {@link AppConfirmDialogComponent}; page-level dialogs without a key never pick these up. */
export const APP_CONFIRM_KEY = 'app-confirm';

export type ConfirmTone = 'primary' | 'warn' | 'danger';
export type AlertTone = 'info' | 'success' | 'warn' | 'danger';

export interface ConfirmOptions {
  message: string;
  header?: string;
  acceptLabel?: string;
  rejectLabel?: string;
  /** `danger` for destructive actions (delete, archive, deactivate); focuses Cancel by default. */
  tone?: ConfirmTone;
  icon?: string;
}

export interface AlertOptions {
  message: string;
  header?: string;
  okLabel?: string;
  tone?: AlertTone;
  icon?: string;
}

const TONE_ICON: Record<ConfirmTone | AlertTone, string> = {
  primary: 'pi pi-question-circle',
  info: 'pi pi-info-circle',
  success: 'pi pi-check-circle',
  warn: 'pi pi-exclamation-triangle',
  danger: 'pi pi-exclamation-triangle'
};

const TONE_BUTTON: Record<ConfirmTone | AlertTone, string> = {
  primary: '',
  info: '',
  success: 'p-button-success',
  warn: 'p-button-warn',
  danger: 'p-button-danger'
};

/**
 * Standard confirm / alert modal for the whole app.
 *
 * ```ts
 * if (await this.dialogs.confirm({ header: 'Delete staff?', message: '…', acceptLabel: 'Delete', tone: 'danger' })) { … }
 * await this.dialogs.alert({ header: 'Import finished', message: '…', tone: 'success' });
 * ```
 *
 * Rendered by the single `<app-confirm-dialog>` in `app.component.html`. See FEEDBACK_STANDARDS.md.
 */
@Injectable({ providedIn: 'root' })
export class UiConfirmService {
  private readonly confirmation = inject(ConfirmationService);

  confirm(options: ConfirmOptions): Promise<boolean> {
    const tone = options.tone ?? 'primary';
    return new Promise<boolean>(resolve => {
      let settled = false;
      const settle = (value: boolean) => {
        if (!settled) {
          settled = true;
          resolve(value);
        }
      };
      this.confirmation.confirm({
        key: APP_CONFIRM_KEY,
        header: options.header ?? 'Please confirm',
        message: escapeHtml(options.message),
        icon: `${options.icon ?? TONE_ICON[tone]} app-confirm__icon app-confirm__icon--${tone}`,
        acceptLabel: options.acceptLabel ?? 'Confirm',
        rejectLabel: options.rejectLabel ?? 'Cancel',
        acceptButtonStyleClass: TONE_BUTTON[tone],
        rejectButtonStyleClass: 'p-button-secondary p-button-outlined',
        rejectVisible: true,
        defaultFocus: tone === 'danger' ? 'reject' : 'accept',
        closeOnEscape: true,
        accept: () => settle(true),
        reject: () => settle(false)
      });
    });
  }

  alert(options: AlertOptions): Promise<void> {
    const tone = options.tone ?? 'info';
    return new Promise<void>(resolve => {
      this.confirmation.confirm({
        key: APP_CONFIRM_KEY,
        header: options.header ?? 'Notice',
        message: escapeHtml(options.message),
        icon: `${options.icon ?? TONE_ICON[tone]} app-confirm__icon app-confirm__icon--${tone}`,
        acceptLabel: options.okLabel ?? 'OK',
        acceptButtonStyleClass: TONE_BUTTON[tone],
        rejectVisible: false,
        defaultFocus: 'accept',
        closeOnEscape: true,
        accept: () => resolve(),
        reject: () => resolve()
      });
    });
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
