import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { ChildItem, ChildProfileData } from '../../models/dashboard.model';

/**
 * List-based, future-ready for multiple children per parent. Selection is
 * handled locally for instant visual feedback (the backend defaults to the
 * first child and every other widget on this dashboard is scoped to that
 * default today); `selectChild` is emitted as the integration point for
 * when per-child widget refresh is introduced.
 */
@Component({
  selector: 'tc-child-profile-widget',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-children">
      <button type="button" class="w-children__chip" *ngFor="let child of data?.children || []"
              [class.is-selected]="child.studentId === selectedId"
              (click)="select(child)">
        <span class="w-avatar">
          <img *ngIf="child.photoUrl" [src]="child.photoUrl" [alt]="child.displayName" />
          <ng-container *ngIf="!child.photoUrl">{{ child.displayName.charAt(0) }}</ng-container>
        </span>
        {{ child.displayName }}
        <span *ngIf="child.className">· {{ child.className }}{{ child.sectionName ? '-' + child.sectionName : '' }}</span>
      </button>
    </div>
  `
})
export class ChildProfileWidgetComponent implements OnChanges {
  @Input({ required: true }) data!: ChildProfileData;
  @Output() selectChild = new EventEmitter<ChildItem>();

  selectedId: number | null = null;

  ngOnChanges(): void {
    if (this.selectedId === null) {
      const children = this.data?.children ?? [];
      this.selectedId = children.find(c => c.selected)?.studentId ?? children[0]?.studentId ?? null;
    }
  }

  select(child: ChildItem): void {
    this.selectedId = child.studentId;
    this.selectChild.emit(child);
  }
}
