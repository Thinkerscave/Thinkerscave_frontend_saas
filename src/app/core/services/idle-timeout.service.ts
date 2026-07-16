import { Injectable, NgZone, OnDestroy, inject } from '@angular/core';
import { LoginService } from './login.service';
import { LoggerService } from './logger.service';

/**
 * IdleTimeoutService - Automatically logs out the user after a period of inactivity.
 * Default idle timeout: 30 minutes.
 */
@Injectable({
    providedIn: 'root'
})
export class IdleTimeoutService implements OnDestroy {

    private readonly IDLE_TIMEOUT_MS = 30 * 60 * 1000;
    private timeoutHandle: ReturnType<typeof setTimeout> | null = null;
    private readonly events: string[] = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    private boundReset = this.resetTimer.bind(this);
    private running = false;
    private readonly logger = inject(LoggerService);

    constructor(
        private loginService: LoginService,
        private ngZone: NgZone
    ) { }

    start(): void {
        if (this.running) return;
        this.running = true;

        this.ngZone.runOutsideAngular(() => {
            this.events.forEach(event =>
                document.addEventListener(event, this.boundReset, { passive: true })
            );
            this.startTimer();
        });
    }

    stop(): void {
        this.running = false;
        this.clearTimer();
        this.events.forEach(event =>
            document.removeEventListener(event, this.boundReset)
        );
    }

    private startTimer(): void {
        this.clearTimer();
        this.timeoutHandle = setTimeout(() => {
            this.ngZone.run(() => {
                this.logger.warn(`User idle for ${this.IDLE_TIMEOUT_MS / 60000} minutes — logging out.`);
                this.stop();
                this.loginService.logOutAndRedirect();
            });
        }, this.IDLE_TIMEOUT_MS);
    }

    private clearTimer(): void {
        if (this.timeoutHandle) {
            clearTimeout(this.timeoutHandle);
            this.timeoutHandle = null;
        }
    }

    private resetTimer(): void {
        if (this.running) {
            this.startTimer();
        }
    }

    ngOnDestroy(): void {
        this.stop();
    }
}
