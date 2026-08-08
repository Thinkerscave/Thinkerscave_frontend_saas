import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { onboardingApi } from '../../shared/constants/api.endpoint';
import { ApiResponse } from '../../shared/models/auth.model';

interface ChecklistItem {
  key: string;
  label: string;
  completed: boolean;
  count: number;
  requiredForCompletion?: boolean;
  available?: boolean;
  route?: string | null;
}

interface ChecklistResponse {
  items: ChecklistItem[];
  completedRequiredCount: number;
  requiredCount: number;
  progressPercent: number;
  recommendedNextKey?: string | null;
  recommendedNextLabel?: string | null;
  recommendedNextRoute?: string | null;
  setupComplete: boolean;
}

@Component({
  selector: 'app-onboarding-checklist',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="onboarding-wrap">
      <header class="hero">
        <h1>Organization Onboarding</h1>
        <p>Complete the setup checklist to unlock your workspace readiness.</p>
        <div class="progress" *ngIf="!error()">
          <strong>{{ progress() }}% complete</strong>
          <div class="progress__bar"><span [style.width.%]="progress()"></span></div>
        </div>
      </header>

      <div class="card card--error" *ngIf="error(); else listOrEmpty">
        <p>{{ error() }}</p>
      </div>

      <ng-template #listOrEmpty>
        <div class="card" *ngIf="items().length; else emptyState">
          <article class="row" *ngFor="let item of items()" [class.row--muted]="item.available === false">
            <div>
              <h3>{{ item.label }}</h3>
              <small *ngIf="item.available !== false">Records: {{ item.count }}</small>
              <small *ngIf="item.available === false">Coming in a later module</small>
            </div>
            <span class="badge"
                  [class.badge--done]="item.completed"
                  [class.badge--na]="item.available === false">
              {{ item.available === false ? 'Not available' : (item.completed ? 'Completed' : 'Pending') }}
            </span>
          </article>
        </div>

        <ng-template #emptyState>
          <div class="card card--empty">
            <p>Checklist data is not available yet.</p>
          </div>
        </ng-template>
      </ng-template>

      <a class="back-link" routerLink="/app">Go to dashboard</a>
    </section>
  `,
  styles: [`
    .onboarding-wrap { max-width: 860px; margin: 1.5rem auto; padding: 1rem; }
    .hero { margin-bottom: 1rem; }
    .hero h1 { margin: 0 0 .4rem; font-size: 1.5rem; }
    .hero p { margin: 0; color: #64748b; }
    .progress { margin-top: .85rem; }
    .progress__bar { margin-top: .4rem; height: 8px; border-radius: 999px; background: #e2e8f0; overflow: hidden; }
    .progress__bar span { display: block; height: 100%; background: #2563eb; }
    .card { border: 1px solid #e2e8f0; border-radius: 12px; background: #fff; overflow: hidden; }
    .row { display: flex; justify-content: space-between; align-items: center; padding: .85rem 1rem; border-bottom: 1px solid #eef2f7; }
    .row:last-child { border-bottom: none; }
    .row--muted { opacity: .7; }
    .row h3 { margin: 0 0 .2rem; font-size: 1rem; }
    .row small { color: #64748b; }
    .badge { padding: .25rem .6rem; border-radius: 999px; font-size: .78rem; background: #fef3c7; color: #92400e; }
    .badge--done { background: #dcfce7; color: #166534; }
    .badge--na { background: #e2e8f0; color: #475569; }
    .card--empty, .card--error { padding: 1rem; }
    .card--error { color: #991b1b; background: #fef2f2; border-color: #fecaca; }
    .back-link { display: inline-block; margin-top: 1rem; color: #1d4ed8; text-decoration: none; }
  `]
})
export class OnboardingChecklistComponent implements OnInit {
  private readonly http = inject(HttpClient);
  readonly items = signal<ChecklistItem[]>([]);
  readonly progress = signal(0);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.http.get<ApiResponse<ChecklistResponse>>(onboardingApi.checklist).subscribe({
      next: (res) => {
        const data = res?.data;
        this.items.set(data?.items ?? []);
        this.progress.set(data?.progressPercent ?? 0);
        this.error.set(null);
      },
      error: (err) => {
        this.items.set([]);
        this.progress.set(0);
        this.error.set(err?.error?.message || 'Unable to load onboarding checklist.');
      }
    });
  }
}
