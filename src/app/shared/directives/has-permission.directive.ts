import { Directive, inject, Input, OnChanges, TemplateRef, ViewContainerRef } from '@angular/core';
import { PermissionService } from '../../core/services/permission.service';

/**
 * Structural directive that conditionally renders an element based on the current
 * user's effective permissions. Removes the host element from the DOM when the
 * permission check fails (not just hidden — completely excluded from rendering).
 *
 * Usage:
 *   <button *tcHasPerm="'FEES_SETUP'">View Fees Setup</button>
 *   <button *tcHasPerm="'FEES_SETUP'; action: 'manage'">Edit Fees Setup</button>
 *   <button *tcHasPerm="'ATTENDANCE_STAFF'; action: 'approve'">Approve Attendance</button>
 *
 * Note: When no action is specified, defaults to 'view'.
 */
@Directive({
  selector: '[tcHasPerm]',
  standalone: true,
})
export class HasPermissionDirective implements OnChanges {
  /** The menuCode to check (e.g. 'STUDENTS_DIRECTORY', 'FEES_SETUP'). */
  @Input() tcHasPerm: string = '';

  /** The permission action to verify. Defaults to 'view'. */
  @Input() tcHasPermAction: 'view' | 'manage' | 'approve' = 'view';

  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly permissionService = inject(PermissionService);

  private isRendered = false;

  ngOnChanges(): void {
    this.updateView();
  }

  private updateView(): void {
    const allowed = this.checkPermission();
    if (allowed && !this.isRendered) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.isRendered = true;
    } else if (!allowed && this.isRendered) {
      this.viewContainer.clear();
      this.isRendered = false;
    }
  }

  private checkPermission(): boolean {
    if (!this.tcHasPerm) {
      return false;
    }
    switch (this.tcHasPermAction) {
      case 'manage':
        return this.permissionService.canManage(this.tcHasPerm);
      case 'approve':
        return this.permissionService.canApprove(this.tcHasPerm);
      case 'view':
      default:
        return this.permissionService.canView(this.tcHasPerm);
    }
  }
}
