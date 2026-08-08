import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DropdownModule } from 'primeng/dropdown';
import {
  SaasPanelComponent,
  SaasTab,
  SaasTabsComponent
} from '../../shared/ui/saas';
import { ThemeService } from '../../shared/theme/theme.service';
import { LoginService } from '../../core/services/login.service';
import { LanguageService } from '../../core/services/language.service';
import { UserPreferencesService } from '../services/user-preferences.service';
import { SettingsUiService } from '../../core/services/settings-ui.service';
import { TcTranslatePipe } from '../../shared/pipes/tc-translate.pipe';
import { PwaService } from '../../core/services/pwa.service';

type TabKey = 'appearance' | 'notifications' | 'localization';

interface SelectOption {
  label: string;
  value: string;
}

@Component({
  selector: 'tc-global-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    DropdownModule,
    SaasPanelComponent,
    SaasTabsComponent,
    TcTranslatePipe
  ],
  templateUrl: './global-settings.component.html',
  styleUrl: './global-settings.component.scss'
})
export class GlobalSettingsComponent {
  private readonly themeService = inject(ThemeService);
  private readonly preferencesService = inject(UserPreferencesService);
  private readonly languageService = inject(LanguageService);
  private readonly loginService = inject(LoginService);
  private readonly settingsUi = inject(SettingsUiService);
  private readonly router = inject(Router);
  readonly pwa = inject(PwaService);

  readonly tabs = computed<SaasTab[]>(() => {
    this.languageService.language();
    this.languageService.catalogVersion();
    return [
      { key: 'appearance', label: this.languageService.t('settings.appearance'), icon: 'pi pi-palette' },
      { key: 'notifications', label: this.languageService.t('settings.notifications'), icon: 'pi pi-bell' },
      { key: 'localization', label: this.languageService.t('settings.localization'), icon: 'pi pi-globe' }
    ];
  });
  readonly active = signal<TabKey>('appearance');
  readonly savedFlash = signal(false);

  readonly isDark = this.themeService.isDarkTheme;
  readonly accent = signal<string>(this.preferencesService.get('accent', '#1F3A93'));
  readonly accentPresets = [
    '#1F3A93', '#2556EB', '#0EA5E9', '#16A34A',
    '#CA8A04', '#DC2626', '#7C3AED', '#0F766E'
  ] as const;
  readonly customAccent = signal(
    !(this.accentPresets as readonly string[]).some(c => c.toLowerCase() === this.accent().toLowerCase())
  );
  readonly reduceMotion = signal(this.preferencesService.getBool('reduceMotion', false));

  readonly notifEmail = signal(this.preferencesService.getBool('notifEmail', true));
  readonly notifPush = signal(this.preferencesService.getBool('notifPush', true));
  readonly notifSms = signal(this.preferencesService.getBool('notifSms', false));
  readonly notifDigest = signal<'daily' | 'weekly' | 'off'>(
    this.preferencesService.get('notifDigest', 'daily') as 'daily' | 'weekly' | 'off'
  );

  readonly language = signal(this.preferencesService.get('language', this.languageService.language()));
  readonly timezone = signal(this.preferencesService.get('timezone', 'Asia/Kolkata'));
  readonly dateFormat = signal(this.preferencesService.get('dateFormat', 'dd-MM-yyyy'));

  readonly languageOptions: SelectOption[] = [
    { label: 'English (India)', value: 'en-IN' },
    { label: 'ଓଡ଼ିଆ (Odia)', value: 'or-IN' },
    { label: 'हिन्दी', value: 'hi-IN' },
    { label: 'English (US)', value: 'en-US' }
  ];

  readonly digestOptions = computed<SelectOption[]>(() => {
    this.languageService.language();
    this.languageService.catalogVersion();
    return [
      { label: this.languageService.t('settings.digestDaily'), value: 'daily' },
      { label: this.languageService.t('settings.digestWeekly'), value: 'weekly' },
      { label: this.languageService.t('settings.digestOff'), value: 'off' }
    ];
  });

  readonly timezoneOptions: SelectOption[] = [
    { label: 'Asia/Kolkata (IST)', value: 'Asia/Kolkata' },
    { label: 'UTC', value: 'UTC' },
    { label: 'America/New York', value: 'America/New_York' },
    { label: 'Europe/London', value: 'Europe/London' }
  ];

  readonly dateFormatOptions: SelectOption[] = [
    { label: 'dd-MM-yyyy', value: 'dd-MM-yyyy' },
    { label: 'MM/dd/yyyy', value: 'MM/dd/yyyy' },
    { label: 'yyyy-MM-dd', value: 'yyyy-MM-dd' }
  ];

  readonly userName = computed(() => {
    const u: any = this.loginService.getUser();
    return [u?.firstName, u?.lastName].filter(Boolean).join(' ') || u?.userName || 'You';
  });

  readonly subtitle = computed(() => {
    this.languageService.language();
    return this.languageService.t('settings.subtitle').replace('{{name}}', this.userName());
  });

  private readonly livePreview = effect(() => {
    this.preferencesService.applyAccent(this.accent());
    this.preferencesService.applyReduceMotion(this.reduceMotion());
  });

  selectTab(key: string): void {
    this.active.set(key as TabKey);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  selectAccent(color: string): void {
    this.customAccent.set(false);
    this.accent.set(color);
  }

  enableCustomAccent(): void {
    this.customAccent.set(true);
  }

  isPresetAccent(color: string): boolean {
    return !this.customAccent() && this.accent().toLowerCase() === color.toLowerCase();
  }

  selectLanguage(code: string): void {
    this.language.set(code);
    this.languageService.setLanguage(code);
    this.preferencesService.set('language', code);
  }

  save(): void {
    this.preferencesService.set('accent', this.accent());
    this.preferencesService.setBool('reduceMotion', this.reduceMotion());
    this.preferencesService.setBool('notifEmail', this.notifEmail());
    this.preferencesService.setBool('notifPush', this.notifPush());
    this.preferencesService.setBool('notifSms', this.notifSms());
    this.preferencesService.set('notifDigest', this.notifDigest());
    this.preferencesService.set('language', this.language());
    this.languageService.setLanguage(this.language());
    this.preferencesService.set('timezone', this.timezone());
    this.preferencesService.set('dateFormat', this.dateFormat());
    this.preferencesService.applyStoredPreferences();
    this.savedFlash.set(true);
    setTimeout(() => this.savedFlash.set(false), 1800);
  }

  reset(): void {
    this.accent.set('#1F3A93');
    this.customAccent.set(false);
    this.reduceMotion.set(false);
    this.notifEmail.set(true);
    this.notifPush.set(true);
    this.notifSms.set(false);
    this.notifDigest.set('daily');
    this.language.set('en-IN');
    this.languageService.setLanguage('en-IN');
    this.timezone.set('Asia/Kolkata');
    this.dateFormat.set('dd-MM-yyyy');
    this.themeService.setTheme('light');
    this.save();
  }

  close(): void {
    this.settingsUi.close();
  }

  goChangePassword(): void {
    this.settingsUi.close();
    this.router.navigate(['/app/profile']);
  }

  installApp(): void {
    void this.pwa.promptInstall();
  }
}
