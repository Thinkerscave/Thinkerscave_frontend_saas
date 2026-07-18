import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label class="app-search-bar">
      <i class="pi pi-search app-search-bar__icon" aria-hidden="true"></i>
      <input
        type="search"
        class="app-search-bar__input"
        [placeholder]="placeholder"
        [ngModel]="value"
        (ngModelChange)="onInput($event)"
        [attr.aria-label]="ariaLabel || placeholder" />
      <button
        *ngIf="value"
        type="button"
        class="app-search-bar__clear"
        aria-label="Clear search"
        (click)="clear()">
        <i class="pi pi-times" aria-hidden="true"></i>
      </button>
    </label>
  `,
  styleUrl: './app-search-bar.component.scss'
})
export class AppSearchBarComponent {
  @Input() placeholder = 'Search…';
  @Input() ariaLabel = '';
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();
  @Output() search = new EventEmitter<string>();

  onInput(next: string): void {
    this.valueChange.emit(next);
    this.search.emit(next);
  }

  clear(): void {
    this.onInput('');
  }
}
