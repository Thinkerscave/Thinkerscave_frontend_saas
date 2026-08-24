import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { LoginService } from '../../../../core/services/login.service';
import { PermissionService } from '../../../../core/services/permission.service';
import { finalize } from 'rxjs';

import { SecurityPolicy } from '../../models/access.model';
import { AccessManagementService } from '../../services/access-management.service';
import { ACCESS_RESOURCES, accessCanManage } from '../../utils/access-resources';
import { SaasPageHeaderComponent, SaasPanelComponent } from '../../../../shared/ui/saas';

@Component({
  selector: 'app-security-policy',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppToastComponent, CommonModule, FormsModule, SaasPageHeaderComponent, SaasPanelComponent],
  providers: [MessageService],
  templateUrl: './security-policy.component.html',
  styleUrl: './security-policy.component.scss'
})
export class SecurityPolicyComponent implements OnInit {
  private readonly api = inject(AccessManagementService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly login = inject(LoginService);
  private readonly messages = inject(MessageService);
  private readonly permissions = inject(PermissionService);

  loading = true;
  saving = false;
  errorMessage = '';
  policy: SecurityPolicy = this.defaultPolicy();

  get canManage(): boolean {
    return accessCanManage(this.permissions, this.login, ACCESS_RESOURCES.securityPolicy);
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.api.getSecurityPolicy().pipe(
      finalize(() => { this.loading = false; this.cdr.markForCheck(); }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: policy => { this.policy = { ...this.defaultPolicy(), ...policy, requireTwoFactor: false }; },
      error: () => {
        this.errorMessage = 'Could not load security policy.';
        this.policy = this.defaultPolicy();
      }
    });
  }

  save(): void {
    if (!this.canManage || this.saving) return;
    this.saving = true;
    this.api.saveSecurityPolicy({ ...this.policy, requireTwoFactor: false }).pipe(
      finalize(() => { this.saving = false; this.cdr.markForCheck(); }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: policy => {
        this.policy = { ...this.defaultPolicy(), ...policy, requireTwoFactor: false };
        this.messages.add({
          severity: 'success',
          summary: 'Saved',
          detail: 'Password, lockout and session rules now apply to this organization.'
        });
      },
      error: () => this.messages.add({ severity: 'error', summary: 'Save failed', detail: 'Could not save security policy.' })
    });
  }

  reset(): void {
    if (!this.canManage) return;
    this.api.resetSecurityPolicy().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Reset', detail: 'Policy reset to organization defaults.' });
        this.load();
      },
      error: () => this.messages.add({ severity: 'error', summary: 'Failed', detail: 'Could not reset policy.' })
    });
  }

  private defaultPolicy(): SecurityPolicy {
    return {
      minPasswordLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false,
      passwordExpiryDays: 90,
      passwordHistoryCount: 5,
      maxFailedAttempts: 5,
      lockoutDurationMinutes: 30,
      sessionTimeoutMinutes: 60,
      maxConcurrentSessions: 3,
      allowRememberMe: false,
      requireTwoFactor: false
    };
  }
}
