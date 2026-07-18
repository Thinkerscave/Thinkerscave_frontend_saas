import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type AppStatCardTone = 'primary' | 'success' | 'info' | 'warning' | 'danger' | 'neutral';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="app-stat-card" [attr.data-tone]="tone">
      <div class="app-stat-card__icon" aria-hidden="true">
        <i [class]="icon"></i>
      </div>
      <div class="app-stat-card__body">
        <span class="app-stat-card__value">{{ value }}</span>
        <span class="app-stat-card__label">{{ label }}</span>
        <span *ngIf="description" class="app-stat-card__description">{{ description }}</span>
      </div>
    </article>
  `,
  styleUrl: './app-stat-card.component.scss'
})
export class AppStatCardComponent {
  @Input({ required: true }) icon!: string;
  @Input({ required: true }) value!: string | number;
  @Input({ required: true }) label!: string;
  @Input() description = '';
  @Input() tone: AppStatCardTone = 'primary';
}
