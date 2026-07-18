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
      </header>

      <div class="card" *ngIf="items().length; else emptyState">
        <article class="row" *ngFor="let item of items()">
          <div>
            <h3>{{ item.label }}</h3>
            <small>Records: {{ item.count }}</small>
          </div>
          <span class="badge" [class.badge--done]="item.completed">
            {{ item.completed ? 'Completed' : 'Pending' }}
          </span>
        </article>
      </div>

      <ng-template #emptyState>
        <div class="card card--empty">
          <p>Checklist data is not available yet.</p>
        </div>
      </ng-template>

      <a class="back-link" routerLink="/app">Go to dashboard</a>
    </section>
  `,
  styles: [`
    .onboarding-wrap { max-width: 860px; margin: 1.5rem auto; padding: 1rem; }
    .hero { margin-bottom: 1rem; }
    .hero h1 { margin: 0 0 .4rem; font-size: 1.5rem; }
    .hero p { margin: 0; color: #64748b; }
    .card { border: 1px solid #e2e8f0; border-radius: 12px; background: #fff; overflow: hidden; }
    .row { display: flex; justify-content: space-between; align-items: center; padding: .85rem 1rem; border-bottom: 1px solid #eef2f7; }
    .row:last-child { border-bottom: none; }
    .row h3 { margin: 0 0 .2rem; font-size: 1rem; }
    .row small { color: #64748b; }
    .badge { padding: .25rem .6rem; border-radius: 999px; font-size: .78rem; background: #fef3c7; color: #92400e; }
    .badge--done { background: #dcfce7; color: #166534; }
    .card--empty { padding: 1rem; }
    .back-link { display: inline-block; margin-top: 1rem; color: #1d4ed8; text-decoration: none; }
  `]
})
export class OnboardingChecklistComponent implements OnInit {
  private readonly http = inject(HttpClient);
  readonly items = signal<ChecklistItem[]>([]);

  ngOnInit(): void {
    this.http.get<ApiResponse<ChecklistItem[]>>(onboardingApi.checklist).subscribe({
      next: (res) => this.items.set(res?.data ?? []),
      error: () => this.items.set([])
    });
  }
}
