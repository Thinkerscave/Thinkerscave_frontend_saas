import { Injectable, NgZone, computed, inject, signal } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';

const DISMISS_KEY = 'tc.pwa.installDismissedAt';
const DISMISS_DAYS = 14;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

@Injectable({ providedIn: 'root' })
export class PwaService {
  private readonly zone = inject(NgZone);
  private readonly swUpdate = inject(SwUpdate, { optional: true });

  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  private readonly installAvailableSignal = signal(false);
  private readonly installedSignal = signal(this.detectInstalled());
  private readonly updateReadySignal = signal(false);
  private readonly iosHintSignal = signal(this.isIos() && !this.detectInstalled());

  readonly canInstall = computed(() => this.installAvailableSignal() && !this.installedSignal());
  readonly isInstalled = computed(() => this.installedSignal());
  readonly updateReady = computed(() => this.updateReadySignal());
  readonly showIosInstallHint = computed(() => this.iosHintSignal() && !this.installedSignal());

  constructor() {
    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener('beforeinstallprompt', (event: Event) => {
      event.preventDefault();
      this.zone.run(() => {
        this.deferredPrompt = event as BeforeInstallPromptEvent;
        if (!this.isDismissedRecently()) {
          this.installAvailableSignal.set(true);
        }
      });
    });

    window.addEventListener('appinstalled', () => {
      this.zone.run(() => {
        this.deferredPrompt = null;
        this.installAvailableSignal.set(false);
        this.installedSignal.set(true);
        this.iosHintSignal.set(false);
      });
    });

    const media = window.matchMedia('(display-mode: standalone)');
    const syncInstalled = () => this.zone.run(() => this.installedSignal.set(this.detectInstalled()));
    media.addEventListener?.('change', syncInstalled);

    if (this.swUpdate?.isEnabled) {
      this.swUpdate.versionUpdates
        .pipe(filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'))
        .subscribe(() => this.zone.run(() => this.updateReadySignal.set(true)));

      // Periodic check while the app is open.
      void this.swUpdate.checkForUpdate().catch(() => undefined);
      setInterval(() => {
        void this.swUpdate?.checkForUpdate().catch(() => undefined);
      }, 60 * 60 * 1000);
    }
  }

  async promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
    if (!this.deferredPrompt) {
      return 'unavailable';
    }

    const promptEvent = this.deferredPrompt;
    this.deferredPrompt = null;
    this.installAvailableSignal.set(false);

    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === 'accepted') {
      this.installedSignal.set(true);
    }
    return choice.outcome;
  }

  dismissInstall(): void {
    this.installAvailableSignal.set(false);
    this.iosHintSignal.set(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // ignore quota / private mode
    }
  }

  async applyUpdate(): Promise<void> {
    if (!this.swUpdate?.isEnabled) {
      window.location.reload();
      return;
    }
    try {
      await this.swUpdate.activateUpdate();
    } finally {
      document.location.reload();
    }
  }

  dismissUpdate(): void {
    this.updateReadySignal.set(false);
  }

  private detectInstalled(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    const standaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
    const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    return standaloneMedia || iosStandalone;
  }

  private isIos(): boolean {
    if (typeof navigator === 'undefined') {
      return false;
    }
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
  }

  private isDismissedRecently(): boolean {
    try {
      const raw = localStorage.getItem(DISMISS_KEY);
      if (!raw) {
        return false;
      }
      const ts = Number(raw);
      if (!Number.isFinite(ts)) {
        return false;
      }
      return Date.now() - ts < DISMISS_DAYS * 24 * 60 * 60 * 1000;
    } catch {
      return false;
    }
  }
}
