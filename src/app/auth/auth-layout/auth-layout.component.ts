import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { Router, RouterLink, RouterOutlet, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { AuthIllustrationComponent } from '../components/auth-illustration/auth-illustration.component';
import { AuthTrustStripComponent } from '../components/auth-trust-strip/auth-trust-strip.component';

@Component({
  selector: 'app-auth-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ToastModule, RouterOutlet, RouterLink, AuthIllustrationComponent, AuthTrustStripComponent],
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.scss',
  providers: [MessageService]
})
export class AuthLayoutComponent {
  private readonly router = inject(Router);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  readonly isOrgSelect = computed(() => this.currentUrl().includes('select-organization'));
  readonly isLogin = computed(() => this.currentUrl().includes('/auth/login'));
}
