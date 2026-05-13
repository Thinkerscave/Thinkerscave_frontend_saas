import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { LoginService } from '../../services/login.service';

/**
 * IdleTimeoutService - Automatically logs out the user after a period of inactivity.
 *
 * Listens to user interaction events (mousemove, keydown, click, scroll, touchstart)
 * and resets a countdown timer. When the timer expires, the user is logged out.
 *
 * Default idle timeout: 30 minutes.
 */
@Injectable({
    providedIn: 'root'
})
export class IdleTimeoutService implements OnDestroy {

    private readonly IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
    private timeoutHandle: ReturnType<typeof setTimeout> | null = null;
    private readonly events: string[] = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    private boundReset = this.resetTimer.bind(this);
    private running = false;

    constructor(
        private loginService: LoginService,
        private ngZone: NgZone
    ) { }

    /**
     * Start monitoring user activity. Call this after login.
     */
    start(): void {
        if (this.running) return;
        this.running = true;

        // Run outside Angular zone to avoid triggering change detection on every mouse move
        this.ngZone.runOutsideAngular(() => {
            this.events.forEach(event =>
                document.addEventListener(event, this.boundReset, { passive: true })
            );
            this.startTimer();
        });
    }

    /**
     * Stop monitoring user activity. Call this on logout.
     */
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
            // Run inside Angular zone when navigating
            this.ngZone.run(() => {
                console.warn('[IDLE TIMEOUT] User idle for', this.IDLE_TIMEOUT_MS / 60000, 'minutes — logging out.');
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
