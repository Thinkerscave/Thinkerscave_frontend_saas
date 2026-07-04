import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { finalize, forkJoin } from 'rxjs';

import { AdmissionsCrmService } from '../../services/admissions-crm.service';
import {
  SaasPageHeaderComponent,
  SaasPanelComponent,
  SaasStat,
  SaasStatGridComponent
} from '../../../../shared/ui/saas';

interface FunnelEntry {
  label: string;
  value: number;
  pct: number;
}

interface SourceEntry {
  label: string;
  value: number;
  pct: number;
}

@Component({
  selector: 'app-admissions-reports',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ToastModule,
    SaasPageHeaderComponent,
    SaasPanelComponent,
    SaasStatGridComponent
  ],
  styleUrls: ['../../admissions.shared.scss'],
  templateUrl: './admissions-reports.component.html',
  styles: [`
    .funnel-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .funnel-row {
      display: grid;
      grid-template-columns: 140px 1fr 56px;
      gap: 12px;
      align-items: center;
    }
    .funnel-row__label {
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--tc-text);
    }
    .funnel-row__bar {
      height: 24px;
      background: var(--tc-surface-100);
      border-radius: 999px;
      overflow: hidden;
    }
    .funnel-row__bar > span {
      display: block;
      height: 100%;
      background: linear-gradient(90deg, var(--tc-primary-500), var(--tc-primary-700));
      border-radius: 999px;
      transition: width 0.3s ease;
      min-width: 4px;
    }
    .funnel-row__value {
      font-size: 0.88rem;
      font-weight: 700;
      text-align: right;
      color: var(--tc-primary-600);
    }
    .source-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 10px;
    }
    .source-item {
      padding: 14px 16px;
      background: var(--tc-surface-50);
      border-radius: var(--tc-radius-md, 12px);
      border: 1px solid var(--tc-border);
    }
    .source-item strong {
      display: block;
      font-size: 1.2rem;
      color: var(--tc-text);
    }
    .source-item span {
      font-size: 0.78rem;
      color: var(--tc-text-muted);
    }
    .counselor-table-wrap { overflow-x: auto; }
    .counselor-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.88rem;
    }
    .counselor-table th, .counselor-table td {
      padding: 10px 12px;
      text-align: left;
      border-bottom: 1px solid var(--tc-border);
    }
    .counselor-table th {
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      color: var(--tc-text-muted);
      font-weight: 700;
    }
  `]
})
export class AdmissionsReportsComponent implements OnInit {
  private readonly api = inject(AdmissionsCrmService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messages = inject(MessageService);

  loading = false;
  errorMessage = '';

  overviewStats: SaasStat[] = [];
  funnelEntries: FunnelEntry[] = [];
  sourceEntries: SourceEntry[] = [];
  counselorRows: Record<string, unknown>[] = [];
  counselorColumns: string[] = [];

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    this.loading = true;
    forkJoin({
      overview: this.api.reportsOverview(),
      funnel: this.api.reportsFunnel(),
      sources: this.api.reportsSourceAnalysis(),
      counselors: this.api.reportsCounselorPerformance()
    })
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: ({ overview, funnel, sources, counselors }) => {
          this.overviewStats = this.mapOverview(overview);
          this.funnelEntries = this.mapFunnel(funnel);
          this.sourceEntries = this.mapSources(sources);
          this.counselorRows = counselors;
          this.counselorColumns = this.extractColumns(counselors);
          this.errorMessage = '';
        },
        error: () => {
          this.errorMessage = 'Unable to load admissions reports.';
          this.messages.add({
            severity: 'error',
            summary: 'Load failed',
            detail: this.errorMessage
          });
        }
      });
  }

  private mapOverview(data: Record<string, unknown>): SaasStat[] {
    const icons: Record<string, string> = {
      totalApplications: 'pi pi-file',
      totalLeads: 'pi pi-users',
      conversionRate: 'pi pi-percentage',
      enrolled: 'pi pi-check-circle'
    };
    const tones: SaasStat['tone'][] = ['primary', 'info', 'success', 'warning'];

    return Object.entries(data).map(([key, value], i) => ({
      key,
      label: this.formatLabel(key),
      value: typeof value === 'number' ? value : String(value ?? '—'),
      icon: icons[key] ?? 'pi pi-chart-bar',
      tone: tones[i % tones.length]
    }));
  }

  private mapFunnel(data: Record<string, number>): FunnelEntry[] {
    const entries = Object.entries(data ?? {}).map(([label, value]) => ({
      label: this.formatLabel(label),
      value: value ?? 0,
      pct: 0
    }));
    const max = Math.max(...entries.map(e => e.value), 1);
    return entries.map(e => ({ ...e, pct: Math.round((e.value / max) * 100) }));
  }

  private mapSources(data: Record<string, number>): SourceEntry[] {
    const entries = Object.entries(data ?? {}).map(([label, value]) => ({
      label: this.formatLabel(label),
      value: value ?? 0,
      pct: 0
    }));
    const total = entries.reduce((sum, e) => sum + e.value, 0) || 1;
    return entries.map(e => ({ ...e, pct: Math.round((e.value / total) * 100) }));
  }

  private extractColumns(rows: Record<string, unknown>[]): string[] {
    if (!rows.length) return [];
    return Object.keys(rows[0]);
  }

  formatLabel(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .trim()
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  formatCell(value: unknown): string {
    if (value == null) return '—';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  exportFunnelCsv(): void {
    if (!this.funnelEntries.length) {
      this.messages.add({
        severity: 'info',
        summary: 'Nothing to export',
        detail: 'Funnel data is empty.'
      });
      return;
    }

    const headers = ['Stage', 'Count', 'Percent of max'];
    const rows = this.funnelEntries.map(e => [e.label, e.value, e.pct]);
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'admissions-funnel.csv';
    link.click();
    URL.revokeObjectURL(url);

    this.messages.add({
      severity: 'success',
      summary: 'Exported',
      detail: 'Funnel data exported as CSV.'
    });
  }
}
