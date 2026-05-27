import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { Observable, of } from 'rxjs';

/**
 * Components that own unsaved form state should implement this contract.
 * `hasUnsavedChanges()` returns true when navigation should be confirmed;
 * the optional `confirmLeaveMessage()` lets the page customize the prompt.
 */
export interface CanComponentDeactivate {
  hasUnsavedChanges: () => boolean;
  confirmLeaveMessage?: () => string;
}

/**
 * Route guard that prompts the user before discarding unsaved changes.
 *
 * Usage in routes:
 *   { path: 'edit', component: EditPage, canDeactivate: [unsavedChangesGuard] }
 *
 * Falls back to the native `confirm()` dialog if PrimeNG's
 * {@link ConfirmationService} isn't configured at the call site.
 */
export const unsavedChangesGuard: CanDeactivateFn<CanComponentDeactivate> = (component) => {
  if (!component || typeof component.hasUnsavedChanges !== 'function') {
    return true;
  }
  if (!component.hasUnsavedChanges()) {
    return true;
  }

  const message = component.confirmLeaveMessage?.()
    ?? 'You have unsaved changes. Are you sure you want to leave this page?';

  // Prefer PrimeNG confirmation when available, otherwise native confirm.
  let confirmationService: ConfirmationService | null = null;
  try {
    confirmationService = inject(ConfirmationService, { optional: true });
  } catch {
    confirmationService = null;
  }

  if (confirmationService) {
    return new Observable<boolean>(subscriber => {
      confirmationService!.confirm({
        header: 'Discard unsaved changes?',
        message,
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Discard',
        rejectLabel: 'Stay',
        acceptButtonStyleClass: 'p-button-danger',
        accept: () => { subscriber.next(true); subscriber.complete(); },
        reject: () => { subscriber.next(false); subscriber.complete(); }
      });
    });
  }

  return of(window.confirm(message));
};
