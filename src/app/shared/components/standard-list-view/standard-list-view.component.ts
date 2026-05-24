import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { ListViewConfig, PageRequestParams, ListViewAction, ListViewColumn } from './list-view-models';
import { normalizePrimeIcon } from '../../utils/prime-icon.util';

@Component({
  selector: 'app-standard-list-view',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    TooltipModule,
    MenuModule
  ],
  templateUrl: './standard-list-view.component.html',
  styleUrl: './standard-list-view.component.scss'
})
export class StandardListViewComponent {
  @Input() config!: ListViewConfig;
  @Input() data: any[] = [];

  @ViewChild('dt') table?: Table;

  @Output() onLoadData = new EventEmitter<PageRequestParams>();
  @Output() onSearch = new EventEmitter<string>();

  globalFilter: string = '';

  get primaryRowActions() {
    return this.config?.rowActions?.filter(a => a.isPrimary) || [];
  }

  get secondaryRowActions() {
    return this.config?.rowActions?.filter(a => !a.isPrimary) || [];
  }

  get globalFilterFields(): string[] {
    return this.config?.columns
      ?.filter(column => column.field && column.type !== 'custom')
      .map(column => column.field) || [];
  }

  getMenuModel(item: any, actions: ListViewAction[]): MenuItem[] {
    return actions
      .filter(action => !action.visibleFn || action.visibleFn(item))
      .map(action => ({
        label: action.label,
        icon: action.icon || '',
        command: () => action.actionFn(item)
      }));
  }

  onLazyLoad(event: any) {
    if (!this.config?.isClientSide) {
      this.onLoadData.emit({
        first: event.first,
        rows: event.rows,
        sortField: event.sortField,
        sortOrder: event.sortOrder,
        globalFilter: this.globalFilter
      });
    }
  }

  onSearchChange() {
    this.table?.filterGlobal(this.globalFilter, 'contains');
    this.onSearch.emit(this.globalFilter);
  }

  getCellData(item: any, col: any): any {
    if (col.valueGetter) {
      return col.valueGetter(item);
    }
    return item[col.field];
  }

  getBadgeSeverity(value: any): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast' | undefined {
    // Basic heuristics, can be overridden by a valueGetter or custom col type in the future
    if (typeof value === 'boolean') return value ? 'success' : 'danger';
    const str = String(value || '').toLowerCase();
    if (str.includes('active') || str.includes('success') || str.includes('approved')) return 'success';
    if (str.includes('inactive') || str.includes('fail') || str.includes('error') || str.includes('reject')) return 'danger';
    if (str.includes('pending') || str.includes('wait')) return 'warning';
    return 'info';
  }

  getTagsData(item: any, col: ListViewColumn): string[] {
    if (col.tagsGetter) return col.tagsGetter(item);
    if (item[col.field] && Array.isArray(item[col.field])) return item[col.field];
    return [];
  }

  getIconClass(item: any, col: ListViewColumn): string {
    return normalizePrimeIcon(this.getCellData(item, col), 'pi pi-circle');
  }
}
