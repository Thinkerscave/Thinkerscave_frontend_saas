import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  SaasPageHeaderComponent,
  SaasPanelComponent,
  SaasPillComponent,
  SaasStat,
  SaasStatGridComponent
} from '../../../../shared/ui/saas';

interface ServiceStatus { name: string; status: 'Healthy' | 'Degraded' | 'Down'; latencyMs: number; uptime: string; description: string; }
interface JobRun { jobName: string; status: 'Success' | 'Failed' | 'Running'; lastRun: string; durationMs: number; nextRun?: string; }
interface IncidentItem { id: string; title: string; severity: 'critical' | 'warning' | 'info'; status: 'Open' | 'Mitigated' | 'Resolved'; openedAt: string; assignee: string; }

@Component({
  selector: 'tc-platform-health',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    SaasPageHeaderComponent,
    SaasStatGridComponent,
    SaasPanelComponent,
    SaasPillComponent
  ],
  templateUrl: './platform-health.component.html',
  styleUrl: './platform-health.component.scss'
})
export class PlatformHealthComponent {
  readonly refreshedAt = signal(new Date());

  readonly services = signal<ServiceStatus[]>([
    { name: 'API Gateway',         status: 'Healthy',  latencyMs:  87, uptime: '99.99%', description: 'Public REST and WebSocket entry point' },
    { name: 'Auth Service',        status: 'Healthy',  latencyMs:  62, uptime: '99.97%', description: 'JWT issuance, refresh tokens and SSO' },
    { name: 'Tenant Database',     status: 'Healthy',  latencyMs:  18, uptime: '99.99%', description: 'Multi-tenant primary database cluster' },
    { name: 'Notification Worker', status: 'Degraded', latencyMs: 412, uptime: '99.21%', description: 'Email/SMS/Push delivery pipeline' },
    { name: 'File Storage',        status: 'Healthy',  latencyMs:  44, uptime: '99.95%', description: 'Object storage for documents and uploads' },
    { name: 'Scheduler',           status: 'Healthy',  latencyMs:  21, uptime: '99.98%', description: 'Cron jobs, reminders and scheduled reports' }
  ]);

  readonly jobs = signal<JobRun[]>([
    { jobName: 'Nightly attendance roll-up',  status: 'Success', lastRun: '2025-04-21 02:15', durationMs:  92000, nextRun: '2025-04-22 02:00' },
    { jobName: 'Fee reminder dispatch',        status: 'Success', lastRun: '2025-04-21 07:01', durationMs:  18500, nextRun: '2025-04-22 07:00' },
    { jobName: 'Tenant backup snapshot',       status: 'Running', lastRun: '2025-04-21 09:00', durationMs: 142000 },
    { jobName: 'Audit log archive',            status: 'Success', lastRun: '2025-04-20 23:30', durationMs:  37000, nextRun: '2025-04-21 23:30' },
    { jobName: 'Subscription renewal reminder',status: 'Failed',  lastRun: '2025-04-21 06:00', durationMs:   4200, nextRun: '2025-04-21 18:00' }
  ]);

  readonly incidents = signal<IncidentItem[]>([
    { id: 'INC-2041', title: 'Email delivery latency above SLA',  severity: 'warning',  status: 'Open',      openedAt: '2025-04-21 08:14', assignee: 'Platform On-call' },
    { id: 'INC-2038', title: 'Tenant migration retry exhausted', severity: 'critical', status: 'Mitigated', openedAt: '2025-04-20 22:46', assignee: 'Infra Team' },
    { id: 'INC-2034', title: 'Slow query on report endpoint',     severity: 'info',     status: 'Resolved',  openedAt: '2025-04-19 14:02', assignee: 'Backend Guild' }
  ]);

  readonly stats = computed<SaasStat[]>(() => {
    const services = this.services();
    const healthy = services.filter(s => s.status === 'Healthy').length;
    const degraded = services.filter(s => s.status === 'Degraded').length;
    const open = this.incidents().filter(i => i.status === 'Open').length;
    const failed = this.jobs().filter(j => j.status === 'Failed').length;
    return [
      { key: 'uptime',   label: 'Platform Uptime',    value: '99.96%',     helper: 'Last 30 days',           icon: 'pi pi-check-circle', tone: 'success' },
      { key: 'healthy',  label: 'Healthy Services',    value: `${healthy}/${services.length}`, helper: degraded ? `${degraded} degraded` : 'All systems normal', icon: 'pi pi-server', tone: degraded ? 'warning' : 'success' },
      { key: 'jobs',     label: 'Scheduled Jobs',     value: this.jobs().length, helper: failed ? `${failed} failed` : 'All on schedule', icon: 'pi pi-clock', tone: failed ? 'danger' : 'info' },
      { key: 'incidents',label: 'Open Incidents',     value: open,         helper: open ? 'Needs attention' : 'None open',  icon: 'pi pi-exclamation-triangle', tone: open ? 'warning' : 'success' }
    ];
  });

  serviceTone(s: ServiceStatus['status']): 'success' | 'warning' | 'danger' { return s === 'Healthy' ? 'success' : s === 'Degraded' ? 'warning' : 'danger'; }
  jobTone(s: JobRun['status']): 'success' | 'warning' | 'danger' { return s === 'Success' ? 'success' : s === 'Running' ? 'warning' : 'danger'; }
  incidentTone(s: IncidentItem['severity']): 'danger' | 'warning' | 'info' { return s === 'critical' ? 'danger' : s === 'warning' ? 'warning' : 'info'; }

  refresh(): void { this.refreshedAt.set(new Date()); }

  formatMs(ms: number): string {
    if (ms < 1000) return `${ms} ms`;
    const s = Math.floor(ms / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60); const r = s % 60;
    return r ? `${m}m ${r}s` : `${m}m`;
  }
}
