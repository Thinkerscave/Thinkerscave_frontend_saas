import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { UiDensity } from '../ui-models';

@Component({
  selector: 'tc-page-shell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './page-shell.component.html',
  styleUrls: ['./page-shell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageShellComponent {
  @Input() density: UiDensity = 'comfortable';
  @Input() maxWidth: 'full' | 'wide' | 'content' = 'full';
  @Input() surface: 'transparent' | 'subtle' = 'transparent';
}