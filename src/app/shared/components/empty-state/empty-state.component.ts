import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';

/**
 * Friendly empty-state placeholder shown when a list or workspace has no data.
 * Supports a primary CTA (via output) and a secondary slot via ng-content.
 */
@Component({
    selector: 'app-empty-state',
    standalone: true,
    imports: [CommonModule, ButtonModule],
    templateUrl: './empty-state.component.html',
    styleUrl: './empty-state.component.scss'
})
export class EmptyStateComponent {
    @Input() icon = 'pi pi-inbox';
    @Input() title = 'Nothing here yet';
    @Input() message: string | null = null;
    @Input() actionLabel: string | null = null;
    @Input() actionIcon: string | null = null;
    @Input() compact = false;
    @Output() action = new EventEmitter<void>();
}
