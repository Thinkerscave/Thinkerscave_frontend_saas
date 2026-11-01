import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { UiConfirmService } from '../feedback/ui-confirm.service';

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
 */
export const unsavedChangesGuard: CanDeactivateFn<CanComponentDeactivate> = (component) => {
  if (!component || typeof component.hasUnsavedChanges !== 'function') {
    return true;
  }
  if (!component.hasUnsavedChanges()) {
    return true;
  }

  return inject(UiConfirmService).confirm({
    header: 'Discard unsaved changes?',
    message: component.confirmLeaveMessage?.()
      ?? 'You have unsaved changes. Are you sure you want to leave this page?',
    acceptLabel: 'Discard',
    rejectLabel: 'Stay',
    tone: 'danger'
  });
};
