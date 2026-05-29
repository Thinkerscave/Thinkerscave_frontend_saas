import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AcademicsActionMode, AcademicsWorkspaceData, SubjectModel } from '../../../models/academics-workspace.model';
import { AcademicEmptyStateComponent } from '../../shared/empty-state/empty-state.component';

@Component({
  selector: 'app-academic-subjects-page',
  standalone: true,
  imports: [CommonModule, FormsModule, AcademicEmptyStateComponent],
  template: `
    <section class="acad-panel acad-subject-library">
      <div class="acad-toolbar">
        <div>
          <span>Subject library</span>
          <h2>Search and manage subjects</h2>
        </div>
        <div class="acad-toolbar-controls">
          <label class="acad-search-box"><i class="pi pi-search"></i><input [(ngModel)]="query" placeholder="Search by subject, code or category"></label>
          <button type="button" class="acad-ghost-button" [class.is-active]="viewMode === 'grid'" (click)="viewMode = 'grid'"><i class="pi pi-th-large"></i>Grid</button>
          <button type="button" class="acad-ghost-button" [class.is-active]="viewMode === 'table'" (click)="viewMode = 'table'"><i class="pi pi-table"></i>Table</button>
          <button type="button" class="acad-primary-button" (click)="actionRequested.emit('subject')"><i class="pi pi-plus"></i>Add subject</button>
        </div>
      </div>

      <div class="acad-filter-chips">
        <button type="button" [class.is-active]="category === 'ALL'" (click)="category = 'ALL'">All</button>
        <button *ngFor="let item of categories" type="button" [class.is-active]="category === item" (click)="category = item">{{ item }}</button>
      </div>

      <app-academic-empty-state *ngIf="!filteredSubjects.length" icon="pi pi-book" title="No subjects match this view" description="Adjust filters or add a subject to grow the learning catalog." actionLabel="Add subject" (action)="actionRequested.emit('subject')"></app-academic-empty-state>

      <div class="acad-subject-grid" *ngIf="viewMode === 'grid' && filteredSubjects.length">
        <article *ngFor="let subject of filteredSubjects" class="acad-subject-tile">
          <div class="acad-subject-icon"><i [ngClass]="iconFor(subject)"></i></div>
          <div>
            <strong>{{ subject.subjectName }}</strong>
            <span>{{ subject.subjectCode }} · {{ subject.category || 'GENERAL' }}</span>
            <p>{{ subject.description || 'Learning outcomes pending.' }}</p>
          </div>
          <footer>
            <span>{{ subject.credits || 0 }} credits</span>
            <span>{{ (subject.theoryHours || 0) + (subject.labHours || 0) + (subject.practicalHours || 0) }} weekly hours</span>
          </footer>
        </article>
      </div>

      <div class="acad-smart-table" *ngIf="viewMode === 'table' && filteredSubjects.length">
        <table>
          <thead>
            <tr><th>Subject</th><th>Category</th><th>Credits</th><th>Hours</th><th>Status</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let subject of filteredSubjects">
              <td><strong>{{ subject.subjectName }}</strong><small>{{ subject.subjectCode }}</small></td>
              <td>{{ subject.category || 'GENERAL' }}</td>
              <td>{{ subject.credits || 0 }}</td>
              <td>{{ (subject.theoryHours || 0) + (subject.labHours || 0) + (subject.practicalHours || 0) }}</td>
              <td><span class="acad-status-pill success">{{ subject.isActive === false ? 'Inactive' : 'Active' }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `
})
export class AcademicSubjectsPageComponent {
  @Input({ required: true }) data!: AcademicsWorkspaceData;
  @Output() actionRequested = new EventEmitter<AcademicsActionMode>();

  query = '';
  category = 'ALL';
  viewMode: 'grid' | 'table' = 'grid';

  get categories(): string[] {
    return Array.from(new Set(this.data.subjects.map(item => item.category || 'GENERAL')));
  }

  get filteredSubjects(): SubjectModel[] {
    const query = this.query.trim().toLowerCase();
    return this.data.subjects.filter(subject => {
      const matchesCategory = this.category === 'ALL' || (subject.category || 'GENERAL') === this.category;
      const text = `${subject.subjectName} ${subject.subjectCode} ${subject.category || ''}`.toLowerCase();
      return matchesCategory && (!query || text.includes(query));
    });
  }

  iconFor(subject: SubjectModel): string {
    const name = `${subject.subjectName} ${subject.category || ''}`.toLowerCase();
    if (name.includes('math')) {
      return 'pi pi-calculator';
    }
    if (name.includes('science') || name.includes('physics') || name.includes('chem')) {
      return 'pi pi-bolt';
    }
    if (name.includes('computer')) {
      return 'pi pi-desktop';
    }
    if (name.includes('english') || name.includes('hindi')) {
      return 'pi pi-language';
    }
    return 'pi pi-book';
  }
}
