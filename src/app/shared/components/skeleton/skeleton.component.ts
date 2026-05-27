import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export type SkeletonShape = 'line' | 'rect' | 'circle' | 'card' | 'table' | 'list';

/**
 * Lightweight shimmer placeholder used while data is loading.
 *
 * Examples:
 *  <app-skeleton shape="line" width="60%"></app-skeleton>
 *  <app-skeleton shape="card" [rows]="3"></app-skeleton>
 *  <app-skeleton shape="table" [rows]="5" [columns]="4"></app-skeleton>
 */
@Component({
    selector: 'app-skeleton',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './skeleton.component.html',
    styleUrl: './skeleton.component.scss'
})
export class SkeletonComponent {
    @Input() shape: SkeletonShape = 'line';
    @Input() width: string = '100%';
    @Input() height: string = '12px';
    @Input() size: string = '32px';
    @Input() rows: number = 3;
    @Input() columns: number = 4;

    get rowsArr(): number[] {
        return Array.from({ length: Math.max(1, this.rows) });
    }

    get columnsArr(): number[] {
        return Array.from({ length: Math.max(1, this.columns) });
    }
}
