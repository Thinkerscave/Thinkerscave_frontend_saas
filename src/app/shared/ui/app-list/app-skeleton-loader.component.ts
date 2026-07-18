import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type AppSkeletonVariant = 'stat' | 'row' | 'card' | 'toolbar';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-skeleton" [attr.data-variant]="variant">
      <ng-container [ngSwitch]="variant">
        <div *ngSwitchCase="'stat'" class="app-skeleton__stat">
          <span class="app-skeleton__block app-skeleton__icon"></span>
          <span class="app-skeleton__block app-skeleton__line app-skeleton__line--lg"></span>
          <span class="app-skeleton__block app-skeleton__line app-skeleton__line--sm"></span>
        </div>

        <div *ngSwitchCase="'toolbar'" class="app-skeleton__toolbar">
          <span class="app-skeleton__block app-skeleton__search"></span>
          <span class="app-skeleton__block app-skeleton__chip"></span>
          <span class="app-skeleton__block app-skeleton__chip"></span>
          <span class="app-skeleton__block app-skeleton__chip"></span>
        </div>

        <div *ngSwitchCase="'row'" class="app-skeleton__row">
          <span class="app-skeleton__block app-skeleton__avatar"></span>
          <span class="app-skeleton__col">
            <span class="app-skeleton__block app-skeleton__line app-skeleton__line--md"></span>
            <span class="app-skeleton__block app-skeleton__line app-skeleton__line--sm"></span>
          </span>
          <span class="app-skeleton__block app-skeleton__line app-skeleton__line--sm"></span>
          <span class="app-skeleton__block app-skeleton__line app-skeleton__line--sm"></span>
          <span class="app-skeleton__block app-skeleton__pill"></span>
        </div>

        <div *ngSwitchDefault class="app-skeleton__card">
          <div class="app-skeleton__card-head">
            <span class="app-skeleton__block app-skeleton__avatar app-skeleton__avatar--lg"></span>
            <span class="app-skeleton__col">
              <span class="app-skeleton__block app-skeleton__line app-skeleton__line--md"></span>
              <span class="app-skeleton__block app-skeleton__line app-skeleton__line--sm"></span>
            </span>
          </div>
          <span class="app-skeleton__block app-skeleton__line app-skeleton__line--sm"></span>
          <span class="app-skeleton__block app-skeleton__line app-skeleton__line--xs"></span>
        </div>
      </ng-container>
    </div>
  `,
  styleUrl: './app-skeleton-loader.component.scss'
})
export class AppSkeletonLoaderComponent {
  @Input() variant: AppSkeletonVariant = 'row';
}

@Component({
  selector: 'app-skeleton-group',
  standalone: true,
  imports: [CommonModule, AppSkeletonLoaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-skeleton-group" [class.app-skeleton-group--grid]="layout === 'grid'">
      <app-skeleton-loader *ngFor="let _ of items" [variant]="variant"></app-skeleton-loader>
    </div>
  `,
  styleUrl: './app-skeleton-loader.component.scss'
})
export class AppSkeletonGroupComponent {
  @Input() variant: AppSkeletonVariant = 'row';
  @Input() count = 3;
  @Input() layout: 'stack' | 'grid' = 'stack';

  get items(): number[] {
    return Array.from({ length: this.count }, (_, i) => i);
  }
}
