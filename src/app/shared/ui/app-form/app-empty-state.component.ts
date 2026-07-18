import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-empty-state" role="status">
      <span class="app-empty-state__icon" *ngIf="icon">
        <i [class]="icon" aria-hidden="true"></i>
      </span>
      <strong *ngIf="title">{{ title }}</strong>
      <p *ngIf="message">{{ message }}</p>
      <div class="app-empty-state__actions">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styleUrl: './app-empty-state.component.scss'
})
export class AppEmptyStateComponent {
  @Input() icon = 'pi pi-inbox';
  @Input() title = '';
  @Input() message = '';
}
