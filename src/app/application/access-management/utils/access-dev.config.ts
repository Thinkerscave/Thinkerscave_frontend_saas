import { environment } from '../../../../environments/environment';

/**
 * TEMPORARY development reset password.
 * Read from environment config — never hardcode in AccessManagementService.
 * Remove `developmentResetPassword` from env files when email reset is live.
 */
export const DEV_RESET_PASSWORD: string | undefined = environment.developmentResetPassword;

export function resetPasswordTooltip(): string {
  if (DEV_RESET_PASSWORD) {
    return `Temporary: sets the password to ${DEV_RESET_PASSWORD}. Remove this when email reset is live.`;
  }
  return 'Sends a new temporary password to this person’s email.';
}

export function resetPasswordConfirmMessage(name: string): string {
  if (DEV_RESET_PASSWORD) {
    return `Set ${name}’s password to ${DEV_RESET_PASSWORD}? They must use it at the next sign-in. This is a temporary development password.`;
  }
  return `Issue a new temporary password for ${name}? It will be sent to their email.`;
}
