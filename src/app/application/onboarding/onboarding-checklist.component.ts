import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { onboardingApi } from '../../shared/constants/api.endpoint';
import { ApiResponse } from '../../shared/models/auth.model';

type SetupStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

interface SetupSubtask {
  key: string;
  label: string;
  description: string;
  mandatory: boolean;
  status: SetupStatus;
  route: string;
}

interface SetupCategory {
  key: string;
  label: string;
  description: string;
  mandatory: boolean;
  status: SetupStatus;
  route: string;
  subtasks: SetupSubtask[];
}

interface ChecklistResponse {
  categories: SetupCategory[];
  completedCount: number;
  totalCount: number;
  progressPercent: number;
  setupComplete: boolean;
}

interface NextStep {
  categoryKey: string;
  categoryLabel: string;
  title: string;
  description: string;
  route: string;
  status: SetupStatus;
  mandatory: boolean;
}

const STATUS_LABELS: Record<SetupStatus, string> = {
  NOT_STARTED: 'Not started',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed'
};

@Component({
  selector: 'app-onboarding-checklist',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="setup-page">
      <a class="back-link" routerLink="/app"><i class="pi pi-arrow-left" aria-hidden="true"></i> Back to dashboard</a>

      <header class="setup-header">
        <div class="setup-header__text">
          <h1>Organization Setup</h1>
          <p>Complete these essential steps to get your organization ready. You can finish the remaining steps later.</p>
        </div>
        <div class="progress" *ngIf="data() as d">
          <strong>{{ d.completedCount }} of {{ d.totalCount }} completed</strong>
          <div class="progress__bar" role="progressbar" aria-label="Organization setup progress"
               [attr.aria-valuenow]="d.progressPercent" aria-valuemin="0" aria-valuemax="100">
            <span [style.width.%]="d.progressPercent"></span>
          </div>
        </div>
      </header>

      <div class="state state--error" *ngIf="error()" role="alert">{{ error() }}</div>
      <div class="state" *ngIf="loading() && !error()">Loading setup status...</div>

      <div class="setup-layout" *ngIf="data() as d">
        <ol class="steps" aria-label="Setup steps">
          <li class="step"
              *ngFor="let category of d.categories; let i = index"
              [class.step--current]="nextStep()?.categoryKey === category.key"
              [class.step--done]="category.status === 'COMPLETED'">
            <div class="step__marker" aria-hidden="true">
              <i *ngIf="category.status === 'COMPLETED'" class="pi pi-check"></i>
              <span *ngIf="category.status !== 'COMPLETED'">{{ i + 1 }}</span>
            </div>

            <div class="step__content">
              <div class="step__head">
                <div class="step__title">
                  <h2>{{ category.label }}</h2>
                  <span class="tag" [class.tag--optional]="!category.mandatory">
                    {{ category.mandatory ? 'Mandatory' : 'Can be completed later' }}
                  </span>
                </div>
                <span class="status" [ngClass]="statusClass(category.status)">{{ statusLabel(category.status) }}</span>
              </div>
              <p class="step__desc">{{ category.description }}</p>

              <div class="step__actions">
                <button *ngIf="category.subtasks.length" type="button" class="btn btn--ghost"
                        [attr.aria-expanded]="isExpanded(category.key)"
                        [attr.aria-controls]="'setup-steps-' + category.key"
                        (click)="toggle(category.key)">
                  {{ isExpanded(category.key) ? 'Hide steps' : 'Show steps' }}
                </button>
                <a class="btn" [class.btn--primary]="category.status !== 'COMPLETED'"
                   [routerLink]="category.route">{{ actionLabel(category.status) }}</a>
              </div>

              <ul class="subtasks" *ngIf="category.subtasks.length && isExpanded(category.key)"
                  [id]="'setup-steps-' + category.key">
                <li class="subtask" *ngFor="let sub of category.subtasks">
                  <div class="subtask__main">
                    <h3>{{ sub.label }}
                      <span class="tag tag--small" [class.tag--optional]="!sub.mandatory">{{ sub.mandatory ? 'Required' : 'Optional' }}</span>
                    </h3>
                    <p>{{ sub.description }}</p>
                  </div>
                  <div class="subtask__actions">
                    <span class="status" [ngClass]="statusClass(sub.status)">{{ statusLabel(sub.status) }}</span>
                    <a class="btn" [class.btn--primary]="sub.status !== 'COMPLETED'"
                       [routerLink]="sub.route">{{ actionLabel(sub.status) }}</a>
                  </div>
                </li>
              </ul>
            </div>
          </li>
        </ol>

        <aside class="aside" aria-label="Setup guidance">
          <div class="next-card" *ngIf="nextStep() as next; else allDone">
            <p class="next-card__kicker">{{ next.mandatory ? 'Next step' : 'Optional next step' }}</p>
            <h2 class="next-card__title">{{ next.title }}</h2>
            <p class="next-card__desc">{{ next.description }}</p>
            <p class="next-card__meta">{{ next.categoryLabel }} &middot; {{ statusLabel(next.status) }}</p>
            <a class="btn btn--primary btn--block" [routerLink]="next.route">
              {{ actionLabel(next.status) }} <i class="pi pi-arrow-right" aria-hidden="true"></i>
            </a>
          </div>
          <ng-template #allDone>
            <div class="next-card next-card--done">
              <p class="next-card__kicker">All required steps complete</p>
              <h2 class="next-card__title">Your organization is ready</h2>
              <p class="next-card__desc">Mandatory setup is finished. Optional steps can be completed at any time.</p>
            </div>
          </ng-template>

          <div class="summary">
            <h3>Required steps</h3>
            <p>{{ requiredDone() }} of {{ requiredTotal() }} completed</p>
            <h3>Optional steps</h3>
            <p>{{ optionalDone() }} of {{ optionalTotal() }} completed</p>
          </div>
        </aside>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; width: 100%; }
    .setup-page { width: 100%; box-sizing: border-box; padding: 1.25rem clamp(1rem, 2.5vw, 2rem) 2rem; color: var(--saas-text, #0f172a); }
    .back-link { display: inline-flex; align-items: center; gap: .4rem; margin-bottom: .75rem; color: var(--saas-primary, #1d4ed8); text-decoration: none; font-size: .9rem; }
    .setup-header { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 1rem; align-items: flex-end; margin-bottom: 1.25rem; }
    .setup-header__text { flex: 1 1 360px; min-width: 0; }
    .setup-header h1 { margin: 0 0 .35rem; font-size: clamp(1.25rem, 2.2vw, 1.6rem); }
    .setup-header p { margin: 0; color: var(--saas-text-muted, #64748b); }
    .progress { flex: 0 1 280px; min-width: 200px; }
    .progress strong { font-size: .9rem; }
    .progress__bar { margin-top: .4rem; height: 8px; border-radius: 999px; background: var(--saas-surface-muted, #e2e8f0); overflow: hidden; }
    .progress__bar span { display: block; height: 100%; background: var(--saas-primary, #2563eb); transition: width .4s ease; }
    .state { padding: 1rem; border-radius: 12px; background: var(--saas-surface, #fff); border: 1px solid var(--saas-border, #e2e8f0); color: var(--saas-text-muted, #64748b); }
    .state--error { color: var(--saas-danger, #991b1b); background: var(--saas-danger-soft, #fef2f2); border-color: #fecaca; }

    .setup-layout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(260px, 340px); gap: 1.25rem; align-items: start; }
    .steps { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 1rem; min-width: 0; }
    .step { display: flex; gap: 1rem; padding: 1.1rem 1.2rem; border-radius: 12px; border: 1px solid var(--saas-border, #e2e8f0); background: var(--saas-surface, #fff); min-width: 0; }
    .step--current { border-color: var(--saas-primary, #2563eb); box-shadow: 0 0 0 3px var(--saas-primary-soft, #dbeafe); }
    .step__marker { flex: 0 0 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; background: var(--saas-surface-muted, #f1f5f9); color: var(--saas-text-muted, #475569); border: 1px solid var(--saas-border-strong, #cbd5e1); }
    .step--current .step__marker { background: var(--saas-primary, #2563eb); border-color: var(--saas-primary, #2563eb); color: #fff; }
    .step--done .step__marker { background: var(--saas-success-soft, #dcfce7); border-color: transparent; color: var(--saas-success, #166534); }
    .step__content { flex: 1; min-width: 0; }
    .step__head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: .5rem; }
    .step__title { display: flex; flex-wrap: wrap; align-items: center; gap: .5rem; min-width: 0; }
    .step h2 { margin: 0; font-size: 1rem; }
    .step__desc { margin: .35rem 0 0; color: var(--saas-text-muted, #64748b); font-size: .9rem; }
    .step__actions { display: flex; flex-wrap: wrap; gap: .5rem; margin-top: .75rem; }

    .subtasks { list-style: none; margin: .85rem 0 0; padding: .25rem .9rem; border-radius: 10px; border: 1px solid var(--saas-border, #eef2f7); background: var(--saas-surface-muted, #f8fafc); }
    .subtask { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: .75rem; padding: .75rem 0; border-top: 1px solid var(--saas-border, #eef2f7); }
    .subtask:first-child { border-top: none; }
    .subtask__main { flex: 1 1 260px; min-width: 0; }
    .subtask h3 { margin: 0; font-size: .95rem; display: flex; flex-wrap: wrap; align-items: center; gap: .4rem; }
    .subtask p { margin: .2rem 0 0; color: var(--saas-text-muted, #64748b); font-size: .875rem; }
    .subtask__actions { display: flex; align-items: center; gap: .5rem; flex-wrap: wrap; }

    .tag { padding: .15rem .55rem; border-radius: 999px; font-size: .75rem; background: var(--saas-primary-soft, #dbeafe); color: var(--saas-primary-dark, #1e40af); white-space: nowrap; }
    .tag--optional { background: var(--saas-surface-muted, #f1f5f9); color: var(--saas-text-muted, #475569); }
    .tag--small { font-size: .7rem; padding: .1rem .45rem; }
    .status { padding: .2rem .6rem; border-radius: 999px; font-size: .78rem; white-space: nowrap; background: var(--saas-surface-muted, #f1f5f9); color: var(--saas-text-muted, #475569); }
    .status--done { background: var(--saas-success-soft, #dcfce7); color: var(--saas-success, #166534); }
    .status--progress { background: var(--saas-warning-soft, #fef3c7); color: var(--saas-warning, #92400e); }
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: .4rem; padding: .45rem .9rem; border-radius: 8px; border: 1px solid var(--saas-border-strong, #cbd5e1); background: var(--saas-surface, #fff); color: var(--saas-text, #0f172a); text-decoration: none; font-size: .85rem; cursor: pointer; }
    .btn--primary { background: var(--saas-primary, #2563eb); border-color: var(--saas-primary, #2563eb); color: #fff; }
    .btn--ghost { border-color: transparent; background: transparent; color: var(--saas-primary, #1d4ed8); padding-left: 0; }
    .btn--block { width: 100%; }
    .btn:focus-visible { outline: 2px solid var(--saas-primary, #2563eb); outline-offset: 2px; }

    .aside { display: flex; flex-direction: column; gap: 1rem; position: sticky; top: 1rem; }
    .next-card { padding: 1.25rem; border-radius: 12px; border: 1px solid var(--saas-primary, #2563eb); background: var(--saas-primary-soft, #eff6ff); display: flex; flex-direction: column; gap: .5rem; }
    .next-card--done { border-color: var(--saas-success, #166534); background: var(--saas-success-soft, #f0fdf4); }
    .next-card__kicker { margin: 0; font-size: .75rem; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: var(--saas-primary-dark, #1e40af); }
    .next-card__title { margin: 0; font-size: 1.05rem; }
    .next-card__desc { margin: 0; font-size: .9rem; color: var(--saas-text-muted, #475569); }
    .next-card__meta { margin: 0; font-size: .8rem; color: var(--saas-text-muted, #64748b); }
    .summary { padding: 1rem 1.2rem; border-radius: 12px; border: 1px solid var(--saas-border, #e2e8f0); background: var(--saas-surface, #fff); }
    .summary h3 { margin: .25rem 0 .15rem; font-size: .8rem; text-transform: uppercase; letter-spacing: .04em; color: var(--saas-text-muted, #64748b); }
    .summary p { margin: 0 0 .75rem; font-size: .95rem; }

    @media (max-width: 1024px) {
      .setup-layout { grid-template-columns: minmax(0, 1fr); }
      .aside { position: static; order: -1; display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
    }
    @media (max-width: 600px) {
      .setup-page { padding: 1rem .75rem 1.5rem; }
      .progress { flex-basis: 100%; min-width: 0; }
      .step { padding: .9rem; gap: .75rem; }
      .step__marker { flex-basis: 30px; height: 30px; font-size: .85rem; }
      .step__actions .btn, .subtask__actions .btn { flex: 1 1 auto; justify-content: center; }
      .subtasks { padding: .25rem .7rem; }
    }
  `]
})
export class OnboardingChecklistComponent implements OnInit {
  private readonly http = inject(HttpClient);
  readonly data = signal<ChecklistResponse | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  private readonly expanded = signal<Record<string, boolean>>({});

  /**
   * First incomplete required step (in category order, then sub-step order).
   * Falls back to the first incomplete optional category once required setup is done.
   * Uses only the statuses returned by the backend.
   */
  readonly nextStep = computed<NextStep | null>(() => {
    const d = this.data();
    if (!d) return null;
    const pick = (mandatory: boolean): NextStep | null => {
      for (const cat of d.categories) {
        if (cat.mandatory !== mandatory || cat.status === 'COMPLETED') continue;
        const sub = cat.subtasks.find(s => s.mandatory === mandatory && s.status !== 'COMPLETED');
        return {
          categoryKey: cat.key,
          categoryLabel: cat.label,
          title: sub?.label ?? cat.label,
          description: sub?.description ?? cat.description,
          route: sub?.route ?? cat.route,
          status: sub?.status ?? cat.status,
          mandatory
        };
      }
      return null;
    };
    return pick(true) ?? pick(false);
  });

  readonly requiredTotal = computed(() => (this.data()?.categories ?? []).filter(c => c.mandatory).length);
  readonly requiredDone = computed(() => (this.data()?.categories ?? []).filter(c => c.mandatory && c.status === 'COMPLETED').length);
  readonly optionalTotal = computed(() => (this.data()?.categories ?? []).filter(c => !c.mandatory).length);
  readonly optionalDone = computed(() => (this.data()?.categories ?? []).filter(c => !c.mandatory && c.status === 'COMPLETED').length);

  ngOnInit(): void {
    this.http.get<ApiResponse<ChecklistResponse>>(onboardingApi.checklist).subscribe({
      next: (res) => {
        this.data.set(res?.data ?? null);
        this.error.set(null);
        this.loading.set(false);
      },
      error: (err) => {
        this.data.set(null);
        this.error.set(err?.error?.message || 'Unable to load organization setup. Please try again.');
        this.loading.set(false);
      }
    });
  }

  statusLabel(status: SetupStatus): string {
    return STATUS_LABELS[status] ?? STATUS_LABELS.NOT_STARTED;
  }

  statusClass(status: SetupStatus): string {
    if (status === 'COMPLETED') return 'status--done';
    if (status === 'IN_PROGRESS') return 'status--progress';
    return '';
  }

  actionLabel(status: SetupStatus): string {
    return status === 'COMPLETED' ? 'View' : 'Set up';
  }

  /** Steps are expanded by default; the user can collapse them. */
  isExpanded(key: string): boolean {
    return this.expanded()[key] ?? true;
  }

  toggle(key: string): void {
    this.expanded.update((state) => ({ ...state, [key]: !this.isExpanded(key) }));
  }
}

