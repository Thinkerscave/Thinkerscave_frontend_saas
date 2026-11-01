import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';

import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import {
  AppFormSectionComponent,
  AppInputComponent,
  AppPhoneInputComponent,
  AppSectionHeaderComponent,
  AppSelectComponent,
  AppSelectOption
} from '../../../../shared/ui/app-form';
import { phoneErrorMessage } from '../../../../shared/ui/app-form/app-phone-input.component';
import { SaasPageHeaderComponent, SaasPanelComponent } from '../../../../shared/ui/saas/saas-primitives';
import { FrontDeskApiService, StaffDirectoryRow, StudentDirectoryRow } from '../../front-desk-api.service';

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
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    SaasPageHeaderComponent,
    SaasPanelComponent,
    AppFormSectionComponent,
    AppSectionHeaderComponent,
    AppInputComponent,
    AppSelectComponent,
    AppPhoneInputComponent,
    AppToastComponent
  ],
  providers: [MessageService],
  templateUrl: './visitor-pass.component.html',
  styleUrls: ['../../front-desk.shared.scss', './visitor-pass.component.scss']
})
export class VisitorPassComponent implements OnDestroy {
  @ViewChild('video') video?: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvas?: ElementRef<HTMLCanvasElement>;

  private readonly api = inject(FrontDeskApiService);
  private readonly router = inject(Router);
  private readonly messages = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private stream?: MediaStream;
  private searchTimer?: ReturnType<typeof setTimeout>;

  readonly idTypeOptions: AppSelectOption[] = [
    { value: 'AADHAAR', label: 'Aadhaar' },
    { value: 'PAN', label: 'PAN' },
    { value: 'DRIVING_LICENCE', label: 'Driving licence' },
    { value: 'OTHER', label: 'Other' }
  ];

  readonly purposeOptions: AppSelectOption[] = [
    { value: 'MEETING', label: 'Meeting' },
    { value: 'INQUIRY', label: 'Inquiry' },
    { value: 'MAINTENANCE', label: 'Maintenance' },
    { value: 'DELIVERY', label: 'Delivery' }
  ];

  readonly meetKindOptions: AppSelectOption<'STAFF' | 'STUDENT'>[] = [
    { value: 'STAFF', label: 'Staff' },
    { value: 'STUDENT', label: 'Student' }
  ];

  form: VisitorForm = {
    visitorName: '',
    mobileNumber: '',
    idType: 'AADHAAR',
    idNumber: '',
    purpose: 'MEETING',
    vehicleNumber: '',
    badgeNumber: ''
  };

  meetKind: 'STAFF' | 'STUDENT' = 'STAFF';
  meetPersonId: number | null = null;
  meetPersonName = '';
  lookup = '';
  people: { id: number; label: string }[] = [];
  searchingPeople = false;
  photoUrl = '';
  photoBlob: Blob | null = null;
  saving = false;
  nameError = false;
  mobileError = false;
  mobileErrorMessage = '';

  ngOnDestroy(): void {
    this.stream?.getTracks().forEach(track => track.stop());
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
  }

  onMeetKindChange(): void {
    this.lookup = '';
    this.people = [];
    this.clearHost();
    this.cdr.markForCheck();
  }

  clearHost(): void {
    this.meetPersonId = null;
    this.meetPersonName = '';
    this.cdr.markForCheck();
  }

  searchPeople(value: string): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    const term = (value ?? '').trim();
    if (term.length < 2) {
      this.people = [];
      this.searchingPeople = false;
      this.cdr.markForCheck();
      return;
    }
    this.searchingPeople = true;
    this.searchTimer = setTimeout(() => {
      const done = (rows: { id: number; label: string }[]) => {
        this.people = rows;
        this.searchingPeople = false;
        this.cdr.markForCheck();
      };
      if (this.meetKind === 'STAFF') {
        this.api.staff(term).subscribe({
          next: rows => done(rows.map((row: StaffDirectoryRow) => ({
            id: row.staffId,
            label: [row.name, row.designation, row.mobile].filter(Boolean).join(' · ')
          }))),
          error: () => done([])
        });
      } else {
        this.api.students(term).subscribe({
          next: rows => done(rows.map((row: StudentDirectoryRow) => ({
            id: row.studentId,
            label: [row.studentName, row.className, row.rollNumber].filter(Boolean).join(' · ')
          }))),
          error: () => done([])
        });
      }
    }, 280);
  }

  pick(person: { id: number; label: string }): void {
    this.meetPersonId = person.id;
    this.meetPersonName = person.label;
    this.people = [];
    this.lookup = person.label.split(' · ')[0] ?? person.label;
    this.cdr.markForCheck();
  }

  async capture(): Promise<void> {
    if (!this.stream) {
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
        if (this.video) {
          this.video.nativeElement.srcObject = this.stream;
        }
      } catch {
        this.messages.add({ severity: 'warn', summary: 'Camera unavailable', detail: 'Check browser permissions or use check-in without photo.' });
      }
      this.cdr.markForCheck();
      return;
    }
    const video = this.video?.nativeElement;
    const canvas = this.canvas?.nativeElement;
    if (!video || !canvas) {
      return;
    }
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    this.photoBlob = await new Promise(resolve => canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.85));
    this.photoUrl = canvas.toDataURL('image/jpeg');
    this.stream.getTracks().forEach(track => track.stop());
    this.stream = undefined;
    this.cdr.markForCheck();
  }

  retake(): void {
    this.photoBlob = null;
    this.photoUrl = '';
    this.cdr.markForCheck();
  }

  save(): void {
    this.nameError = !this.form.visitorName.trim();
    const phoneErr = phoneErrorMessage(this.form.mobileNumber);
    this.mobileError = !!phoneErr;
    this.mobileErrorMessage = phoneErr ?? '';
    if (this.nameError || this.mobileError) {
      this.cdr.markForCheck();
      return;
    }
    this.saving = true;
    const body = {
      ...this.form,
      mobileNumber: this.form.mobileNumber.trim(),
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
