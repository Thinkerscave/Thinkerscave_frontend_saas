import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

// Import PrimeNG Standalone Modules
import { CommonModule } from '@angular/common';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { FileUploadModule } from 'primeng/fileupload';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { HttpClientModule } from '@angular/common/http';


@Component({
  selector: 'app-sub-menu',
  imports: [CommonModule,
    ReactiveFormsModule,
    DropdownModule,
    InputTextModule,
    FileUploadModule,
    ButtonModule,HttpClientModule,
    ToastModule],
  templateUrl: './sub-menu.component.html',
  styleUrl: './sub-menu.component.scss'
})
export class SubMenuComponent {
  @Input() isEditMode: boolean = false;
  @Input() submenuData: any = null; // To pre-fill the form in edit mode

  submenuForm!: FormGroup;
  parentMenus: any[] = []; // This would be populated by a service call

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    // Mock data for parent menus dropdown.
    this.parentMenus = [
      { name: 'Dashboard', id: 1 },
      { name: 'Academics', id: 2 },
      { name: 'Human Resources', id: 3 },
      { name: 'Finance', id: 4 }
    ];

    this.submenuForm = this.fb.group({
      menuId: [null, [Validators.required]],
      submenuName: ['', [Validators.required]],
      submenuCode: [{ value: '', disabled: true }], // Always disabled
      submenuDescription: [''],
      submenuUrl: ['', [Validators.required]],
      submenuLogo: [null]
    });

    // If in edit mode, patch the form with existing data
    if (this.isEditMode && this.submenuData) {
      this.submenuForm.patchValue(this.submenuData);
    }
  }

  onLogoUpload(event: any) {
    // Handle the file upload logic
    const file = event.files[0];
    this.submenuForm.patchValue({ submenuLogo: file });
    this.submenuForm.get('submenuLogo')?.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.submenuForm.invalid) {
      // You can add a simple console log for validation feedback
      console.warn('Form is invalid. Please fill all required fields.');
      return;
    }

    // Use FormData to send form values + file to a server
    const formData = new FormData();
    Object.keys(this.submenuForm.controls).forEach(key => {
      formData.append(key, this.submenuForm.get(key)?.value);
    });

    console.log('Form Submitted:', this.submenuForm.value);

    // Here you would typically call an API service
    // e.g., this.apiService.saveSubmenu(formData).subscribe(...)
  }
}
