import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { finalize, forkJoin } from 'rxjs';

import {
  SaasPanelComponent,
  SaasStat,
  SaasStatGridComponent
} from '../../../../shared/ui/saas';
import { admissionsPageConfig } from '../../data/admissions-workspace.config';
import {
  FollowUpRecord,
  LeadKpi,
  LeadQuickActions
} from '../../models/admissions-crm.model';
import { AdmissionsCrmService } from '../../services/admissions-crm.service';

interface QuickTile {
  key: keyof LeadQuickActions;
  label: string;
  hint: string;
  icon: string;
  tone: 'info' | 'success' | 'warning' | 'danger';
  route: string;
  queryParams?: Record<string, string>;
}

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
  selector: 'app-admissions-overview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppToastComponent, 
    CommonModule,
    RouterLink,
    SaasStatGridComponent,
    SaasPanelComponent
  ],
  providers: [MessageService],
  styleUrls: ['../../admissions.shared.scss', '../../../students/students.shared.scss'],
  templateUrl: './admissions-overview.component.html',
  styles: [`
    .adm-skeleton-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 14px;
    }
    .adm-skeleton {
      height: 96px;
      border-radius: 16px;
      background: linear-gradient(90deg, var(--tc-surface-100) 25%, var(--tc-surface-50) 50%, var(--tc-surface-100) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.2s infinite;
    }
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    .adm-funnel-list { display: flex; flex-direction: column; gap: 12px; }
    .adm-funnel-row { display: grid; grid-template-columns: 120px 1fr 48px; gap: 10px; align-items: center; }
    .adm-funnel-row small { font-size: 0.78rem; font-weight: 600; color: var(--tc-text-muted); text-transform: uppercase; }
    .adm-funnel-track {
      height: 10px; border-radius: 999px; background: var(--tc-surface-100); overflow: hidden;
    }
    .adm-funnel-fill {
      height: 100%; border-radius: 999px;
      background: linear-gradient(90deg, var(--tc-primary-500), var(--tc-primary-700));
      transition: width 250ms ease;
    }
    .adm-funnel-row strong { font-size: 0.88rem; text-align: right; }
    .adm-source-list { display: flex; flex-direction: column; gap: 10px; }
    .adm-source-row { display: grid; grid-template-columns: 1fr auto; gap: 8px; align-items: center; }
    .adm-source-row span { font-size: 0.84rem; color: var(--tc-text); font-weight: 600; }
    .adm-source-bar {
      grid-column: 1 / -1; height: 8px; border-radius: 999px; background: var(--tc-surface-100); overflow: hidden;
    }
    .adm-source-bar > i {
      display: block; height: 100%; border-radius: 999px;
      background: color-mix(in srgb, var(--tc-info) 70%, var(--tc-primary-500));
    }
    .adm-source-row em { font-style: normal; font-size: 0.78rem; color: var(--tc-text-muted); }
    .adm-overview-grid {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 16px;
    }
    @media (max-width: 960px) { .adm-overview-grid { grid-template-columns: 1fr; } }
  `]
})
export class AdmissionsOverviewComponent implements OnInit {
  private readonly api = inject(AdmissionsCrmService);
  private readonly router = inject(Router);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly pageConfig = admissionsPageConfig('overview');

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly kpi = signal<LeadKpi | null>(null);
  readonly quick = signal<LeadQuickActions | null>(null);
  readonly reportsOverview = signal<Record<string, unknown> | null>(null);
  readonly funnel = signal<Record<string, number>>({});
  readonly sourceAnalysis = signal<Record<string, number>>({});
  readonly todayFollowUps = signal<FollowUpRecord[]>([]);

  readonly quickTiles: QuickTile[] = [
    {
      key: 'todaysCalls',
      label: "Today's Calls",
      hint: 'Telephonic follow-ups scheduled today',
      icon: 'pi pi-phone',
      tone: 'info',
      route: '/app/admissions/follow-ups',
      queryParams: { tab: 'today' }
    },
    {
      key: 'todaysMeetings',
      label: "Today's Meetings",
      hint: 'Walk-ins and campus visits',
      icon: 'pi pi-calendar',
      tone: 'info',
      route: '/app/admissions/follow-ups',
      queryParams: { tab: 'today' }
    },
    {
      key: 'overdueFollowUps',
      label: 'Overdue Follow-ups',
      hint: 'Requires immediate attention',
      icon: 'pi pi-exclamation-triangle',
      tone: 'danger',
      route: '/app/admissions/follow-ups',
      queryParams: { tab: 'overdue' }
    },
    {
      key: 'admissionReady',
      label: 'Admission Ready',
      hint: 'Leads ready for application',
      icon: 'pi pi-check-circle',
      tone: 'success',
      route: '/app/admissions/leads',
      queryParams: { status: 'READY_FOR_ADMISSION' }
    }
  ];

  readonly stats = computed((): SaasStat[] => {
    const k = this.kpi();
    const r = this.reportsOverview();
    if (!k) return [];

    const pipelineTotal = this.numFromReport(r, ['totalLeads', 'totalInquiries', 'pipelineTotal']);
    const conversion = this.numFromReport(r, ['conversionRate', 'conversionPercent']);

    return [
      {
        key: 'newInquiries',
        label: 'New Inquiries',
        value: k.newInquiries,
        helper: pipelineTotal ? `${pipelineTotal} in pipeline` : 'Awaiting first contact',
        icon: 'pi pi-inbox',
        tone: 'info'
      },
      {
        key: 'todaysFollowUps',
        label: "Today's Follow-ups",
        value: k.todaysFollowUps,
        helper: 'Scheduled for today',
        icon: 'pi pi-calendar',
        tone: 'warning'
      },
      {
        key: 'interested',
        label: 'Interested',
        value: k.interested,
        helper: 'Ready for counseling',
        icon: 'pi pi-heart',
        tone: 'success'
      },
      {
        key: 'admissionReady',
        label: 'Admission Ready',
        value: k.admissionReady,
        helper: 'Documents collected',
        icon: 'pi pi-check-circle',
        tone: 'success'
      },
      {
        key: 'futureProspects',
        label: 'Future Prospects',
        value: k.futureProspects,
        helper: 'Long-term opportunities',
        icon: 'pi pi-clock',
        tone: 'neutral'
      },
      {
        key: 'closed',
        label: 'Closed',
        value: k.closed,
        helper: conversion != null ? `${conversion}% conversion` : 'Lost or converted',
        icon: 'pi pi-ban',
        tone: 'danger'
      }
    ];
  });

  readonly funnelEntries = computed((): FunnelEntry[] => {
    const data = this.funnel();
    const entries = Object.entries(data).map(([label, value]) => ({ label, value: value ?? 0 }));
    const max = Math.max(...entries.map(e => e.value), 1);
    return entries.map(e => ({
      label: this.formatLabel(e.label),
      value: e.value,
      pct: Math.round((e.value / max) * 100)
    }));
  });

  readonly sourceEntries = computed((): SourceEntry[] => {
    const data = this.sourceAnalysis();
    const entries = Object.entries(data).map(([label, value]) => ({ label, value: value ?? 0 }));
    const total = entries.reduce((s, e) => s + e.value, 0) || 1;
    return entries
      .sort((a, b) => b.value - a.value)
      .map(e => ({
        label: e.label,
        value: e.value,
        pct: Math.round((e.value / total) * 100)
      }));
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      kpi: this.api.leadKpi(),
      quick: this.api.leadQuickActions(),
      overview: this.api.reportsOverview(),
      funnel: this.api.reportsFunnel(),
      sources: this.api.reportsSourceAnalysis(),
      today: this.api.todayFollowUps()
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: ({ kpi, quick, overview, funnel, sources, today }) => {
          this.kpi.set(kpi);
          this.quick.set(quick);
          this.reportsOverview.set(overview);
          this.funnel.set(funnel ?? {});
          this.sourceAnalysis.set(sources ?? {});
          this.todayFollowUps.set(today);
        },
        error: () => {
          const msg = 'Unable to load admissions overview. Please retry.';
          this.error.set(msg);
          this.messages.add({ severity: 'error', summary: 'Load failed', detail: msg });
        }
      });
  }

  navigateQuick(tile: QuickTile): void {
    this.router.navigate([tile.route], { queryParams: tile.queryParams });
  }

  newLead(): void {
    this.router.navigate(['/app/admissions/leads'], { queryParams: { openDrawer: '1' } });
  }

  openFollowUp(fu: FollowUpRecord): void {
    if (fu.inquiryId) {
      this.router.navigate(['/app/admissions/lead', fu.inquiryId]);
    }
  }

  private numFromReport(r: Record<string, unknown> | null, keys: string[]): number | null {
    if (!r) return null;
    for (const key of keys) {
      const v = r[key];
      if (typeof v === 'number') return v;
      if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v);
    }
    return null;
  }

  private formatLabel(key: string): string {
    return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}
