import { ApplicationRef, Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { LoginService } from './login.service';

type Dictionary = Record<string, string>;

/** English label → i18n key for shell menus (API labels stay English; UI maps known ones). */
const MENU_LABEL_KEYS: Record<string, string> = {
  Dashboard: 'menu.dashboard',
  Customers: 'menu.customers',
  Organizations: 'menu.organizations',
  Subscriptions: 'menu.subscriptions',
  'Subscription Plans': 'menu.subscriptionPlans',
  Promotions: 'menu.promotions',
  'Platform Catalog': 'menu.platformCatalog',
  'Menu Management': 'menu.menuManagement',
  'Role Management': 'menu.roleManagement',
  'Feature Catalog': 'menu.featureCatalog',
  'Tenant Health': 'menu.tenantHealth',
  'Migration Center': 'menu.migrationCenter',
  'Audit Center': 'menu.auditCenter',
  Students: 'menu.students',
  Staff: 'menu.staff',
  Attendance: 'menu.attendance',
  Admissions: 'menu.admissions',
  Academics: 'menu.academics',
  Finance: 'menu.finance',
  Exams: 'menu.exams',
  Communication: 'menu.communication',
  'Tenant Management': 'menu.tenantManagement',
  Administration: 'menu.administration',
  More: 'menu.more',
  'Access Management': 'menu.accessManagement',
  Roles: 'menu.roles',
  'Menu Catalog': 'menu.featureCatalog',
  Users: 'menu.users',
  Responsibilities: 'menu.responsibilities',
  'Security Policy': 'menu.securityPolicy',
  'Login History': 'menu.loginHistory',
  Directory: 'menu.directory',
  Calendar: 'menu.calendar',
  Reports: 'menu.reports',
  Settings: 'nav.settings',
  Payroll: 'menu.payroll',
  Leave: 'menu.leave',
  Documents: 'menu.documents',
  Alumni: 'menu.alumni',
  Overview: 'menu.overview',
  Leads: 'menu.leads',
  'Follow-ups': 'menu.followUps',
  Applications: 'menu.applications',
  Enrollment: 'menu.enrollment',
  Announcements: 'menu.announcements',
  Templates: 'menu.templates'
};

/** Fallback English catalog used until JSON assets load (and if fetch fails). */
const EN_FALLBACK: Dictionary = {
  'brand.name': 'ThinkersCave',
  'nav.search': 'Search',
  'nav.noMenus': 'No menus available',
  'nav.dashboard': 'Dashboard',
  'nav.students': 'Students',
  'nav.staff': 'Staff',
  'nav.settings': 'Settings',
  'common.refresh': 'Refresh',
  'common.tryAgain': 'Try again',
  'common.save': 'Save',
  'common.reset': 'Reset',
  'common.cancel': 'Cancel',
  'common.close': 'Close',
  'common.loading': 'Loading…',
  'dashboard.title': 'Dashboard',
  'dashboard.loadError': "We couldn't load your dashboard",
  'dashboard.loadErrorHint': 'Please check your connection and try again.',
  'settings.title': 'Settings',
  'settings.appearance': 'Appearance',
  'settings.notifications': 'Notifications',
  'settings.localization': 'Language & region',
  'settings.language': 'Language',
  'settings.accent': 'Accent color',
  'settings.saved': 'Preferences saved',
  'settings.subtitle': 'Personal preferences for {{name}}',
  'settings.drawerHint': 'Personal preferences for this account on this browser',
  'settings.theme': 'Theme',
  'settings.themeLight': 'Light',
  'settings.themeDark': 'Dark',
  'settings.timezone': 'Timezone',
  'settings.dateFormat': 'Date format',
  'settings.reduceMotion': 'Reduce motion',
  'settings.reduceMotionHint': 'Minimize animations across the app',
  'settings.defaultView': 'Default view',
  'settings.defaultViewHint': 'List pages open in this layout. You can still switch on any page without changing this setting.',
  'settings.defaultViewGrid': 'Grid',
  'settings.defaultViewTable': 'Table',
  'common.back': 'Back',
  'settings.changePassword': 'Change password',
  'settings.changePasswordHint': 'Opens your profile security section',
  'menu.dashboard': 'Dashboard',
  'menu.customers': 'Customers',
  'menu.organizations': 'Organizations',
  'menu.subscriptions': 'Subscriptions',
  'menu.subscriptionPlans': 'Subscription Plans',
  'menu.promotions': 'Promotions',
  'menu.platformCatalog': 'Platform Catalog',
  'menu.menuManagement': 'Menu Management',
  'menu.roleManagement': 'Role Management',
  'menu.featureCatalog': 'Feature Catalog',
  'menu.tenantHealth': 'Tenant Health',
  'menu.migrationCenter': 'Migration Center',
  'menu.auditCenter': 'Audit Center',
  'menu.tenantManagement': 'Tenant Management',
  'menu.students': 'Students',
  'menu.staff': 'Staff',
  'menu.attendance': 'Attendance',
  'menu.admissions': 'Admissions',
  'menu.academics': 'Academics',
  'menu.finance': 'Finance',
  'menu.exams': 'Exams',
  'menu.communication': 'Communication',
  'menu.more': 'More',
  'students.directory': 'Student Directory',
  'students.add': 'Add Student',
  'students.empty': 'No students found',
  'students.searchPlaceholder': 'Search students…',
  'login.signIn': 'Sign in',
  'login.password': 'Password',
  'login.email': 'Email or username',
  'orgSelect.title': 'Select organization',
  'orgSelect.continue': 'Continue',
  'attendance.present': 'Present',
  'attendance.absent': 'Absent',
  'attendance.leave': 'Leave',
  'attendance.late': 'Late',
  'fees.overdue': 'Overdue'
};

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly appRef = inject(ApplicationRef);
  private readonly http = inject(HttpClient);
  private readonly loginService = inject(LoginService);

  readonly language = signal(this.readStored());
  /** Bumps when a locale dictionary finishes loading so UI recomputes translations. */
  readonly catalogVersion = signal(0);
  private catalogs: Record<string, Dictionary> = {
    'en-IN': { ...EN_FALLBACK },
    'en-US': { ...EN_FALLBACK },
    en: { ...EN_FALLBACK }
  };
  private loaded = new Set<string>();

  constructor() {
    this.apply(this.language());
    this.ensureCatalog(this.language());
  }

  t(key: string, fallback?: string): string {
    this.catalogVersion();
    const lang = this.normalize(this.language());
    const dict = this.catalogs[lang] ?? this.catalogs['en-IN'] ?? EN_FALLBACK;
    return dict[key] ?? EN_FALLBACK[key] ?? fallback ?? key;
  }

  /** Translate known shell menu English labels; unknown/API labels stay as-is. */
  menuLabel(english: string | undefined | null): string {
    const label = (english || '').trim();
    if (!label) {
      return '';
    }
    const key = MENU_LABEL_KEYS[label];
    return key ? this.t(key, label) : label;
  }

  setLanguage(code: string): void {
    const normalized = this.normalize(code);
    this.language.set(normalized);
    this.apply(normalized);
    this.ensureCatalog(normalized);
    try {
      localStorage.setItem(this.storageKey(), normalized);
      localStorage.setItem('tc.language', normalized);
    } catch {
      /* ignore */
    }
    queueMicrotask(() => this.appRef.tick());
  }

  applyStoredLanguage(): void {
    const stored = this.readStored();
    this.apply(stored);
    this.ensureCatalog(stored);
  }

  private storageKey(): string {
    const u: any = this.loginService.getUser();
    const scope = String(u?.userCode || u?.userName || u?.id || '').trim().toLowerCase();
    return scope ? `tc.u.${scope}.language` : 'tc.language';
  }

  private ensureCatalog(code: string): void {
    const normalized = this.normalize(code);
    const assetKey = this.assetKey(normalized);
    if (this.loaded.has(assetKey)) {
      return;
    }
    this.loaded.add(assetKey);
    this.http
      .get<Dictionary>(`/assets/i18n/${assetKey}.json`)
      .pipe(catchError(() => of(null)))
      .subscribe(dict => {
        if (!dict) {
          return;
        }
        if (assetKey === 'en') {
          this.catalogs['en-IN'] = dict;
          this.catalogs['en-US'] = dict;
          this.catalogs['en'] = dict;
        } else if (assetKey === 'or') {
          this.catalogs['or-IN'] = dict;
          this.catalogs['or'] = dict;
        } else if (assetKey === 'hi') {
          this.catalogs['hi-IN'] = dict;
          this.catalogs['hi'] = dict;
        }
        this.catalogVersion.update((v) => v + 1);
        queueMicrotask(() => this.appRef.tick());
      });
  }

  private assetKey(code: string): 'en' | 'or' | 'hi' {
    const short = code.split('-')[0].toLowerCase();
    if (short === 'or') return 'or';
    if (short === 'hi') return 'hi';
    return 'en';
  }

  private apply(code: string): void {
    const normalized = this.normalize(code);
    this.language.set(normalized);
    document.documentElement.lang = normalized.split('-')[0] || 'en';
  }

  private readStored(): string {
    try {
      const scoped = localStorage.getItem(this.storageKey());
      if (scoped) {
        return this.normalize(scoped);
      }
      return this.normalize(localStorage.getItem('tc.language') ?? 'en-IN');
    } catch {
      return 'en-IN';
    }
  }

  private normalize(code: string): string {
    const raw = (code || 'en-IN').trim();
    const short = raw.split('-')[0].toLowerCase();
    if (short === 'or') return 'or-IN';
    if (short === 'hi') return 'hi-IN';
    if (short === 'en') return raw.toLowerCase() === 'en-us' ? 'en-US' : 'en-IN';
    return 'en-IN';
  }
}
