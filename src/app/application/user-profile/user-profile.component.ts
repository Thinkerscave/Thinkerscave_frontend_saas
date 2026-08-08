import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import {
  SaasPageHeaderComponent,
  SaasPanelComponent,
  SaasPillComponent,
  SaasTab,
  SaasTabsComponent
} from '../../shared/ui/saas';
import { LoginService } from '../../core/services/login.service';
import { UserProfileService } from '../services/user-profile.service';
import { TcTranslatePipe } from '../../shared/pipes/tc-translate.pipe';

type TabKey = 'overview' | 'edit' | 'security' | 'quick-links';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    SaasPageHeaderComponent,
    SaasPanelComponent,
    SaasPillComponent,
    SaasTabsComponent,
    TcTranslatePipe
  ],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss'
})
export class UserProfileComponent implements OnInit {
  private readonly loginService = inject(LoginService);
  private readonly profileService = inject(UserProfileService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly tabs: SaasTab[] = [
    { key: 'overview',     label: 'Profile Overview', icon: 'pi pi-id-card' },
    { key: 'edit',         label: 'Edit Details',     icon: 'pi pi-user-edit' },
    { key: 'security',     label: 'Security',         icon: 'pi pi-key' },
    { key: 'quick-links',  label: 'Quick Links',      icon: 'pi pi-link' }
  ];
  readonly active = signal<TabKey>('overview');

  readonly user = signal<any>(this.loginService.getUser() ?? {});
  readonly loading = signal(true);

  readonly edit = signal({
    firstName: this.user()?.firstName || '',
    lastName: this.user()?.lastName || '',
    email: this.user()?.email || '',
    mobile: this.user()?.mobile || this.user()?.mobileNumber || ''
  });
  readonly editStatus = signal<'idle' | 'saving' | 'saved' | 'error'>('idle');

  readonly password = signal({ current: '', next: '', confirm: '' });
  readonly passwordStatus = signal<'idle' | 'saving' | 'saved' | 'mismatch' | 'weak' | 'error'>('idle');

  readonly fullName = computed(() => {
    const u = this.user();
    return [u?.firstName, u?.lastName].filter(Boolean).join(' ') || u?.userName || 'User';
  });
  readonly initials = computed(() => {
    const name = this.fullName();
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (name[0] || 'U').toUpperCase();
  });
  readonly roleLabel = computed(() => {
    const roles: any[] = this.user()?.roles || [];
    if (!roles.length) return 'User';
    return roles.map(r => (typeof r === 'string' ? r : r.roleName || r.roleCode || r)).join(', ');
  });
  readonly photoUrl = computed<string | null>(() => {
    const u: any = this.user();
    return u?.profilePhoto || u?.studentPhoto || u?.staffPhoto || u?.parentPhoto || u?.adminPhoto || null;
  });

  ngOnInit(): void {
    this.profileService.loadProfile()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: user => {
          this.user.set(user);
          this.edit.set({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            mobile: user.mobile || ''
          });
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
  }

  selectTab(key: string): void { this.active.set(key as TabKey); }

  updateEditField(field: string, value: string): void {
    this.edit.update(e => ({ ...e, [field]: value } as any));
  }

  saveProfile(): void {
    this.editStatus.set('saving');
    const e = this.edit();
    this.profileService.updateProfile({
      firstName: e.firstName,
      lastName: e.lastName,
      mobileNumber: e.mobile
    }).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: user => {
          this.user.set(user);
          this.editStatus.set('saved');
          setTimeout(() => this.editStatus.set('idle'), 2000);
        },
        error: () => this.editStatus.set('error')
      });
  }

  updatePasswordField(field: string, value: string): void {
    this.password.update(p => ({ ...p, [field]: value } as any));
  }

  changePassword(): void {
    const p = this.password();
    if (p.next.length < 8) { this.passwordStatus.set('weak'); return; }
    if (p.next !== p.confirm) { this.passwordStatus.set('mismatch'); return; }
    this.passwordStatus.set('saving');
    this.profileService.changePassword({
      currentPassword: p.current,
      newPassword: p.next,
      confirmPassword: p.confirm
    }).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.password.set({ current: '', next: '', confirm: '' });
          this.passwordStatus.set('saved');
          setTimeout(() => this.passwordStatus.set('idle'), 2000);
        },
        error: () => this.passwordStatus.set('error')
      });
  }

  goDashboard(): void { this.router.navigate(['/app']); }
}
