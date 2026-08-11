import { Component, DestroyRef, inject, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { NgxUiLoaderModule } from 'ngx-ui-loader';
import { ToastModule } from 'primeng/toast';
import { ThemeService } from './shared/theme/theme.service';
import { UserPreferencesService } from './application/services/user-preferences.service';
import { LoginService } from './core/services/login.service';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, NgxUiLoaderModule, ToastModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private readonly themeService = inject(ThemeService);
  private readonly preferences = inject(UserPreferencesService);
  private readonly loginService = inject(LoginService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  title = 'thinkerscave_saas_frontend';

  constructor() {
    this.syncAuthSurface(this.router.url);
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((e) => this.syncAuthSurface(e.urlAfterRedirects));
  }

  private syncAuthSurface(url: string): void {
    const isAuth = url.startsWith('/auth') || url === '/' || url.startsWith('/marketing');
    this.themeService.setAuthSurface(isAuth);
    if (!isAuth && this.loginService.getUser()) {
      this.themeService.reloadForCurrentUser();
      this.preferences.applyStoredPreferences();
    }
  }
}
