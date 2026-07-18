import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { AppButtonComponent } from '../app-form/app-button.component';

@Component({
  selector: 'app-list-empty-state',
  standalone: true,
  imports: [CommonModule, AppButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-list-empty-state" role="status">
      <span class="app-list-empty-state__icon" *ngIf="icon">
        <i [class]="icon" aria-hidden="true"></i>
      </span>
      <strong *ngIf="title">{{ title }}</strong>
      <p *ngIf="description">{{ description }}</p>
      <app-button
        *ngIf="actionLabel"
        variant="primary"
        [icon]="actionIcon"
        (clicked)="actionClick.emit()">
        {{ actionLabel }}
      </app-button>
      <ng-content></ng-content>
    </div>
  `,
  styleUrl: './app-empty-state.component.scss'
})
export class AppListEmptyStateComponent {
  @Input() icon = 'pi pi-inbox';
  @Input() title = '';
  @Input() description = '';
  @Input() actionLabel = '';
  @Input() actionIcon = 'pi pi-plus';
  @Output() actionClick = new EventEmitter<void>();
}
