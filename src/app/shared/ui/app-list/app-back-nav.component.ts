import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BackNavigationService } from '../../../core/services/back-navigation.service';

@Component({
  selector: 'app-back-nav',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" class="tc-btn tc-btn--back" (click)="goBack()">
      <i class="pi pi-arrow-left" aria-hidden="true"></i>
      {{ label }}
    </button>
  `
})
export class AppBackNavComponent {
  private readonly nav = inject(BackNavigationService);
  private readonly route = inject(ActivatedRoute);

  @Input() label = 'Back';
  @Input({ required: true }) fallback!: string | string[];
  @Input() fromMap: Record<string, string> | null = null;

  goBack(): void {
    this.nav.back({
      fallback: this.fallback,
      route: this.route,
      fromMap: this.fromMap ?? undefined
    });
  }
}
