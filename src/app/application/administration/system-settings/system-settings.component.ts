import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { TenantConfig, TenantConfigService } from '../../../services/tenant-config.service';
import { LoginService } from '../../../services/login.service';

@Component({
  selector: 'app-system-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="admin-page-shell">
      <header class="admin-page-header">
        <span class="eyebrow">Administration</span>
        <h1>System Settings</h1>
        <p>Tenant labels and workspace preferences currently active for this organization.</p>
      </header>

      <div class="settings-grid" *ngIf="!loading; else loadingState">
        <article class="settings-card">
          <span class="card-label">Tenant</span>
          <strong>{{ tenantName }}</strong>
          <small>{{ orgType }}</small>
        </article>

        <article class="settings-card" *ngFor="let item of settingRows">
          <span class="card-label">{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
          <small>{{ item.help }}</small>
        </article>
      </div>

      <ng-template #loadingState>
        <div class="empty-state">
          <i class="pi pi-spin pi-spinner"></i>
          <span>Loading settings...</span>
        </div>
      </ng-template>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .admin-page-shell { min-height: 100vh; padding: 1.5rem; background: var(--tc-bg); color: var(--tc-text); }
    .admin-page-header { margin-bottom: 1.25rem; border-bottom: 1px solid var(--tc-border); padding-bottom: 1rem; }
    .eyebrow { color: var(--tc-primary-600); font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; }
    h1 { margin: 0.25rem 0; color: var(--tc-heading); font-size: 1.6rem; letter-spacing: 0; }
    p { margin: 0; color: var(--tc-text-muted); font-size: 0.9rem; }
    .settings-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; }
    .settings-card { min-height: 132px; border: 1px solid var(--tc-border); border-radius: var(--tc-radius-lg); background: var(--tc-surface-card); padding: 1rem; display: flex; flex-direction: column; justify-content: space-between; }
    .card-label { color: var(--tc-text-soft); font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; }
    strong { color: var(--tc-heading); font-size: 1.15rem; }
    small { color: var(--tc-text-muted); line-height: 1.4; }
    .empty-state { min-height: 220px; border: 1px dashed var(--tc-border); border-radius: var(--tc-radius-lg); background: var(--tc-surface-card); display: flex; align-items: center; justify-content: center; gap: 0.5rem; color: var(--tc-text-muted); }
    @media (max-width: 640px) { .admin-page-shell { padding: 1rem; } h1 { font-size: 1.35rem; } }
  `]
})
export class SystemSettingsComponent implements OnInit {
  loading = true;
  config: TenantConfig | null = null;

  constructor(
    private tenantConfigService: TenantConfigService,
    private loginService: LoginService
  ) { }

  ngOnInit(): void {
    const cachedConfig = this.tenantConfigService.getConfig();
    if (cachedConfig) {
      this.config = cachedConfig;
      this.loading = false;
      return;
    }

    this.tenantConfigService.fetchConfigFromServer().subscribe(config => {
      this.config = config;
      this.loading = false;
    });
  }

  get tenantName(): string {
    const user = this.loginService.getUser();
    return user?.tenantName || user?.organizationName || 'Current Tenant';
  }

  get orgType(): string {
    return this.loginService.getOrgType();
  }

  get settingRows(): { label: string; value: string; help: string }[] {
    const config = this.config;
    return [
      { label: 'Course Label', value: config?.courseLabel || 'Course', help: 'Used across academics and curriculum screens.' },
      { label: 'Container Label', value: config?.containerLabel || 'Section', help: 'Used for academic grouping and hierarchy views.' },
      { label: 'Student Label', value: config?.studentLabel || 'Student', help: 'Used in student-facing workflows.' },
      { label: 'Allowed Structures', value: (config?.allowedContainerTypes || []).join(', ') || 'CLASS, SECTION', help: 'Controls available academic hierarchy types.' }
    ];
  }
}