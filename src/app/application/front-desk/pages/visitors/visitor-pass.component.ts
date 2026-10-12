import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';

import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { AppValidationMessageComponent } from '../../../../shared/ui/app-form/app-validation-message.component';
import { SaasPageHeaderComponent, SaasPanelComponent } from '../../../../shared/ui/saas/saas-primitives';
import { FrontDeskApiService, StaffDirectoryRow, StudentDirectoryRow } from '../../front-desk-api.service';

const MOBILE = /^(?:\+91[\s-]?)?[6-9]\d{9}$/;

interface VisitorForm {
  visitorName: string;
  mobileNumber: string;
  idType: string;
  idNumber: string;
  purpose: string;
  vehicleNumber: string;
  badgeNumber: string;
}

@Component({
  selector: 'app-visitor-pass',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterLink, SaasPageHeaderComponent, SaasPanelComponent, AppValidationMessageComponent, AppToastComponent],
  providers: [MessageService],
  template: `
    <section class="tc-page-shell">
      <tc-saas-page-header>
        <a class="tc-btn" routerLink="/app/front-desk/visitors/active">Active visitors</a>
      </tc-saas-page-header>
      <tc-saas-panel title="Visitor pass">
        <form class="desk-form" (ngSubmit)="save()">
          <label>Name <input [(ngModel)]="form.visitorName" name="visitorName" required /></label>
          <label>Mobile <input [(ngModel)]="form.mobileNumber" name="mobileNumber" required /></label>
          <app-validation-message *ngIf="mobileError" message="Enter a valid Indian mobile number" />
          <label>ID type
            <select [(ngModel)]="form.idType" name="idType">
              <option value="AADHAAR">Aadhaar</option>
              <option value="PAN">PAN</option>
              <option value="DRIVING_LICENCE">Driving licence</option>
              <option value="OTHER">Other</option>
            </select>
          </label>
          <label>ID number <input [(ngModel)]="form.idNumber" name="idNumber" /></label>
          <label>Purpose
            <select [(ngModel)]="form.purpose" name="purpose">
              <option value="MEETING">Meeting</option>
              <option value="INQUIRY">Inquiry</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="DELIVERY">Delivery</option>
            </select>
          </label>
          <label>Person to meet
            <select [(ngModel)]="meetKind" name="meetKind">
              <option value="STAFF">Staff</option>
              <option value="STUDENT">Student</option>
            </select>
          </label>
          <label>Search
            <input [(ngModel)]="lookup" name="lookup" (ngModelChange)="searchPeople($event)" />
          </label>
          <ul>
            @for (person of people; track person.id) {
              <li><button type="button" class="tc-btn" (click)="pick(person)">{{ person.label }}</button></li>
            }
          </ul>
          <label>Vehicle <input [(ngModel)]="form.vehicleNumber" name="vehicleNumber" /></label>
          <label>Badge <input [(ngModel)]="form.badgeNumber" name="badgeNumber" /></label>
          <div class="desk-capture">
            <video #video autoplay playsinline></video>
            <canvas #canvas hidden></canvas>
            @if (photoUrl) { <img [src]="photoUrl" alt="Visitor photo" /> }
            <div class="desk-capture__actions">
              <button type="button" class="tc-btn" (click)="capture()">Capture</button>
              <button type="button" class="tc-btn" (click)="retake()">Retake</button>
            </div>
          </div>
          <button type="submit" class="tc-btn tc-btn--primary" [disabled]="saving">Check in</button>
        </form>
      </tc-saas-panel>
      <app-toast />
    </section>
  `,
})
export class VisitorPassComponent implements OnDestroy {
  @ViewChild('video') video?: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvas?: ElementRef<HTMLCanvasElement>;

  private readonly api = inject(FrontDeskApiService);
  private readonly router = inject(Router);
  private readonly messages = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private stream?: MediaStream;

  form: VisitorForm = { visitorName: '', mobileNumber: '', idType: 'AADHAAR', idNumber: '', purpose: 'MEETING', vehicleNumber: '', badgeNumber: '' };
  meetKind: 'STAFF' | 'STUDENT' = 'STAFF';
  meetPersonId: number | null = null;
  meetPersonName = '';
  lookup = '';
  people: { id: number; label: string }[] = [];
  photoUrl = '';
  photoBlob: Blob | null = null;
  saving = false;
  mobileError = false;

  ngOnDestroy(): void {
    this.stream?.getTracks().forEach(track => track.stop());
  }

  searchPeople(value: string): void {
    const done = (rows: { id: number; label: string }[]) => {
      this.people = rows;
      this.cdr.markForCheck();
    };
    if (this.meetKind === 'STAFF') {
      this.api.staff(value).subscribe(rows => done(rows.map((row: StaffDirectoryRow) => ({
        id: row.staffId,
        label: [row.name, row.designation, row.mobile].filter(Boolean).join(' · ')
      }))));
    } else {
      this.api.students(value).subscribe(rows => done(rows.map((row: StudentDirectoryRow) => ({
        id: row.studentId,
        label: [row.studentName, row.className, row.rollNumber].filter(Boolean).join(' · ')
      }))));
    }
  }

  pick(person: { id: number; label: string }): void {
    this.meetPersonId = person.id;
    this.meetPersonName = person.label;
  }

  async capture(): Promise<void> {
    if (!this.stream) {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (this.video) this.video.nativeElement.srcObject = this.stream;
      return;
    }
    const video = this.video?.nativeElement;
    const canvas = this.canvas?.nativeElement;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    this.photoBlob = await new Promise(resolve => canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.85));
    this.photoUrl = canvas.toDataURL('image/jpeg');
    this.cdr.markForCheck();
  }

  retake(): void {
    this.photoBlob = null;
    this.photoUrl = '';
  }

  save(): void {
    this.mobileError = !MOBILE.test(this.form['mobileNumber'].trim());
    if (this.mobileError || !this.form['visitorName'].trim()) {
      this.cdr.markForCheck();
      return;
    }
    this.saving = true;
    const body = {
      ...this.form,
      meetPersonType: this.meetKind,
      meetPersonId: this.meetPersonId,
      meetPersonName: this.meetPersonName || null
    };
    this.api.create('visitors', body).subscribe({
      next: saved => {
        const id = Number(saved['id']);
        const finish = () => {
          this.messages.add({ severity: 'success', summary: 'Visitor checked in' });
          void this.router.navigate(['/app/front-desk/visitors/active']);
        };
        if (this.photoBlob && id) {
          this.api.uploadVisitorPhoto(id, this.photoBlob, 'visitor.jpg').subscribe({ next: finish, error: finish });
        } else {
          finish();
        }
      },
      error: () => {
        this.saving = false;
        this.messages.add({ severity: 'error', summary: 'Check-in failed' });
        this.cdr.markForCheck();
      }
    });
  }
}
