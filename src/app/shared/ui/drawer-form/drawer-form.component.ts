import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Component({
  selector: 'tc-drawer-form',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './drawer-form.component.html',
  styleUrls: ['./drawer-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DrawerFormComponent {
  @Input() open = false;
  @Input() title = 'Form';
  @Input() description: string | null = null;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  @Output() closed = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open) {
      this.closed.emit();
    }
  }
}