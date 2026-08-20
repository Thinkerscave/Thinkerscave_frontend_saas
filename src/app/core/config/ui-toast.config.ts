/**
 * Global toast placement for the whole app.
 *
 * Change {@link UI_TOAST_CONFIG.position} here and every `<app-toast>` host
 * (root interceptor toasts, page toasts, auth toasts) follows it.
 *
 * PrimeNG positions:
 * - 'top-right' | 'top-left' | 'top-center'
 * - 'bottom-right' | 'bottom-left' | 'bottom-center'
 * - 'center'
 */
export type UiToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'center';

export const UI_TOAST_CONFIG = {
  position: 'top-right' as UiToastPosition,
  /** Keep toasts above the layout topbar and side menu. */
  baseZIndex: 1500
} as const;
