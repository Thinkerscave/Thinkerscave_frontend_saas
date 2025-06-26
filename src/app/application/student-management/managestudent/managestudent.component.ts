import { Component, NgModule } from '@angular/core';
import { Tab, TabsModule } from 'primeng/tabs';
import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';
import { FormsModule, NgModel } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FileUploaderComponent } from '../file-uploader/file-uploader.component';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ViewStudentsComponent } from '../view-students/view-students.component';
interface State {
  name: string;
}

@Component({
  selector: 'app-managestudent',
  imports: [ViewStudentsComponent, TabsModule, Tab, AccordionModule, HttpClientModule, ButtonModule, FileUploaderComponent, CommonModule, FormsModule],
  templateUrl: './managestudent.component.html',
  styleUrl: './managestudent.component.scss'
})
export class ManagestudentComponent {
  // This ensures the *ngFor loop has something to render on load.

  states: State[];
  selectedState: string = " ";
  constructor() {
    this.states = [
      { name: 'Andhra Pradesh' },
      { name: 'Arunachal Pradesh' },
      { name: 'Assam' },
      { name: 'Bihar' },
      { name: 'Chhattisgarh' },
      { name: 'Goa' },
      { name: 'Gujarat' },
      { name: 'Haryana' },
      { name: 'Himachal Pradesh' },
      { name: 'Jharkhand' },
      { name: 'Karnataka' },
      { name: 'Kerala' },
      { name: 'Madhya Pradesh' },
      { name: 'Maharashtra' },
      { name: 'Manipur' },
      { name: 'Meghalaya' },
      { name: 'Mizoram' },
      { name: 'Nagaland' },
      { name: 'Odisha' },
      { name: 'Punjab' },
      { name: 'Rajasthan' },
      { name: 'Sikkim' },
      { name: 'Tamil Nadu' },
      { name: 'Telangana' },
      { name: 'Tripura' },
      { name: 'Uttar Pradesh' },
      { name: 'Uttarakhand' },
      { name: 'West Bengal' },
      { name: 'Andaman and Nicobar Islands' },
      { name: 'Chandigarh' },
      { name: 'Dadra and Nagar Haveli and Daman and Diu' },
      { name: 'Delhi' },
      { name: 'Jammu and Kashmir' },
      { name: 'Ladakh' },
      { name: 'Lakshadweep' },
      { name: 'Puducherry' }
    ];
  }
  
}

