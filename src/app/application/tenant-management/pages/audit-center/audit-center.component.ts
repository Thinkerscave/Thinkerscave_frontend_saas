import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { PlatformAuditLog, PlatformSecurityAuditLog } from '../../models/platform.model';
import { PlatformManagementService } from '../../services/platform-management.service';
import { SaasPageHeaderComponent, SaasStat, SaasStatGridComponent, SaasPillComponent } from '../../../../shared/ui/saas';

type EventCategory = 'all' | 'user' | 'tenant' | 'security' | 'auth' | 'subscription' | 'configuration';
type Severity = 'all' | 'info' | 'warn' | 'critical';

interface TimelineEvent {
  id: string;
  category: EventCategory;
  categoryLabel: string;
  severity: Severity;
  icon: string;
  actor: string;
  tenant: string;
  action: string;
  summary: string;
  occurredAt: string;
  ip?: string;
  tags: string[];
}

@Component({
  selector: 'app-audit-center',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, SaasPageHeaderComponent, SaasStatGridComponent, SaasPillComponent],
  templateUrl: './audit-center.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuditCenterComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformApi = inject(PlatformManagementService);

  loading = true;
  errorMessage = '';
  events: TimelineEvent[] = [];
  viewMode: 'timeline' | 'table' = 'timeline';

  search = '';
  category: EventCategory = 'all';
  severity: Severity = 'all';
  tenantFilter = 'all';
  actorFilter = '';
  fromDate = '';
  toDate = '';

  readonly categories: { id: EventCategory; label: string; icon: string }[] = [
    { id: 'all', label: 'All events', icon: 'pi-list' },
    { id: 'user', label: 'User activity', icon: 'pi-user' },
    { id: 'tenant', label: 'Tenant activity', icon: 'pi-building' },
    { id: 'security', label: 'Security events', icon: 'pi-shield' },
    { id: 'auth', label: 'Authentication', icon: 'pi-sign-in' },
    { id: 'subscription', label: 'Subscription', icon: 'pi-credit-card' },
    { id: 'configuration', label: 'Configuration', icon: 'pi-cog' }
  ];

  ngOnInit(): void {
    const tenant = this.route.snapshot.queryParamMap.get('tenant');
    if (tenant) this.tenantFilter = tenant;
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    forkJoin({
      audit: this.platformApi.getAuditLogs(0, 200),
      security: this.platformApi.getSecurityAuditLogs(0, 200)
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ audit, security }) => {
          this.events = [
            ...(audit.content ?? []).map(e => this.fromAudit(e)),
            ...(security.content ?? []).map(e => this.fromSecurity(e))
          ].sort((a, b) => (b.occurredAt || '').localeCompare(a.occurredAt || ''));
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.events = [];
          this.errorMessage = 'Unable to load audit events. Verify backend access and try again.';
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  private fromAudit(e: PlatformAuditLog): TimelineEvent {
    const cat = this.deriveCategory(e.eventType ?? '', e.action, e.entityType);
    return {
      id: `a-${e.id}`,
      category: cat,
      categoryLabel: this.labelFor(cat),
      severity: 'info',
      icon: this.iconFor(cat),
      actor: e.actorUsername || 'system',
      tenant: e.tenantCode || (e.entityType === 'TENANT' ? (e.entityId || 'platform') : 'platform'),
      action: e.action,
      summary: e.summary || e.changes || '—',
      occurredAt: e.occurredAt,
      ip: e.sourceIp,
      tags: [e.eventType, e.entityType].filter(Boolean) as string[]
    };
  }

  private fromSecurity(e: PlatformSecurityAuditLog): TimelineEvent {
    const sev: Severity = (e.severity || '').toLowerCase().includes('critical') ? 'critical' : (e.success ? 'info' : 'warn');
    return {
      id: `s-${e.id}`,
      category: e.eventCode?.toLowerCase().includes('login') ? 'auth' : 'security',
      categoryLabel: e.eventCode?.toLowerCase().includes('login') ? 'Authentication' : 'Security events',
      severity: sev,
      icon: e.success ? 'pi-shield' : 'pi-exclamation-triangle',
      actor: e.username || 'unknown',
      tenant: e.tenantCode || 'platform',
      action: e.eventCode,
      summary: e.message || '—',
      occurredAt: e.occurredAt,
      ip: e.sourceIp,
      tags: [e.severity, e.success ? 'SUCCESS' : 'FAILURE'].filter(Boolean) as string[]
    };
  }

  private deriveCategory(type: string, action: string, entity?: string): EventCategory {
    const haystack = `${type} ${action} ${entity}`.toLowerCase();
    if (haystack.includes('subscription') || haystack.includes('plan') || haystack.includes('billing')) return 'subscription';
    if (haystack.includes('tenant') || haystack.includes('organization')) return 'tenant';
    if (haystack.includes('config') || haystack.includes('setting') || haystack.includes('menu')) return 'configuration';
    if (haystack.includes('login') || haystack.includes('logout') || haystack.includes('auth')) return 'auth';
    if (haystack.includes('security') || haystack.includes('permission')) return 'security';
    return 'user';
  }

  private labelFor(c: EventCategory): string {
    return this.categories.find(x => x.id === c)?.label ?? c;
  }

  private iconFor(c: EventCategory): string {
    return this.categories.find(x => x.id === c)?.icon ?? 'pi-circle';
  }

  get tenantOptions(): string[] {
    const set = new Set<string>(this.events.map(e => e.tenant).filter(Boolean));
    return Array.from(set).sort();
  }

  get filtered(): TimelineEvent[] {
    const q = this.search.trim().toLowerCase();
    const actor = this.actorFilter.trim().toLowerCase();
    return this.events.filter(e => {
      if (this.category !== 'all' && e.category !== this.category) return false;
      if (this.severity !== 'all' && e.severity !== this.severity) return false;
      if (this.tenantFilter !== 'all' && e.tenant !== this.tenantFilter) return false;
      if (actor && !e.actor.toLowerCase().includes(actor)) return false;
      if (this.fromDate && e.occurredAt < this.fromDate) return false;
      if (this.toDate && e.occurredAt > this.toDate + 'T23:59:59') return false;
      if (!q) return true;
      return e.action.toLowerCase().includes(q) || e.summary.toLowerCase().includes(q) || e.actor.toLowerCase().includes(q);
    });
  }

  get groupedFiltered(): { date: string; events: TimelineEvent[] }[] {
    const list = this.filtered;
    const map = new Map<string, TimelineEvent[]>();
    for (const e of list) {
      const date = (e.occurredAt || '').split('T')[0];
      if (!map.has(date)) map.set(date, []);
      map.get(date)!.push(e);
    }
    return Array.from(map.entries())
      .map(([date, events]) => ({ date, events }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  get stats(): SaasStat[] {
    return [
      { key: 'total', label: 'Events Recorded', value: this.events.length, helper: 'Across all tenants', icon: 'pi pi-list', tone: 'primary' },
      { key: 'critical', label: 'Critical Alerts', value: this.events.filter(e => e.severity === 'critical').length, helper: 'Severity flagged', icon: 'pi pi-exclamation-triangle', tone: 'danger' },
      { key: 'failedAuth', label: 'Failed Sign-ins', value: this.events.filter(e => e.category === 'auth' && e.severity !== 'info').length, helper: 'Auth issues to review', icon: 'pi pi-sign-in', tone: 'warning' },
      { key: 'config', label: 'Config Changes', value: this.events.filter(e => e.category === 'configuration').length, helper: 'Settings and access edits', icon: 'pi pi-cog', tone: 'info' }
    ];
  }

  resetFilters(): void {
    this.search = '';
    this.category = 'all';
    this.severity = 'all';
    this.tenantFilter = 'all';
    this.actorFilter = '';
    this.fromDate = '';
    this.toDate = '';
  }

  exportCsv(): void {
    const rows = this.filtered.map(e => [
      e.occurredAt, e.category, e.severity, e.tenant, e.actor, e.action, (e.summary || '').replace(/[\r\n,]+/g, ' ')
    ].map(v => `"${(v ?? '').toString().replace(/"/g, '""')}"`).join(','));
    const csv = ['Occurred,Category,Severity,Tenant,Actor,Action,Summary', ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tenant-audit-${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }
}
