import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'tc-detail-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detail-panel.component.html',
  styleUrls: ['./detail-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DetailPanelComponent {
  @Input() title = 'Details';
  @Input() subtitle: string | null = null;
  @Input() empty = false;
  @Input() emptyMessage = 'Select a record to view details.';
  @Output() close = new EventEmitter<void>();
}