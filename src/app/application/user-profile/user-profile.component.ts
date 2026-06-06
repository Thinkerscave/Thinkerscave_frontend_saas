import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  SaasPageHeaderComponent,
  SaasPanelComponent,
  SaasPillComponent,
  SaasTab,
  SaasTabsComponent
} from '../../shared/ui/saas';
import { LoginService } from '../../core/services/login.service';

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
    SaasTabsComponent
  ],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss'
})
export class UserProfileComponent {
  private readonly loginService = inject(LoginService);
  private readonly router = inject(Router);

  readonly tabs: SaasTab[] = [
    { key: 'overview',     label: 'Profile Overview', icon: 'pi pi-id-card' },
    { key: 'edit',         label: 'Edit Details',     icon: 'pi pi-user-edit' },
    { key: 'security',     label: 'Security',         icon: 'pi pi-key' },
    { key: 'quick-links',  label: 'Quick Links',      icon: 'pi pi-link' }
  ];
  readonly active = signal<TabKey>('overview');

  readonly user = signal<any>(this.loginService.getUser() ?? {});

  readonly edit = signal({
    firstName: this.user()?.firstName || '',
    lastName: this.user()?.lastName || '',
    email: this.user()?.email || '',
    mobile: this.user()?.mobileNumber || '',
    city: this.user()?.city || '',
    state: this.user()?.state || ''
  });
  readonly editStatus = signal<'idle' | 'saving' | 'saved' | 'error'>('idle');

  readonly password = signal({ current: '', next: '', confirm: '' });
  readonly passwordStatus = signal<'idle' | 'saving' | 'saved' | 'mismatch' | 'weak'>('idle');

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
    return roles.map(r => r.roleName || r.roleCode || r).join(', ');
  });
  readonly photoUrl = computed<string | null>(() => {
    const u: any = this.user();
    return u?.studentPhoto || u?.staffPhoto || u?.parentPhoto || u?.profilePhoto || u?.adminPhoto || null;
  });

  selectTab(key: string): void { this.active.set(key as TabKey); }

  updateEditField(field: string, value: string): void {
    this.edit.update(e => ({ ...e, [field]: value } as any));
  }
  saveProfile(): void {
    this.editStatus.set('saving');
    setTimeout(() => {
      const merged = { ...this.user(), ...this.edit(), mobileNumber: this.edit().mobile };
      this.user.set(merged);
      this.editStatus.set('saved');
      setTimeout(() => this.editStatus.set('idle'), 2000);
    }, 400);
  }

  updatePasswordField(field: string, value: string): void {
    this.password.update(p => ({ ...p, [field]: value } as any));
  }
  changePassword(): void {
    const p = this.password();
    if (p.next.length < 8) { this.passwordStatus.set('weak'); return; }
    if (p.next !== p.confirm) { this.passwordStatus.set('mismatch'); return; }
    this.passwordStatus.set('saving');
    setTimeout(() => {
      this.password.set({ current: '', next: '', confirm: '' });
      this.passwordStatus.set('saved');
      setTimeout(() => this.passwordStatus.set('idle'), 2000);
    }, 400);
  }

  goDashboard(): void { this.router.navigate(['/app']); }
}
