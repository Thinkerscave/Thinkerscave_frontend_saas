import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { AcademicsActionMode, AcademicsWorkspaceData, AcademicsWorkloadItem } from '../../../models/academics-workspace.model';
import { AcademicsInsightsService } from '../../../services/academics-insights.service';
import { AcademicEmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { AcademicProgressRingComponent } from '../../shared/progress-ring/progress-ring.component';

@Component({
  selector: 'app-academic-allocation-page',
  standalone: true,
  imports: [CommonModule, AcademicEmptyStateComponent, AcademicProgressRingComponent],
  template: `
    <section class="acad-page-grid allocation-layout">
      <main class="acad-panel acad-workload-board" *ngIf="mode === 'teacher'; else classTeacherView">
        <div class="acad-section-head">
          <div>
            <span>Workload balancing interface</span>
            <h2>Teacher allocation</h2>
          </div>
          <button type="button" class="acad-primary-button" (click)="actionRequested.emit('allocation')"><i class="pi pi-user-plus"></i>Assign teacher</button>
        </div>

        <app-academic-empty-state *ngIf="!data.teacherAllocations.length" icon="pi pi-users" title="No teacher allocations yet" description="Assign teachers to subjects and classes to start balancing weekly workload." actionLabel="Assign teacher" (action)="actionRequested.emit('allocation')"></app-academic-empty-state>

        <div class="acad-teacher-load-grid" *ngIf="data.teacherAllocations.length">
          <article *ngFor="let workload of workloads" [ngClass]="'tone-' + workload.tone">
            <div class="acad-row-between">
              <div><strong>{{ workload.teacherName }}</strong><small>{{ workload.allocationCount }} subject allocations</small></div>
              <app-academic-progress-ring [value]="workload.utilization" [tone]="workload.tone"></app-academic-progress-ring>
            </div>
            <div class="acad-allocation-list">
              <span *ngFor="let allocation of allocationsFor(workload)">{{ allocation.subjectName }} · {{ allocation.className }}</span>
            </div>
          </article>
        </div>
      </main>

      <ng-template #classTeacherView>
        <main class="acad-panel acad-ownership-board">
          <div class="acad-section-head">
            <div>
              <span>Organizational assignment UI</span>
              <h2>Homeroom ownership</h2>
            </div>
            <button type="button" class="acad-primary-button" (click)="actionRequested.emit('class-teacher')"><i class="pi pi-user-plus"></i>Assign class teacher</button>
          </div>

          <app-academic-empty-state *ngIf="!data.classTeacherAssignments.length" icon="pi pi-user-plus" title="No class teachers assigned" description="Assign a class teacher so families and students know who owns daily communication." actionLabel="Assign class teacher" (action)="actionRequested.emit('class-teacher')"></app-academic-empty-state>

          <div class="acad-owner-grid" *ngIf="data.classTeacherAssignments.length">
            <article *ngFor="let owner of data.classTeacherAssignments">
              <span class="acad-avatar">{{ initials(owner.teacherName) }}</span>
              <div>
                <strong>{{ owner.className }} {{ owner.sectionName || '' }}</strong>
                <p>{{ owner.teacherName }}</p>
                <small>{{ owner.notes || 'Communication and student wellbeing ownership active.' }}</small>
              </div>
            </article>
          </div>
        </main>
      </ng-template>

      <aside class="acad-panel acad-conflict-panel">
        <div class="acad-section-head compact">
          <div>
            <span>Conflict engine</span>
            <h2>Signals</h2>
          </div>
        </div>
        <div class="acad-rule-list">
          <article><i class="pi pi-shield"></i><div><strong>Duplicate assignment protection</strong><p>Backend validation prevents duplicate teacher/class/subject ownership.</p></div></article>
          <article><i class="pi pi-chart-bar"></i><div><strong>Load visibility</strong><p>Weekly period utilization is calculated from live allocation records.</p></div></article>
          <article><i class="pi pi-heart"></i><div><strong>Class health overview</strong><p>Class teacher assignments are visible as ownership cards.</p></div></article>
        </div>
      </aside>
    </section>
  `
})
export class AcademicAllocationPageComponent {
  private readonly insights = inject(AcademicsInsightsService);

  @Input({ required: true }) data!: AcademicsWorkspaceData;
  @Input() mode: 'teacher' | 'class-teacher' = 'teacher';
  @Input() workloads: AcademicsWorkloadItem[] = [];
  @Output() actionRequested = new EventEmitter<AcademicsActionMode>();

  allocationsFor(workload: AcademicsWorkloadItem) {
    return this.data.teacherAllocations.filter(item => Number(item.teacherId) === Number(workload.teacherId)).slice(0, 4);
  }

  initials(name?: string): string {
    return (name || 'Teacher').split(' ').filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  }

  teacherName(teacherId?: number): string {
    return this.insights.teacherNameFromId(this.data, teacherId);
  }
}
