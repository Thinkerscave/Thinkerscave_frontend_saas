import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  SaasPageHeaderComponent,
  SaasPanelComponent,
  SaasTab,
  SaasTabsComponent
} from '../../shared/ui/saas';
import { ThemeService } from '../../shared/theme/theme.service';
import { LoginService } from '../../core/services/login.service';

type TabKey = 'appearance' | 'notifications' | 'localization' | 'accessibility' | 'security';

@Component({
  selector: 'tc-global-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    SaasPageHeaderComponent,
    SaasPanelComponent,
    SaasTabsComponent
  ],
  templateUrl: './global-settings.component.html',
  styleUrl: './global-settings.component.scss'
})
export class GlobalSettingsComponent {
  private readonly themeService = inject(ThemeService);
  private readonly loginService = inject(LoginService);
  private readonly router = inject(Router);

  readonly tabs: SaasTab[] = [
    { key: 'appearance',    label: 'Appearance',    icon: 'pi pi-palette' },
    { key: 'notifications', label: 'Notifications', icon: 'pi pi-bell' },
    { key: 'localization',  label: 'Localization',  icon: 'pi pi-globe' },
    { key: 'accessibility', label: 'Accessibility', icon: 'pi pi-eye' },
    { key: 'security',      label: 'Security',      icon: 'pi pi-lock' }
  ];
  readonly active = signal<TabKey>('appearance');

  /* Appearance */
  readonly isDark = this.themeService.isDarkTheme;
  readonly density = signal<'comfortable' | 'compact'>(this.read('tc.density', 'comfortable') as any);
  readonly accent = signal<string>(this.read('tc.accent', '#1F3A93'));

  /* Notifications */
  readonly notifEmail = signal<boolean>(this.readBool('tc.notifEmail', true));
  readonly notifPush  = signal<boolean>(this.readBool('tc.notifPush',  true));
  readonly notifSms   = signal<boolean>(this.readBool('tc.notifSms',   false));
  readonly notifDigest= signal<'daily' | 'weekly' | 'off'>(this.read('tc.notifDigest', 'daily') as any);

  /* Localization */
  readonly language = signal<string>(this.read('tc.language', 'en-IN'));
  readonly timezone = signal<string>(this.read('tc.timezone', 'Asia/Kolkata'));
  readonly dateFormat = signal<string>(this.read('tc.dateFormat', 'dd-MM-yyyy'));

  /* Accessibility */
  readonly reduceMotion = signal<boolean>(this.readBool('tc.reduceMotion', false));
  readonly largeText = signal<boolean>(this.readBool('tc.largeText', false));
  readonly highContrast = signal<boolean>(this.readBool('tc.highContrast', false));

  readonly userName = computed(() => {
    const u: any = this.loginService.getUser();
    return [u?.firstName, u?.lastName].filter(Boolean).join(' ') || u?.userName || 'You';
  });

  selectTab(key: string): void { this.active.set(key as TabKey); }

  toggleTheme(): void { this.themeService.toggleTheme(); }

  save(): void {
    this.write('tc.density', this.density());
    this.write('tc.accent', this.accent());
    this.writeBool('tc.notifEmail', this.notifEmail());
    this.writeBool('tc.notifPush', this.notifPush());
    this.writeBool('tc.notifSms', this.notifSms());
    this.write('tc.notifDigest', this.notifDigest());
    this.write('tc.language', this.language());
    this.write('tc.timezone', this.timezone());
    this.write('tc.dateFormat', this.dateFormat());
    this.writeBool('tc.reduceMotion', this.reduceMotion());
    this.writeBool('tc.largeText', this.largeText());
    this.writeBool('tc.highContrast', this.highContrast());
    this.applyAccent();
    this.applyA11y();
  }

  reset(): void {
    this.density.set('comfortable');
    this.accent.set('#1F3A93');
    this.notifEmail.set(true);
    this.notifPush.set(true);
    this.notifSms.set(false);
    this.notifDigest.set('daily');
    this.language.set('en-IN');
    this.timezone.set('Asia/Kolkata');
    this.dateFormat.set('dd-MM-yyyy');
    this.reduceMotion.set(false);
    this.largeText.set(false);
    this.highContrast.set(false);
  }

  goProfile(): void { this.router.navigate(['/app/profile']); }

  private applyAccent(): void {
    document.documentElement.style.setProperty('--saas-primary', this.accent());
  }
  private applyA11y(): void {
    const html = document.documentElement;
    html.classList.toggle('tc-reduce-motion', this.reduceMotion());
    html.classList.toggle('tc-large-text', this.largeText());
    html.classList.toggle('tc-high-contrast', this.highContrast());
  }

  private read(key: string, fallback: string): string {
    try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
  }
  private readBool(key: string, fallback: boolean): boolean {
    try { const v = localStorage.getItem(key); return v === null ? fallback : v === 'true'; } catch { return fallback; }
  }
  private write(key: string, value: string): void { try { localStorage.setItem(key, value); } catch { /* ignore */ } }
  private writeBool(key: string, value: boolean): void { try { localStorage.setItem(key, value ? 'true' : 'false'); } catch { /* ignore */ } }
}
