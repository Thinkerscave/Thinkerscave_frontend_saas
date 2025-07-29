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
import { DialogModule } from 'primeng/dialog';
interface MenuItem {
  slNo: number;
  name: string;
  description: string;
}
@Component({
  selector: 'app-menu',
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
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
  displayEditModal: boolean = false;
  editingMenuItem: MenuItem | null = null;
  // For displaying messages within the component
  currentMessage: { severity: 'success' | 'info' | 'warn' | 'error', summary: string, detail: string } | null = null;

  constructor() { } // No service injections

  ngOnInit(): void {
    this.loadDummyData();
  }

  loadDummyData(): void {
    // Static dummy data
    this.menuItems = [
      { slNo: 1, name: 'Dashboard', description: 'dashboarddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd' },
      { slNo: 2, name: 'User Management', description: 'user management' },
      { slNo: 3, name: 'Product Catalog', description: 'product catalog' },
      { slNo: 4, name: 'Order Processing', description: 'order processing' },
      { slNo: 5, name: 'Analytics Reports', description: 'analytics report' },
      { slNo: 6, name: 'Settings', description: 'settings' },
      { slNo: 7, name: 'Notifications', description: 'notification' },
      { slNo: 8, name: 'Reports', description: 'report' },
      { slNo: 9, name: 'Help & Support', description: 'help and support' },
      { slNo: 10, name: 'Logout', description: 'logout' },
    ];
  }

  onEdit(menuItem: MenuItem) {
    // Create a copy of the menu item to avoid modifying the original data directly
    this.editingMenuItem = { ...menuItem };
    // Show the dialog
    this.displayEditModal = true;
  }
  onSave() {
    if (this.editingMenuItem) {
      // Find the index of the item to update in the main array
      const index = this.menuItems.findIndex(item => item.slNo === this.editingMenuItem!.slNo);
      if (index !== -1) {
        // Update the item in the array with the edited data
        this.menuItems[index] = this.editingMenuItem;
      }

      // Here you would typically also call a service to save the changes to the backend
      console.log('Saving:', this.editingMenuItem);

      // Hide the dialog
      this.displayEditModal = false;
      this.editingMenuItem = null;
    }
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
