import { Component, ChangeDetectionStrategy, HostListener, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrganizationContextService } from '../../../core/services/organization-context.service';

@Component({
  selector: 'tc-marketing-navbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule],
  templateUrl: './marketing-navbar.component.html',
  styleUrl: './marketing-navbar.component.scss'
})
export class MarketingNavbarComponent {
  private readonly orgContext = inject(OrganizationContextService);

  readonly scrolled = signal(false);
  readonly mobileOpen = signal(false);

  readonly navLinks = [
    { label: 'Product', href: '#product' },
    { label: 'Solutions', href: '#solutions' },
    { label: 'Platform', href: '#platform' },
    { label: 'Resources', href: '#resources' },
    { label: 'Pricing', href: '#pricing' }
  ];

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 24);
  }

  loginRoute(): string[] {
    return this.orgContext.requiresSelection
      ? ['/auth/select-organization']
      : ['/auth/login'];
  }

  toggleMobile(): void {
    this.mobileOpen.update(v => !v);
  }

  closeMobile(): void {
    this.mobileOpen.set(false);
  }
}
