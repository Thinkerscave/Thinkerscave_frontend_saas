import { PermissionService } from '../../../../core/services/permission.service';

/** Menu code that governs the staff module. Must match the backend StaffAccessGuard resource. */
export const STAFF_MENU_CODE = 'STAFF_DIRECTORY';

/**
 * Write access (create, edit, activate/deactivate, delete, documents, responsibilities)
 * requires MANAGE or APPROVE on the staff menu. VIEW alone is read-only.
 */
export function canWriteStaff(permissions: PermissionService): boolean {
  return permissions.canManage(STAFF_MENU_CODE) || permissions.canApprove(STAFF_MENU_CODE);
}
