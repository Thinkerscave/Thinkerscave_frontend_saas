import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { finalize } from 'rxjs';

import { SecurityPolicy } from '../../models/access.model';
import { AccessManagementService } from '../../services/access-management.service';
import { SaasPageHeaderComponent, SaasPanelComponent } from '../../../../shared/ui/saas';

@Component({
  selector: 'app-security-policy',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterLink, ToastModule, SaasPageHeaderComponent, SaasPanelComponent],
  providers: [MessageService],
  templateUrl: './security-policy.component.html',
  styleUrl: './security-policy.component.scss'
})
export class SecurityPolicyComponent implements OnInit {
  private readonly api = inject(AccessManagementService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly messages = inject(MessageService);

  loading = true;
  saving = false;
  errorMessage = '';
  policy: SecurityPolicy = this.defaultPolicy();

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.api.getSecurityPolicy().pipe(
      finalize(() => { this.loading = false; this.cdr.markForCheck(); }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: policy => { this.policy = { ...this.defaultPolicy(), ...policy }; },
      error: () => {
        this.errorMessage = 'Could not load security policy.';
        this.policy = this.defaultPolicy();
      }
    });
  }

  save(): void {
    if (this.saving) return;
    this.saving = true;
    this.api.saveSecurityPolicy(this.policy).pipe(
      finalize(() => { this.saving = false; this.cdr.markForCheck(); }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: policy => {
        this.policy = policy;
        this.messages.add({ severity: 'success', summary: 'Saved', detail: 'Security policy updated.' });
      },
      error: () => this.messages.add({ severity: 'error', summary: 'Save failed', detail: 'Could not save security policy.' })
    });
  }

  reset(): void {
    this.api.resetSecurityPolicy().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Reset', detail: 'Policy reset to defaults.' });
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
