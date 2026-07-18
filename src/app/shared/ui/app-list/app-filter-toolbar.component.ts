import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-filter-toolbar',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-filter-toolbar">
      <div class="app-filter-toolbar__filters">
        <ng-content></ng-content>
      </div>
      <div class="app-filter-toolbar__end">
        <ng-content select="[toolbarEnd]"></ng-content>
      </div>
    </div>
  `,
  styleUrl: './app-filter-toolbar.component.scss'
})
export class AppFilterToolbarComponent {}
