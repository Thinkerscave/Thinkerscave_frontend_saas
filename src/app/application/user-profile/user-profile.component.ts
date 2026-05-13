import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';
import { LoginService } from '../../services/login.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, CardModule, TagModule, DividerModule, ButtonModule],
  template: `
    <div class="profile-page p-4">
      <div class="profile-card-wrapper" style="max-width: 640px; margin: 0 auto;">
        <p-card>
          <!-- Avatar + Name Header -->
          <div class="flex align-items-center gap-4 mb-4">
            <div class="profile-avatar" style="
              width: 72px; height: 72px; border-radius: 50%;
              background: linear-gradient(135deg, #6366f1, #8b5cf6);
              display: flex; align-items: center; justify-content: center;
              font-size: 1.75rem; font-weight: 700; color: white; flex-shrink: 0;">
              {{ initials }}
            </div>
            <div>
              <h2 class="text-2xl font-bold text-900 m-0">{{ fullName || 'User' }}</h2>
              <span class="text-500 text-sm">{{ user?.email || '' }}</span>
              <div class="mt-1">
                <p-tag [value]="roleLabel" severity="info"></p-tag>
              </div>
            </div>
          </div>

          <p-divider></p-divider>

          <!-- Details Grid -->
          <div class="grid">
            <div class="col-12 md:col-6 mb-3">
              <span class="text-500 text-sm block mb-1">Username</span>
              <span class="font-semibold text-900">{{ user?.userName || '—' }}</span>
            </div>
            <div class="col-12 md:col-6 mb-3">
              <span class="text-500 text-sm block mb-1">First Name</span>
              <span class="font-semibold text-900">{{ user?.firstName || '—' }}</span>
            </div>
            <div class="col-12 md:col-6 mb-3">
              <span class="text-500 text-sm block mb-1">Last Name</span>
              <span class="font-semibold text-900">{{ user?.lastName || '—' }}</span>
            </div>
            <div class="col-12 md:col-6 mb-3">
              <span class="text-500 text-sm block mb-1">Mobile</span>
              <span class="font-semibold text-900">{{ user?.mobileNumber || '—' }}</span>
            </div>
            <div class="col-12 md:col-6 mb-3">
              <span class="text-500 text-sm block mb-1">City</span>
              <span class="font-semibold text-900">{{ user?.city || '—' }}</span>
            </div>
            <div class="col-12 md:col-6 mb-3">
              <span class="text-500 text-sm block mb-1">State</span>
              <span class="font-semibold text-900">{{ user?.state || '—' }}</span>
            </div>
          </div>

          <p-divider></p-divider>

          <div class="flex gap-3 mt-3">
            <button pButton label="Back to Dashboard" icon="pi pi-arrow-left"
              class="p-button-outlined" (click)="goBack()"></button>
          </div>
        </p-card>
      </div>
    </div>
  `,
  styles: [`
    .profile-page { background: var(--surface-ground, #f8fafc); min-height: calc(100vh - 80px); }
  `]
})
export class UserProfileComponent implements OnInit {
  user: any = null;
  fullName = '';
  initials = '';
  roleLabel = '';

  constructor(private loginService: LoginService, private router: Router) {}

  ngOnInit(): void {
    this.user = this.loginService.getUser();
    if (this.user) {
      this.fullName = `${this.user.firstName || ''} ${this.user.lastName || ''}`.trim() || this.user.userName || 'User';
      const parts = this.fullName.split(' ');
      this.initials = parts.length >= 2
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : (parts[0]?.[0] || 'U').toUpperCase();
      const roles: any[] = this.user.roles || [];
      this.roleLabel = roles.map((r: any) => r.roleName || r).join(', ') || 'User';
    }
  }

  goBack(): void {
    this.router.navigate(['/app']);
  }
}
