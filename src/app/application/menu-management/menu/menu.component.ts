import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms'; // Required for ngModel

import { TabViewModule } from 'primeng/tabview'; // Import TabViewModule
import { RadioButtonModule } from 'primeng/radiobutton'; // Import RadioButtonModule
import { CommonModule } from '@angular/common';
import { FieldsetModule } from 'primeng/fieldset';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule, Toast } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { FloatLabelModule } from 'primeng/floatlabel';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputSwitchModule } from 'primeng/inputswitch';
import { MenuService, MenuItem } from '../../services/menu.service';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

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
    CardModule,
    ToastModule,
    InputSwitchModule,
    IconFieldModule,
    InputIconModule
  ],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss',
  providers: [MessageService]
})
export class MenuComponent {
  title = '';
  menuItems: MenuItem[] = [];
  loading: boolean = false;
  isEditMode: boolean = false;
  activeTabIndex: number = 0;
  editMenuId: number | null = null;
  displayEditModal: boolean = false;
  editingMenuItem: MenuItem | null = null;
  currentMessage: { severity: 'success' | 'info' | 'warn' | 'error', summary: string, detail: string } | null = null;

  constructor(private menuService: MenuService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.loadMenus();
  }

  loadMenus(): void {
    this.loading = true;
    this.menuService.getAllMenus().subscribe({
      next: (menus) => {
        this.menuItems = menus;
        this.loading = false;
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load menus. Please try again.'
        });
        this.loading = false;
      }
    });
  }

  submit(): void {
    if (!this.menuName || !this.menuDescription) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Failed',
        detail: 'Both Menu Name and Description are required.'
      });
      return;
    }

    const menuData: MenuItem = {
      slNo: this.editMenuId || undefined,
      menuCode: this.isEditMode ? this.editingMenuItem?.menuCode : undefined, // ✅ include menuCode
      name: this.menuName.trim(),
      description: this.menuDescription.trim()
    };



    this.menuService.saveMenu(menuData).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: this.isEditMode ? 'Menu Updated' : 'Menu Created',
          detail: `'${menuData.name}' has been ${this.isEditMode ? 'updated' : 'added'} successfully.`
        });

        this.loadMenus();   // reload list
        this.clearForm();
        this.isEditMode = false;
        this.activeTabIndex = 1;  // go back to View tab
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Failed to save menu. Try again later.'
        });
      }
    });
  }


  onEdit(menuItem: MenuItem): void {
    this.isEditMode = true;
    this.activeTabIndex = 0;  // switch to first tab (form tab)

    this.editMenuId = menuItem.slNo || null;
    this.menuName = menuItem.name;
    this.menuDescription = menuItem.description;

    // ✅ Keep menuCode for update
    this.editingMenuItem = { ...menuItem };
  }


  selectedGroupOption: string = 'Yes'; // Default to 'Yes'
  menuName: string = '';
  menuDescription: string = '';

  // submit(): void {
  //   console.log('Menu Submitted:', this.menuName, this.menuDescription);
  //   this.clearForm();
  // }

  resetForm(): void {
    console.log('Menu Creation Cancelled');
    this.clearForm();
  }

  clearForm(): void {
    this.menuName = '';
    this.menuDescription = '';
  }

  cancelEdit(): void {

  }

  toggleStatus(menuItem: MenuItem): void {
    if (!menuItem.menuCode) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Invalid Menu',
        detail: 'Menu code is missing, cannot update status.'
      });
      return;
    }

    this.menuService.updateStatus(menuItem.menuCode, menuItem.isActive ?? false).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Status Updated',
          detail: `Menu '${menuItem.name}' is now ${menuItem.isActive ? 'Active' : 'Inactive'}.`
        });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update status.' });
        menuItem.isActive = !menuItem.isActive; // revert UI
      }
    });
  }

}
