import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms'; // Required for ngModel

import { TabViewModule } from 'primeng/tabview'; // Import TabViewModule
import { RadioButtonModule } from 'primeng/radiobutton'; // Import RadioButtonModule
import { CommonModule } from '@angular/common';
import { FieldsetModule } from 'primeng/fieldset';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { FloatLabelModule } from 'primeng/floatlabel';
import { CardModule } from 'primeng/card';
interface MenuItem {
  slNo: number;
  name: string;
}
@Component({
  selector: 'app-menu',
  imports: [
    CommonModule,
    FormsModule,
    TabViewModule,
    RadioButtonModule,
    FieldsetModule,
     CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TooltipModule,
    FloatLabelModule,
    CardModule
  ],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent {
  title = '';
  menuItems: MenuItem[] = []; // Array to hold your menu data

  // For displaying messages within the component
  currentMessage: { severity: 'success' | 'info' | 'warn' | 'error', summary: string, detail: string } | null = null;

  constructor() { } // No service injections

  ngOnInit(): void {
    this.loadDummyData();
  }

  loadDummyData(): void {
    // Static dummy data
    this.menuItems = [
      { slNo: 1, name: 'Dashboard' },
      { slNo: 2, name: 'User Management' },
      { slNo: 3, name: 'Product Catalog' },
      { slNo: 4, name: 'Order Processing' },
      { slNo: 5, name: 'Analytics Reports' },
      { slNo: 6, name: 'Settings' },
      { slNo: 7, name: 'Notifications' },
      { slNo: 8, name: 'Reports' },
      { slNo: 9, name: 'Help & Support' },
      { slNo: 10, name: 'Logout' },
    ];
  }

  onEdit(menuItem: MenuItem): void {
    this.currentMessage = {
      severity: 'info',
      summary: 'Edit Clicked',
      detail: `Initiating edit for: ${menuItem.name}`
    };
    console.log('Edit clicked for:', menuItem);

    // Simulate clearing the message after a short delay
    setTimeout(() => {
      this.currentMessage = null;
    }, 3000);
  }

  onDelete(menuItem: MenuItem): void {
    // Use standard browser confirmation dialog
    const confirmed = window.confirm(`Are you sure you want to delete '${menuItem.name}'?`);

    if (confirmed) {
      // User confirmed deletion
      this.currentMessage = {
        severity: 'success',
        summary: 'Confirmed',
        detail: `'${menuItem.name}' deleted successfully.`
      };
      // Filter out the deleted item from the local array
      this.menuItems = this.menuItems.filter(item => item.slNo !== menuItem.slNo);
      console.log('Deleted:', menuItem);
    } else {
      // User rejected deletion
      this.currentMessage = {
        severity: 'info',
        summary: 'Rejected',
        detail: 'Deletion cancelled.'
      };
    }

    // Simulate clearing the message after a short delay
    setTimeout(() => {
      this.currentMessage = null;
    }, 3000);
  }
  selectedGroupOption: string = 'Yes'; // Default to 'Yes'
  menuName: string = '';
  menuDescription: string = '';

  submit(): void {
    console.log('Menu Submitted:', this.menuName, this.menuDescription);
    this.clearForm();
  }

  cancel(): void {
    console.log('Menu Creation Cancelled');
    this.clearForm();
  }

  clearForm(): void {
    this.menuName = '';
    this.menuDescription = '';
  }
}
