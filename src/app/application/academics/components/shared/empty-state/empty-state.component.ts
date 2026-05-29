import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-academic-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="acad-empty-state">
      <span><i [ngClass]="icon"></i></span>
      <strong>{{ title }}</strong>
      <p>{{ description }}</p>
      <button *ngIf="actionLabel" type="button" class="acad-ghost-button" (click)="action.emit()">{{ actionLabel }}</button>
    </div>
  `
})
export class AcademicEmptyStateComponent {
  @Input() icon = 'pi pi-info-circle';
  @Input() title = 'Nothing to show yet';
  @Input() description = 'Start by creating the first record for this workspace.';
  @Input() actionLabel = '';
  @Output() action = new EventEmitter<void>();
}
