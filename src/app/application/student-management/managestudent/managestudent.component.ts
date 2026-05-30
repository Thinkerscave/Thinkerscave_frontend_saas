import { Component, NgModule , ChangeDetectionStrategy} from '@angular/core';
import { Tab, TabsModule } from 'primeng/tabs';
import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';
import { FormBuilder, FormGroup, FormsModule, NgModel, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FileUploaderComponent } from '../file-uploader/file-uploader.component';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Student, ViewStudentsComponent } from '../view-students/view-students.component';
import { LocationService } from '../location.service';
import { Class, ClassService } from '../class.service';
import { Section, SectionService } from '../section.service';
import { CheckboxModule } from 'primeng/checkbox';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { environment } from '../../../../environments/environment';



interface State {
  name: string;
  state_code: string;
}

interface DocumentData {
  name: string;
  file: File;
}

@Component({
  selector: 'app-managestudent',
    changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ViewStudentsComponent, TabsModule, Tab, AccordionModule, HttpClientModule, ButtonModule, FileUploaderComponent, CommonModule, FormsModule, ReactiveFormsModule, CheckboxModule, CardModule, DropdownModule, FileUploadModule, ToastModule],
  providers: [MessageService],
  templateUrl: './managestudent.component.html',
  styleUrl: './managestudent.component.scss'
})
export class ManagestudentComponent {
  // This ensures the *ngFor loop has something to render on load.

  form!: FormGroup;

  activeAccordionIndexes: number[] = [0, 1, 2, 3, 4, 5];
  activeTabIndex = '0';


  onAccordionChange(event: any) {
    const newIndexes = Array.isArray(event) ? event : [event];
    this.activeAccordionIndexes = newIndexes;
  }

  classes: Class[] = [];
  sections: Section[] = [];

  documents: DocumentData[] = [];
  profilePicture: File | null = null;
  lastSavedAt: Date | null = null;

  countries: string[] = [];
  states: any[] = [];
  cities: string[] = [];
  currentcountries: string[] = [];
  permanentcountries: string[] = [];
  currentStates: any[] = [];
  permanentStates: any[] = [];
  currentCities: any[] = [];
  permanentCities: any[] = [];


  constructor(private fb: FormBuilder, private http: HttpClient, private locationService: LocationService, private classService: ClassService,
    private sectionService: SectionService, private messageService: MessageService) {
    this.form = this.fb.group({
      // User Info
      firstName: ['', Validators.required],
      middleName: [''],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      mobileNumber: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      age: ['10'],

      // Student Info
      gender: ['', Validators.required],
      remarks: [''],
      rollNumber: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      enrollmentDate: ['', Validators.required],
      isSameAddress: [false],

      // Current Address
      currentCountry: ['', Validators.required],
      currentState: ['', Validators.required],
      currentCity: ['', Validators.required],
      currentZipCode: ['', [Validators.required, Validators.pattern('^[0-9]{5,6}$')]],
      currentAddressLine: ['', Validators.required],

      // Permanent Address
      permanentCountry: ['', Validators.required],
      permanentState: ['', Validators.required],
      permanentCity: ['', Validators.required],
      permanentZipCode: ['', [Validators.required, Validators.pattern('^[0-9]{5,6}$')]],
      permanentAddressLine: ['', Validators.required],

      // School Relation Info
      classId: ['', Validators.required],
      sectionId: [{ value: '', disabled: true }, Validators.required],

      // Guardian Info
      guardianFirstName: ['', Validators.required],
      guardianMiddleName: [''],
      guardianLastName: ['', Validators.required],
      guardianRelation: ['', Validators.required],
      guardianEmail: ['', [Validators.required, Validators.email]],
      guardianPhoneNumber: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      guardianAddress: ['', Validators.required]
    });
  }

  showSuccess(detail: string) {
    this.messageService.add({ severity: 'success', summary: 'Success', detail });
  }

  showError(detail: string) {
    this.messageService.add({ severity: 'error', summary: 'Error', detail });
  }

  showInfo(detail: string) {
    this.messageService.add({ severity: 'info', summary: 'Information', detail });
  }




  ngOnInit() {
    // getCountryNames() now returns string[] directly (sorted)
    this.locationService.getCountryNames().subscribe(names => {
      this.countries = names;
      this.currentcountries = names;
      this.permanentcountries = names;
    });

    //For Loading Class
    this.loadClasses();
  }

  onCountryChange(addressType: 'current' | 'permanent') {
    const selectedCountry = this.form.get(`${addressType}Country`)?.value;
    if (!selectedCountry) return;

    // getStates() now returns StateItem[] directly (unwrapped inside service)
    this.locationService.getStates(selectedCountry).subscribe(states => {
      if (addressType === 'current') {
        this.currentStates = states;
        this.form.get('currentState')?.reset();
        this.form.get('currentCity')?.reset();
        this.currentCities = [];
      } else {
        this.permanentStates = states;
        this.form.get('permanentState')?.reset();
        this.form.get('permanentCity')?.reset();
        this.permanentCities = [];
      }
    });
  }


  onStateChange(addressType: 'current' | 'permanent') {
    const country = this.form.get(`${addressType}Country`)?.value;
    const state = this.form.get(`${addressType}State`)?.value;
    if (!country || !state) return;

    // getCities() now returns CityItem[] ({ name: string }) directly (unwrapped inside service)
    this.locationService.getCities(country, state).subscribe(cities => {
      if (addressType === 'current') {
        this.currentCities = cities;
        this.form.get('currentCity')?.reset();
      } else {
        this.permanentCities = cities;
        this.form.get('permanentCity')?.reset();
      }
    });
  }

  onSameAddressToggle() {
    const isSame = this.form.get('isSameAddress')?.value;
    //alert(isSame)
    if (isSame) {
      // Copy current address to permanent address
      this.form.patchValue({
        permanentAddressLine: this.form.get('currentAddressLine')?.value,
        permanentCountry: this.form.get('currentCountry')?.value,
        permanentState: this.form.get('currentState')?.value,
        permanentCity: this.form.get('currentCity')?.value,
        permanentZipCode: this.form.get('currentZipCode')?.value,
      });

      // Copy dropdown data too (to avoid async errors)
      this.permanentStates = this.currentStates;
      this.permanentCities = this.currentCities;

      // Optionally disable permanent fields
      this.form.get('permanentAddressLine')?.disable();
      this.form.get('permanentCountry')?.disable();
      this.form.get('permanentState')?.disable();
      this.form.get('permanentCity')?.disable();
      this.form.get('permanentZipCode')?.disable();
    } else {
      // Re-enable permanent fields and clear them
      this.form.get('permanentAddressLine')?.enable();
      this.form.get('permanentCountry')?.enable();
      this.form.get('permanentState')?.enable();
      this.form.get('permanentCity')?.enable();
      this.form.get('permanentZipCode')?.enable();

      this.form.patchValue({
        permanentAddressLine: '',
        permanentCountry: '',
        permanentState: '',
        permanentCity: '',
        permanentZipCode: '',
      });

      this.permanentStates = [];
      this.permanentCities = [];
    }
  }

  loadClasses() {
    this.classService.getClasses().subscribe(res => {
      // alert(JSON.stringify(res));
      this.classes = res;
    });
  }

  onClassChange() {
    const selectedClassId = this.form.get('classId')?.value;
    if (selectedClassId) {
      this.sectionService.getSectionsByClassId(selectedClassId).subscribe(res => {
        this.sections = res;

        if (this.sections.length > 0) {
          this.form.get('sectionId')?.enable();   // ✅ Enable field
        } else {
          this.form.get('sectionId')?.disable();  // ❌ No sections, so disable it
        }

        // this.form.get('sectionId')?.reset();
      });
    } else {
      this.sections = [];
      this.form.get('sectionId')?.reset();
      this.form.get('sectionId')?.disable();  // Reset and disable
    }
  }

  onDocumentsReady(event: { files: File[], types: string[] }) {
    this.documents = event.files.map((file, index) => ({
      file,
      name: event.types[index]
    }));
    this.showSuccess("Documents staged for upload successfully.");
  }


  onProfileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input?.files && input.files.length > 0) {
      const file = input.files[0];

      if (file.type.startsWith('image/')) {
        this.showSuccess("Profile photo selected successfully.");
        this.profilePicture = file;
      } else {
        this.showError('Please select a valid image file (e.g., .jpg, .png)');
      }
    }
  }

  onSaveDraft(): void {
    const draft = this.form.getRawValue();
    this.lastSavedAt = new Date();
    this.showInfo('Application draft saved locally.');
  }

  onEditStudent(student: Student): void {
    const nameParts = student.studentName.split(' ');
    const firstName = nameParts.shift() ?? '';
    const lastName = nameParts.pop() ?? '';
    const middleName = nameParts.join(' ');

    const parentParts = student.parentName.split(' ');
    const guardianFirstName = parentParts.shift() ?? '';
    const guardianLastName = parentParts.pop() ?? '';
    const guardianMiddleName = parentParts.join(' ');

    this.form.patchValue({
      firstName,
      middleName,
      lastName: lastName || firstName,
      guardianFirstName,
      guardianMiddleName,
      guardianLastName: guardianLastName || guardianFirstName,
      rollNumber: student.rollNumber,
      remarks: `Editing record #${student.id}`,
    });

    this.form.get('sectionId')?.enable();
    this.activeTabIndex = '0';
    this.form.markAsDirty();
  }

  // Collect data and send to backend
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.showError('Please fill all required fields correctly before submitting.');
      return;
    }

    const formData = new FormData();

    // Wrap and append your student DTO
    const studentDTO = {
      firstName: this.form.get('firstName')?.value,
      middleName: this.form.get('middleName')?.value || '',
      lastName: this.form.get('lastName')?.value,
      email: this.form.get('email')?.value,
      mobileNumber: this.form.get('mobileNumber')?.value,
      age: this.form.get('age')?.value || '10',

      gender: this.form.get('gender')?.value,
      rollNumber: this.form.get('rollNumber')?.value,
      dateOfBirth: this.form.get('dateOfBirth')?.value,
      enrollmentDate: this.form.get('enrollmentDate')?.value,

      isSameAddress: this.form.get('isSameAddress')?.value || false,

      currentCountry: this.form.get('currentCountry')?.value,
      currentState: this.form.get('currentState')?.value,
      currentCity: this.form.get('currentCity')?.value,
      currentZipCode: this.form.get('currentZipCode')?.value,
      currentAddressLine: this.form.get('currentAddressLine')?.value,

      permanentCountry: this.form.get('permanentCountry')?.value,
      permanentState: this.form.get('permanentState')?.value,
      permanentCity: this.form.get('permanentCity')?.value,
      permanentZipCode: this.form.get('permanentZipCode')?.value,
      permanentAddressLine: this.form.get('permanentAddressLine')?.value,

      classId: this.form.get('classId')?.value ? Number(this.form.get('classId')?.value) : null,
      sectionId: this.form.get('sectionId')?.value ? Number(this.form.get('sectionId')?.value) : null,

      guardianFirstName: this.form.get('guardianFirstName')?.value,
      guardianMiddleName: this.form.get('guardianMiddleName')?.value || '',
      guardianLastName: this.form.get('guardianLastName')?.value,
      guardianRelation: this.form.get('guardianRelation')?.value,
      guardianEmail: this.form.get('guardianEmail')?.value,
      guardianPhoneNumber: this.form.get('guardianPhoneNumber')?.value,
      guardianAddress: this.form.get('guardianAddress')?.value,

      remarks: this.form.get('remarks')?.value || ''
    };

    formData.append('studentData', new Blob([JSON.stringify(studentDTO)], { type: 'application/json' }));

    // Profile Picture
    if (this.profilePicture) {
      formData.append('photo', this.profilePicture);
    }

    // Append document files
    if (this.documents && this.documents.length > 0) {
      this.documents.forEach((doc) => {
        formData.append('documents', doc.file);
        formData.append('types', doc.name);
      });
    }

    // Send to backend
    this.http.post(`${environment.baseUrl}/students/registerStudent`, formData)
      .subscribe({
        next: (res) => {
          this.showSuccess('Registration completed successfully! The student record has been saved.');
          this.form.reset();
        },
        error: (err) => {
          console.error('Error saving student:', err);
          this.showError('An error occurred during submission. Please verify the backend service is running and try again.');
        }
      });
  }
}

