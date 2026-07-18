import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-form-section',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="app-form-section">
      <header *ngIf="title || description" class="app-form-section__header">
        <h2 *ngIf="title" class="app-form-section__title">{{ title }}</h2>
        <p *ngIf="description" class="app-form-section__description">{{ description }}</p>
      </header>
      <div class="app-form-section__grid" [class.app-form-section__grid--single]="columns === 1">
        <ng-content></ng-content>
      </div>
    </section>
  `,
  styleUrl: './app-form-section.component.scss'
})
export class AppFormSectionComponent {
  @Input() title = '';
  @Input() description = '';
  @Input() columns: 1 | 2 = 2;
}
