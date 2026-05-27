import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export type StatusTone = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

/**
 * Pill-shaped status indicator used in tables, lists and detail headers.
 *
 * Either supply explicit `tone` or pass a `status` string and let the
 * component map common values (ACTIVE, INACTIVE, PENDING, APPROVED, etc.)
 * to a semantic palette.
 */
@Component({
    selector: 'app-status-badge',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './status-badge.component.html',
    styleUrl: './status-badge.component.scss'
})
export class StatusBadgeComponent {
    @Input() status: string | null = '';
    @Input() label: string | null = null;
    @Input() tone: StatusTone | null = null;
    @Input() dotOnly = false;

    private static readonly TONE_MAP: Record<string, StatusTone> = {
        ACTIVE: 'success', APPROVED: 'success', PUBLISHED: 'success', PAID: 'success',
        COMPLETED: 'success', SUCCESS: 'success', ENABLED: 'success', DELIVERED: 'success',
        PENDING: 'warning', DRAFT: 'warning', SCHEDULED: 'warning', PARTIALLY_PAID: 'warning',
        UNDER_REVIEW: 'warning', IN_PROGRESS: 'warning', ON_HOLD: 'warning',
        REJECTED: 'danger', FAILED: 'danger', CANCELLED: 'danger', OVERDUE: 'danger',
        EXPELLED: 'danger', BLOCKED: 'danger', ERROR: 'danger',
        INACTIVE: 'neutral', ARCHIVED: 'neutral', CLOSED: 'neutral', DISABLED: 'neutral',
        READ: 'info', SENT: 'info', ISSUED: 'info', NOTIFIED: 'info'
    };

    get resolvedTone(): StatusTone {
        if (this.tone) return this.tone;
        if (!this.status) return 'default';
        return StatusBadgeComponent.TONE_MAP[this.status.toUpperCase()] ?? 'default';
    }

    get ariaLabel(): string {
        return this.label || this.status || 'Status';
    }
}
