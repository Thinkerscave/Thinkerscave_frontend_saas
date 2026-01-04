import { Component } from '@angular/core';
import { Tab, TabsModule } from 'primeng/tabs';
import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
  imports: [ViewStudentsComponent, TabsModule, Tab, AccordionModule, HttpClientModule, ButtonModule, FileUploaderComponent, CommonModule, FormsModule, ReactiveFormsModule, CheckboxModule, CardModule, DropdownModule, FileUploadModule],
  templateUrl: './managestudent.component.html',
  styleUrl: './managestudent.component.scss'
})
export class ManagestudentComponent {
  form!: FormGroup;
  activeAccordionIndexes: number[] = [0, 1, 2, 3, 4, 5];
  activeTabIndex = '0';
  isEditMode = false;
  editingStudentId: number | null = null;

  // Form data arrays
  classes: Class[] = [];
  sections: Section[] = [];
  documents: DocumentData[] = [];
  profilePicture: File | null = null;
  lastSavedAt: Date | null = null;

  // Location arrays
  countries: string[] = [];
  states: any[] = [];
  cities: string[] = [];
  currentcountries: string[] = [];
  permanentcountries: string[] = [];
  currentStates: any[] = [];
  permanentStates: any[] = [];
  currentCities: any[] = [];
  permanentCities: any[] = [];

  constructor(
    private fb: FormBuilder, 
    private http: HttpClient, 
    private locationService: LocationService, 
    private classService: ClassService,
    private sectionService: SectionService
  ) {
    this.initializeForm();
  }

  initializeForm() {
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

  ngOnInit() {
    this.locationService.getCountries().subscribe(res => {
      this.countries = res.data.map(c => c.name);
      this.currentcountries = res.data.map(c => c.name);
      this.permanentcountries = res.data.map(c => c.name);
    });

    this.loadClasses();
  }

  onAccordionChange(event: any) {
    const newIndexes = Array.isArray(event) ? event : [event];
    this.activeAccordionIndexes = newIndexes;
  }

  onCountryChange(addressType: 'current' | 'permanent') {
    const countryControl = this.form.get(`${addressType}Country`);
    const selectedCountry = countryControl?.value;

    if (selectedCountry) {
      this.locationService.getStates(selectedCountry).subscribe(res => {
        this.states = res.data;
        const countryData: { name: string; iso2: string; iso3: string; states: State[] } = JSON.parse(JSON.stringify(this.states));

        if (addressType === 'current') {
          this.currentStates = countryData.states || [];
          this.form.get('currentState')?.reset();
          this.form.get('currentCity')?.reset();
        } else {
          this.permanentStates = countryData.states || [];
          this.form.get('permanentState')?.reset();
          this.form.get('permanentCity')?.reset();
        }
      });
    }
  }

  onStateChange(addressType: 'current' | 'permanent') {
    const country = this.form.get(`${addressType}Country`)?.value;
    const state = this.form.get(`${addressType}State`)?.value;

    if (country && state) {
      this.locationService.getCities(country, state).subscribe(res => {
        const cities = res.data;

        if (addressType === 'current') {
          this.currentCities = cities || [];
          this.form.get('currentCity')?.reset();
        } else {
          this.permanentCities = cities || [];
          this.form.get('permanentCity')?.reset();
        }
      });
    }
  }

  onSameAddressToggle() {
    const isSame = this.form.get('isSameAddress')?.value;

    if (isSame) {
      // Copy current address to permanent address
      this.form.patchValue({
        permanentAddressLine: this.form.get('currentAddressLine')?.value,
        permanentCountry: this.form.get('currentCountry')?.value,
        permanentState: this.form.get('currentState')?.value,
        permanentCity: this.form.get('currentCity')?.value,
        permanentZipCode: this.form.get('currentZipCode')?.value,
      });

      // Copy dropdown data
      this.permanentStates = [...this.currentStates];
      this.permanentCities = [...this.currentCities];

      // Disable permanent fields
      this.form.get('permanentAddressLine')?.disable();
      this.form.get('permanentCountry')?.disable();
      this.form.get('permanentState')?.disable();
      this.form.get('permanentCity')?.disable();
      this.form.get('permanentZipCode')?.disable();
    } else {
      // Re-enable permanent fields
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
      this.classes = res;
    });
  }

  onClassChange() {
    const selectedClassId = this.form.get('classId')?.value;
    if (selectedClassId) {
      this.sectionService.getSectionsByClassId(selectedClassId).subscribe(res => {
        this.sections = res;

        if (this.sections.length > 0) {
          this.form.get('sectionId')?.enable();
        } else {
          this.form.get('sectionId')?.disable();
        }
      });
    } else {
      this.sections = [];
      this.form.get('sectionId')?.reset();
      this.form.get('sectionId')?.disable();
    }
  }

  onDocumentsReady(event: { files: File[], types: string[] }) {
    this.documents = event.files.map((file, index) => ({
      file,
      name: event.types[index]
    }));
  }

  onProfileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input?.files && input.files.length > 0) {
      const file = input.files[0];

      if (file.type.startsWith('image/')) {
        this.profilePicture = file;
      } else {
        alert('Please select a valid image file (e.g., .jpg, .png)');
      }
    }
  }

  onSaveDraft(): void {
    if (this.form.valid) {
      const draft = this.form.getRawValue();
      console.log('Draft payload:', draft);
      this.lastSavedAt = new Date();
      alert('Draft saved locally.');
    } else {
      this.markAllFieldsAsTouched();
      alert('Please fill all required fields before saving.');
    }
  }

  onEditStudent(student: Student): void {
    this.isEditMode = true;
    this.editingStudentId = student.id;

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
      rollNumber: student.rollNo,
      remarks: `Editing record #${student.id}`,
    });

    this.form.get('sectionId')?.enable();
    this.activeTabIndex = '0';
    this.form.markAsDirty();
  }

  resetForm() {
    this.form.reset();
    this.isEditMode = false;
    this.editingStudentId = null;
    this.profilePicture = null;
    this.documents = [];
    
    // Reset all arrays
    this.currentStates = [];
    this.permanentStates = [];
    this.currentCities = [];
    this.permanentCities = [];
    
    // Re-enable all disabled fields
    this.form.get('sectionId')?.enable();
    this.form.get('permanentAddressLine')?.enable();
    this.form.get('permanentCountry')?.enable();
    this.form.get('permanentState')?.enable();
    this.form.get('permanentCity')?.enable();
    this.form.get('permanentZipCode')?.enable();
    
    // Reset to initial state
    this.form.patchValue({
      isSameAddress: false
    });
  }

  markAllFieldsAsTouched() {
    Object.keys(this.form.controls).forEach(field => {
      const control = this.form.get(field);
      control?.markAsTouched({ onlySelf: true });
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.markAllFieldsAsTouched();
      alert('Please fill all required fields correctly.');
      return;
    }

    const formData = new FormData();
    const studentDTO = {
      id: this.isEditMode ? this.editingStudentId : null,
      firstName: this.form.get('firstName')?.value,
      middleName: this.form.get('middleName')?.value,
      lastName: this.form.get('lastName')?.value,
      email: this.form.get('email')?.value,
      mobileNumber: this.form.get('mobileNumber')?.value,
      gender: this.form.get('gender')?.value,
      rollNumber: this.form.get('rollNumber')?.value,
      dateOfBirth: this.form.get('dateOfBirth')?.value,
      enrollmentDate: this.form.get('enrollmentDate')?.value,
      isSameAddress: this.form.get('isSameAddress')?.value,
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
      classId: this.form.get('classId')?.value,
      sectionId: this.form.get('sectionId')?.value,
      guardianFirstName: this.form.get('guardianFirstName')?.value,
      guardianMiddleName: this.form.get('guardianMiddleName')?.value,
      guardianLastName: this.form.get('guardianLastName')?.value,
      guardianRelation: this.form.get('guardianRelation')?.value,
      guardianEmail: this.form.get('guardianEmail')?.value,
      guardianPhoneNumber: this.form.get('guardianPhoneNumber')?.value,
      guardianAddress: this.form.get('guardianAddress')?.value,
      remarks: this.form.get('remarks')?.value
    };

    console.log('Student DTO JSON:', JSON.stringify(studentDTO, null, 2));
    formData.append('studentData', new Blob([JSON.stringify(studentDTO)], { type: 'application/json' }));

    // Profile Picture
    if (this.profilePicture) {
      formData.append('photo', this.profilePicture);
    }

    // Documents
    this.documents.forEach((doc, index) => {
      formData.append('documents', doc.file);
      formData.append('types', doc.name);
    });

    const apiUrl = this.isEditMode 
      ? `http://localhost:8181/api/students/update/${this.editingStudentId}`
      : 'http://localhost:8181/api/students/register';

    this.http.post(apiUrl, formData).subscribe({
      next: (res) => {
        console.log('Student saved successfully:', res);
        alert(`Student ${this.isEditMode ? 'updated' : 'registered'} successfully.`);
        if (!this.isEditMode) {
          this.resetForm();
        }
      },
      error: (err) => {
        console.error('Error saving student:', err);
        alert('Error occurred during save.');
      }
    });
  }
}