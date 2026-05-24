import { Component } from '@angular/core';
import { DragDropModule } from 'primeng/dragdrop';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { OrderListModule } from 'primeng/orderlist';
import { SelectModule } from 'primeng/select';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { MenuOrder, MenuSequenceService } from '../../services/menu-sequence.service';
import { MenuMappingService } from '../../services/menu-mapping.service';

@Component({
  selector: 'app-menu-sequence',
  imports: [DragDropModule, CardModule, ButtonModule, OrderListModule, SelectModule, CommonModule, FormsModule, ToastModule],
  templateUrl: './menu-sequence.component.html',
  styleUrl: './menu-sequence.component.scss',
  providers: [MessageService]
})
export class MenuSequenceComponent {
  menus: MenuOrder[] = [];
  selectedSubmenus: any[] = [];
  activeMenuId: number | null = null;

  constructor(
    private menuSeqService: MenuSequenceService,
    private menuMappingService: MenuMappingService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.loadMenus();
  }

  loadMenus() {
    this.menuSeqService.getMenuSequence().subscribe(data => {
      this.menus = data || [];
      if (this.menus.length > 0) {
        this.onMenuClick(this.menus[0]);
      }
    });
  }

  onMenuClick(menu: MenuOrder) {
    this.activeMenuId = menu.menuId;
    this.selectedSubmenus = [...menu.subMenus];
  }

  onMenuReorder() {
    this.menus.forEach((menu, index) => (menu.menuOrder = index + 1));
  }

  onSubMenuReorder() {
    this.selectedSubmenus.forEach((submenu, index) => (submenu.subMenuOrder = index + 1));
    const activeMenu = this.menus.find(m => m.menuId === this.activeMenuId);
    if (activeMenu) {
      activeMenu.subMenus = [...this.selectedSubmenus];
    }
  }

  submitOrder() {
    this.menuSeqService.saveMenuSequence(this.menus).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Order Saved', detail: 'Menu and sub-menu order updated successfully.' });
        this.menuMappingService.refreshMenu();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save menu order.' });
      }
    });
  }
}
