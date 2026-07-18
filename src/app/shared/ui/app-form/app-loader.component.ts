import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-loader" role="status" [attr.aria-label]="label">
      <span class="app-loader__spinner" aria-hidden="true"></span>
      <span *ngIf="label" class="app-loader__label">{{ label }}</span>
    </div>
  `,
  styleUrl: './app-loader.component.scss'
})
export class AppLoaderComponent {
  @Input() label = 'Loading…';
}
