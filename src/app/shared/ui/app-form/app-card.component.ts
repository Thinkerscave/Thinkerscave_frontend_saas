import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="app-card" [class.app-card--flat]="!elevated">
      <header *ngIf="title || subtitle" class="app-card__header">
        <div>
          <h1 *ngIf="title" class="app-card__title">{{ title }}</h1>
          <p *ngIf="subtitle" class="app-card__subtitle">{{ subtitle }}</p>
        </div>
        <div class="app-card__header-actions">
          <ng-content select="[card-actions]"></ng-content>
        </div>
      </header>
      <div class="app-card__body">
        <ng-content></ng-content>
      </div>
      <footer *ngIf="hasFooter" class="app-card__footer">
        <ng-content select="[card-footer]"></ng-content>
      </footer>
    </section>
  `,
  styleUrl: './app-card.component.scss'
})
export class AppCardComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() elevated = true;
  @Input() hasFooter = false;
}
