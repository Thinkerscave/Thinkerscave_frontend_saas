import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';

import { AdminAuditEvent, AdminControlCenter } from '../../../administration/models/admin-control.model';
import { AdminControlDataService } from '../../../administration/services/admin-control-data.service';

import { UI_PAGINATION } from '../../../../shared/config/ui-standards';
import { AppPaginatorComponent } from '../../../../shared/ui/app-list';
import { AppPageChangeEvent } from '../../../../shared/utils/paged-result.util';
import {
  SaasPageHeaderComponent,
  SaasPanelComponent,
  SaasFilterRowComponent,
  SaasPillComponent,
  SaasStatGridComponent,
  SaasStat
} from '../../../../shared/ui/saas';

interface SelectOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-activity-logs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DatePipe, DropdownModule, AppPaginatorComponent, SaasPageHeaderComponent, SaasPanelComponent, SaasFilterRowComponent, SaasPillComponent, SaasStatGridComponent],
  templateUrl: './activity-logs.component.html',
  styleUrl: './activity-logs.component.scss'
})
export class ActivityLogsComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly adminData = inject(AdminControlDataService);

  loading = true;
  workspace: AdminControlCenter | null = null;
  logs: AdminAuditEvent[] = [];
  search = '';
  fromDate = this.daysAgo(7);
  toDate = this.today();
  moduleFilter = 'all';
  userFilter = 'all';

  pageSize = UI_PAGINATION.table.defaultSize;
  page = 0;
  readonly pageSizeOptions = UI_PAGINATION.table.options;

  ngOnInit(): void {
    this.adminData.loadWorkspace()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ws => {
          this.workspace = ws;
          this.logs = (ws?.auditLogs || []);
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => { this.loading = false; this.cdr.markForCheck(); }
      });
  }

  get stats(): SaasStat[] {
    const total = this.logs.length;
    const today = this.logs.filter(l => l.occurredAt?.startsWith(this.today())).length;
    const security = this.workspace?.securityEvents?.length ?? 0;
    const failed = this.logs.filter(l => (l.action || '').toLowerCase().includes('fail')).length;
    return [
      { key: 'total', label: 'Total Logs', value: total.toLocaleString(), helper: 'In selected range', icon: 'pi pi-list', tone: 'primary' },
      { key: 'today', label: 'Today', value: today.toLocaleString(), helper: 'Logs captured today', icon: 'pi pi-calendar', tone: 'info' },
      { key: 'security', label: 'Security Events', value: security.toLocaleString(), helper: 'Auth + access events', icon: 'pi pi-shield', tone: 'warning' },
      { key: 'failed', label: 'Failed', value: failed.toLocaleString(), helper: 'Errors requiring attention', icon: 'pi pi-times-circle', tone: 'danger' }
    ];
  }

  get modules(): string[] { return Array.from(new Set(this.logs.map(l => l.entityType || 'system'))).sort(); }
  get users(): string[]   { return Array.from(new Set(this.logs.map(l => l.actorUsername || '').filter(Boolean))).sort(); }

  get moduleOptions(): SelectOption[] {
    return [
      { label: 'All', value: 'all' },
      ...this.modules.map(m => ({ label: m, value: m }))
    ];
  }

  get userOptions(): SelectOption[] {
    return [
      { label: 'All', value: 'all' },
      ...this.users.map(u => ({ label: u, value: u }))
    ];
  }

  get filtered(): AdminAuditEvent[] {
    const q = this.search.trim().toLowerCase();
    return this.logs.filter(l => {
      if (this.moduleFilter !== 'all' && (l.entityType || 'system') !== this.moduleFilter) return false;
      if (this.userFilter !== 'all' && (l.actorUsername || '') !== this.userFilter) return false;
      if (q && !(l.summary || '').toLowerCase().includes(q) && !(l.action || '').toLowerCase().includes(q)) return false;
      return true;
    });
  }

  get pageItems(): AdminAuditEvent[] {
    const start = this.page * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  get totalPages(): number { return Math.max(1, Math.ceil(this.filtered.length / this.pageSize)); }

  onPageChange(event: AppPageChangeEvent): void {
    this.page = event.page;
    this.pageSize = event.rows;
  }

  reset(): void {
    this.search = '';
    this.fromDate = this.daysAgo(7);
    this.toDate = this.today();
    this.moduleFilter = 'all';
    this.userFilter = 'all';
    this.page = 0;
  }

  exportCsv(): void {
    const rows = [['Date', 'User', 'Action', 'Module', 'Summary']];
    this.filtered.forEach(l => rows.push([
      l.occurredAt || '',
      l.actorUsername || '',
      l.action || '',
      l.entityType || '',
      (l.summary || '').replace(/\r?\n/g, ' ')
    ]));
    const csv = rows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = window.URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url; a.download = `activity-logs-${this.today()}.csv`; a.click();
    window.URL.revokeObjectURL(url);
  }

  toneFor(action: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
    const a = (action || '').toLowerCase();
    if (a.includes('fail') || a.includes('delete')) return 'danger';
    if (a.includes('warn') || a.includes('update')) return 'warning';
    if (a.includes('create') || a.includes('success')) return 'success';
    if (a.includes('login') || a.includes('logout')) return 'info';
    return 'neutral';
  }

  private today(): string { return new Date().toISOString().slice(0, 10); }
  private daysAgo(n: number): string {
    const d = new Date(); d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  }
}
