import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'tc-filter-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-bar.component.html',
  styleUrls: ['./filter-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FilterBarComponent {
  @Input() search = '';
  @Input() placeholder = 'Search records';
  @Input() showReset = true;
  @Input() resultCount: number | null = null;

  @Output() searchChange = new EventEmitter<string>();
  @Output() reset = new EventEmitter<void>();

  updateSearch(value: string): void {
    this.search = value;
    this.searchChange.emit(value);
  }
}