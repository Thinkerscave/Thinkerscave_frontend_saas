import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Dialog } from 'primeng/dialog';
import { AvatarModule } from 'primeng/avatar';
import { Organisation, OrganisationService } from '../../../services/organisation.service';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-edit-organization',
 imports: [ CommonModule,
    FormsModule,
    ButtonModule,
    DropdownModule,
    CalendarModule,
    InputTextModule,
    RadioButtonModule],
  templateUrl: './edit-organization.component.html',
  styleUrl: './edit-organization.component.scss',
  providers:[MessageService]
})
export class EditOrganizationComponent {
   @Input() organization!: Organisation;

  // 2. "@Output()" is the "MEGAPHONE" for sending signals back to the parent.
  @Output() updateComplete = new EventEmitter<boolean>();

  // A local copy of the data to avoid changing the original object directly
  editData: any = {};
organizationTypes: any[]|undefined;
  
  // ... (properties for dropdown options like organizationTypes, etc.)

  constructor(
    private organizationService: OrganisationService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    // When the component initializes, it makes a copy of the incoming data.
    // This is important so that changes aren't saved if the user clicks "Cancel".
    this.editData = { 
      ...this.organization, 
      establishDate: new Date(this.organization.establishDate!) 
    };
  }

  onUpdateSubmit() {
    // // ... (logic to create the payload from this.editData)
    
    // this.organizationService.updateOrganization(this.editData.orgId, payload).subscribe({
    //   next: () => {
    //     this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Organization updated!' });
    //     this.updateComplete.emit(true); // Signal SUCCESS to the parent
    //   },
    //   error: (err) => {
    //     this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update.' });
    //     this.updateComplete.emit(false); // Signal FAILURE to the parent
    //   }
    // });
  }

  cancel() {
    // When "Cancel" is clicked, just send a signal to the parent to close the dialog.
    this.updateComplete.emit(false);
  }
 visible: boolean = false;

    showDialog() {
        this.visible = true;
    }
}
