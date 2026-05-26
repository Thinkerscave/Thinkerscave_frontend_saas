import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { MenuService } from '../../services/menu.service';
import { RoleService } from '../../services/role.service';
import { SubMenuService } from '../../services/sub-menu.service';

interface ActivityRecord {
  title: string;
  description: string;
  actor: string;
  timestamp: string | Date | null;
  icon: string;
}

@Component({
  selector: 'app-audit-activity',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <section class="admin-page-shell">
      <header class="admin-page-header">
        <span class="eyebrow">Administration</span>
        <h1>Audit & Activity</h1>
        <p>Recent administration changes collected from navigation and role records.</p>
      </header>

      <div class="activity-list" *ngIf="!loading && records.length">
        <article class="activity-card" *ngFor="let record of records">
          <span class="activity-icon"><i [ngClass]="record.icon"></i></span>
          <div>
            <strong>{{ record.title }}</strong>
            <p>{{ record.description }}</p>
            <small>{{ record.actor }} · {{ record.timestamp | date:'medium' }}</small>
          </div>
        </article>
      </div>

      <div class="empty-state" *ngIf="loading">
        <i class="pi pi-spin pi-spinner"></i>
        <span>Loading activity...</span>
      </div>

      <div class="empty-state" *ngIf="!loading && !records.length">
        <i class="pi pi-history"></i>
        <span>No administration activity is available for this tenant.</span>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .admin-page-shell { min-height: 100vh; padding: 1.5rem; background: var(--tc-bg); color: var(--tc-text); }
    .admin-page-header { margin-bottom: 1.25rem; border-bottom: 1px solid var(--tc-border); padding-bottom: 1rem; }
    .eyebrow { color: var(--tc-primary-600); font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; }
    h1 { margin: 0.25rem 0; color: var(--tc-heading); font-size: 1.6rem; letter-spacing: 0; }
    p { margin: 0; color: var(--tc-text-muted); font-size: 0.9rem; }
    .activity-list { display: grid; gap: 0.8rem; }
    .activity-card { border: 1px solid var(--tc-border); border-radius: var(--tc-radius-lg); background: var(--tc-surface-card); padding: 1rem; display: flex; gap: 0.85rem; align-items: flex-start; }
    .activity-icon { width: 36px; height: 36px; border-radius: var(--tc-radius-md); background: color-mix(in srgb, var(--tc-primary-600) 12%, transparent); color: var(--tc-primary-600); display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto; }
    strong { color: var(--tc-heading); font-size: 0.95rem; }
    small { color: var(--tc-text-soft); display: block; margin-top: 0.35rem; }
    .empty-state { min-height: 220px; border: 1px dashed var(--tc-border); border-radius: var(--tc-radius-lg); background: var(--tc-surface-card); display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 0.5rem; color: var(--tc-text-muted); text-align: center; }
    .empty-state i { color: var(--tc-primary-500); font-size: 1.2rem; }
    @media (max-width: 640px) { .admin-page-shell { padding: 1rem; } h1 { font-size: 1.35rem; } }
  `]
})
export class AuditActivityComponent implements OnInit {
  loading = true;
  records: ActivityRecord[] = [];

  constructor(
    private menuService: MenuService,
    private subMenuService: SubMenuService,
    private roleService: RoleService
  ) { }

  ngOnInit(): void {
    forkJoin({
      menus: this.menuService.getAllMenus(),
      subMenus: this.subMenuService.getAllSubmenus(),
      roles: this.roleService.getAllRoles()
    }).subscribe({
      next: ({ menus, subMenus, roles }) => {
        this.records = [
          ...roles.map((role: any) => ({
            title: `Role updated: ${role.roleName}`,
            description: role.description || 'Role configuration changed.',
            actor: role.createdBy || 'System',
            timestamp: role.lastModifiedDate || null,
            icon: 'pi pi-shield'
          })),
          ...subMenus.map((subMenu: any) => ({
            title: `Route updated: ${subMenu.subMenuName}`,
            description: subMenu.subMenuDescription || subMenu.subMenuUrl || 'Navigation route changed.',
            actor: subMenu.createdBy || 'System',
            timestamp: subMenu.lastUpdatedOn || null,
            icon: 'pi pi-list'
          })),
          ...menus.map((menu: any) => ({
            title: `Menu group: ${menu.name}`,
            description: menu.description || 'Navigation group configuration.',
            actor: 'System',
            timestamp: null,
            icon: 'pi pi-bars'
          }))
        ]
          .filter(record => !!record.timestamp)
          .sort((a, b) => new Date(b.timestamp as string).getTime() - new Date(a.timestamp as string).getTime())
          .slice(0, 20);
        this.loading = false;
      },
      error: () => {
        this.records = [];
        this.loading = false;
      }
    });
  }
}