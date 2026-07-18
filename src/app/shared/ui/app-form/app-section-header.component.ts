import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-section-header',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="app-section-header">
      <div class="app-section-header__icon" aria-hidden="true">
        <i [class]="icon"></i>
      </div>
      <div class="app-section-header__text">
        <h2 class="app-section-header__title">{{ title }}</h2>
        <p *ngIf="description" class="app-section-header__description">{{ description }}</p>
      </div>
    </header>
  `,
  styleUrl: './app-section-header.component.scss'
})
export class AppSectionHeaderComponent {
  @Input({ required: true }) title = '';
  @Input() description = '';
  @Input() icon = 'pi pi-id-card';
}
