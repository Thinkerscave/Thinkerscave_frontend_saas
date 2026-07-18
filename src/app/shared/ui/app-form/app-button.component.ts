import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

export type AppButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type AppButtonSize = 'md' | 'sm';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      [type]="type"
      class="app-btn"
      [class.app-btn--primary]="variant === 'primary'"
      [class.app-btn--secondary]="variant === 'secondary'"
      [class.app-btn--ghost]="variant === 'ghost'"
      [class.app-btn--danger]="variant === 'danger'"
      [class.app-btn--sm]="size === 'sm'"
      [disabled]="disabled || loading"
      (click)="clicked.emit($event)">
      <i *ngIf="loading" class="pi pi-spin pi-spinner" aria-hidden="true"></i>
      <i *ngIf="!loading && icon" [class]="icon" aria-hidden="true"></i>
      <span><ng-content></ng-content></span>
    </button>
  `,
  styleUrl: './app-button.component.scss'
})
export class AppButtonComponent {
  @Input() type: 'button' | 'submit' = 'button';
  @Input() variant: AppButtonVariant = 'secondary';
  @Input() size: AppButtonSize = 'md';
  @Input() icon = '';
  @Input() disabled = false;
  @Input() loading = false;
  @Output() clicked = new EventEmitter<MouseEvent>();
}
