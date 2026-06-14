import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { StudentCreateRequest } from '../../models/students-workspace.model';
import { StudentsWorkspaceService } from '../../services/students-workspace.service';

@Component({
  selector: 'app-add-student',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="add-student-shell">
      <header class="hero">
        <div>
          <p class="eyebrow">Students</p>
          <h1>Add Student</h1>
          <p>Create a student record and enrol guardian details in one pass.</p>
        </div>
        <button type="button" class="ghost-btn" (click)="goBack()">Back to Directory</button>
      </header>

      <div class="card" *ngIf="errorMessage">
        <i class="pi pi-exclamation-triangle"></i>
        <span>{{ errorMessage }}</span>
      </div>

      <div class="card success" *ngIf="successMessage">
        <i class="pi pi-check-circle"></i>
        <span>{{ successMessage }}</span>
      </div>

      <form class="card form-grid" (ngSubmit)="save()">
        <label>
          <span>First Name *</span>
          <input [(ngModel)]="form.firstName" name="firstName" required />
        </label>
        <label>
          <span>Middle Name</span>
          <input [(ngModel)]="form.middleName" name="middleName" />
        </label>
        <label>
          <span>Last Name *</span>
          <input [(ngModel)]="form.lastName" name="lastName" required />
        </label>
        <label>
          <span>Email *</span>
          <input [(ngModel)]="form.email" name="email" type="email" required />
        </label>
        <label>
          <span>Mobile Number *</span>
          <input [(ngModel)]="form.mobileNumber" name="mobileNumber" required />
        </label>
        <label>
          <span>Gender</span>
          <input [(ngModel)]="form.gender" name="gender" />
        </label>
        <label>
          <span>Date of Birth</span>
          <input [(ngModel)]="form.dateOfBirth" name="dateOfBirth" type="date" />
        </label>
        <label>
          <span>Enrollment Date</span>
          <input [(ngModel)]="form.enrollmentDate" name="enrollmentDate" type="date" />
        </label>
        <label>
          <span>Class ID *</span>
          <input [(ngModel)]="classIdInput" name="classId" type="number" min="1" required />
        </label>
        <label>
          <span>Section ID *</span>
          <input [(ngModel)]="sectionIdInput" name="sectionId" type="number" min="1" required />
        </label>
        <label>
          <span>Guardian First Name *</span>
          <input [(ngModel)]="form.guardianFirstName" name="guardianFirstName" required />
        </label>
        <label>
          <span>Guardian Last Name *</span>
          <input [(ngModel)]="form.guardianLastName" name="guardianLastName" required />
        </label>
        <label>
          <span>Guardian Phone *</span>
          <input [(ngModel)]="form.guardianPhoneNumber" name="guardianPhoneNumber" required />
        </label>
        <label>
          <span>Guardian Email</span>
          <input [(ngModel)]="form.guardianEmail" name="guardianEmail" type="email" />
        </label>
        <label class="full">
          <span>Remarks</span>
          <textarea [(ngModel)]="form.remarks" name="remarks" rows="4"></textarea>
        </label>

        <div class="actions full">
          <button type="button" class="ghost-btn" (click)="goBack()">Cancel</button>
          <button type="submit" class="primary-btn" [disabled]="saving">
            {{ saving ? 'Saving...' : 'Create Student' }}
          </button>
        </div>
      </form>
    </section>
  `,
  styles: [`
    :host { display: block; min-height: 100%; background: linear-gradient(180deg, color-mix(in srgb, var(--tc-surface) 88%, white) 0%, var(--tc-background) 100%); }
    .add-student-shell { max-width: 1180px; margin: 0 auto; padding: 28px; color: var(--tc-text); }
    .hero { display:flex; justify-content:space-between; gap:16px; align-items:flex-start; margin-bottom:20px; }
    .eyebrow { margin:0 0 8px; text-transform:uppercase; letter-spacing:.12em; font-size:.72rem; color:var(--tc-primary-600); font-weight:700; }
    h1 { margin:0; font-size:clamp(2rem, 3vw, 3rem); color:var(--tc-heading); }
    .hero p { margin:.35rem 0 0; color:var(--tc-text-muted); }
    .card { background: var(--tc-surface-card-solid); border:1px solid var(--tc-border); border-radius:20px; box-shadow:var(--tc-shadow-lg); padding:18px; display:flex; gap:10px; align-items:center; }
    .card.success { margin-top:12px; color:var(--tc-success-700); }
    .form-grid { margin-top:12px; display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap:14px; align-items:start; }
    label { display:flex; flex-direction:column; gap:6px; font-size:.9rem; color:var(--tc-text); }
    label span { font-weight:600; color:var(--tc-heading); }
    input, textarea { width:100%; border:1px solid var(--tc-border); border-radius:14px; padding:12px 14px; background:var(--tc-background); color:var(--tc-text); }
    input:focus, textarea:focus { outline:none; border-color:var(--tc-primary-500); box-shadow:0 0 0 3px color-mix(in srgb, var(--tc-primary-500) 18%, transparent); }
    .full { grid-column: 1 / -1; }
    .actions { display:flex; justify-content:flex-end; gap:12px; padding-top:4px; }
    .ghost-btn, .primary-btn { border:none; border-radius:999px; padding:12px 18px; font-weight:700; cursor:pointer; }
    .ghost-btn { background: color-mix(in srgb, var(--tc-surface) 82%, white); color: var(--tc-text); }
    .primary-btn { background: linear-gradient(135deg, var(--tc-primary-600), var(--tc-primary-500)); color:white; box-shadow:0 16px 32px color-mix(in srgb, var(--tc-primary-600) 28%, transparent); }
    .primary-btn:disabled { opacity:.7; cursor:not-allowed; }
    @media (max-width: 820px) {
      .hero { flex-direction:column; }
      .form-grid { grid-template-columns: 1fr; }
      .actions { justify-content:stretch; }
      .actions button { flex:1; }
    }
  `]
})
export class AddStudentComponent implements OnInit {
  private readonly api = inject(StudentsWorkspaceService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  saving = false;
  errorMessage = '';
  successMessage = '';
  classIdInput = 1;
  sectionIdInput = 1;

  form: StudentCreateRequest = {
    firstName: '',
    middleName: null,
    lastName: '',
    email: '',
    mobileNumber: '',
    gender: null,
    dateOfBirth: null,
    enrollmentDate: new Date().toISOString().substring(0, 10),
    isSameAddress: true,
    currentCountry: 'India',
    currentState: 'Karnataka',
    currentCity: 'Bangalore',
    guardianFirstName: '',
    guardianLastName: '',
    guardianPhoneNumber: '',
    guardianEmail: null,
    classId: 1,
    sectionId: 1,
    remarks: null
  };

  ngOnInit(): void {
    this.syncIds();
  }

  save(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.syncIds();

    if (!this.form.firstName.trim() || !this.form.lastName.trim() || !this.form.email.trim() || !this.form.mobileNumber.trim() || !this.form.guardianFirstName.trim() || !this.form.guardianLastName.trim() || !(this.form.guardianPhoneNumber ?? '').trim()) {
      this.errorMessage = 'Fill in all required fields before saving.';
      this.cdr.markForCheck();
      return;
    }

    this.saving = true;
    this.api.createStudent(this.form)
      .pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => {
          this.successMessage = 'Student created successfully.';
          this.form = {
            ...this.form,
            firstName: '',
            middleName: null,
            lastName: '',
            email: '',
            mobileNumber: '',
            gender: null,
            dateOfBirth: null,
            guardianFirstName: '',
            guardianLastName: '',
            guardianPhoneNumber: '',
            guardianEmail: null,
            remarks: null
          };
          this.cdr.markForCheck();
        },
        error: err => {
          this.errorMessage = err?.error?.message || 'Could not create the student record.';
          this.cdr.markForCheck();
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/app/students/directory']);
  }

  private syncIds(): void {
    this.form.classId = Number(this.classIdInput) || null;
    this.form.sectionId = Number(this.sectionIdInput) || null;
  }
}