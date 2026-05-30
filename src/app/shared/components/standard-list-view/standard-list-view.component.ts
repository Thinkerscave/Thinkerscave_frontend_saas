import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { BulkActionEvent, ListViewConfig, PageRequestParams, ListViewAction, ListViewBulkAction, ListViewColumn } from './list-view-models';
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
  styleUrl: './standard-list-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StandardListViewComponent implements OnChanges {
  @Input() config!: ListViewConfig;
  @Input() data: any[] = [];

  @ViewChild('dt') table?: Table;

  @Output() onLoadData = new EventEmitter<PageRequestParams>();
  @Output() onSearch = new EventEmitter<string>();
  @Output() onBulkAction = new EventEmitter<BulkActionEvent>();

  globalFilter: string = '';
  selectedRows: any[] = [];
  columnPanelOpen = false;
  private visibleColumnFields = new Set<string>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config'] && this.config?.columns?.length) {
      this.visibleColumnFields = new Set(
        this.config.columns
          .filter(column => !column.hidden)
          .map(column => column.field)
      );
    }
  }

  get primaryRowActions() {
    return this.config?.rowActions?.filter(a => a.isPrimary) || [];
  }

  get secondaryRowActions() {
    return this.config?.rowActions?.filter(a => !a.isPrimary) || [];
  }

  get visibleColumns(): ListViewColumn[] {
    return this.config?.columns?.filter(column => this.visibleColumnFields.has(column.field)) || [];
  }

  get globalFilterFields(): string[] {
    return this.visibleColumns
      ?.filter(column => column.field && column.type !== 'custom')
      .map(column => column.field) || [];
  }

  get loadingRows(): number[] {
    const rowCount = Math.min(this.config?.loadingRows || this.config?.rows || 5, 10);
    return Array.from({ length: rowCount }, (_, index) => index);
  }

  get emptyColspan(): number {
    return (this.visibleColumns?.length || 1)
      + (this.config?.enableBulkSelection ? 1 : 0)
      + (this.config?.rowActions?.length ? 1 : 0);
  }

  get hasSelectedRows(): boolean {
    return this.selectedRows.length > 0;
  }

  get availableBulkActions(): ListViewBulkAction[] {
    return this.config?.bulkActions
      ?.filter(action => !action.visibleFn || action.visibleFn(this.selectedRows)) || [];
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

  isColumnVisible(column: ListViewColumn): boolean {
    return this.visibleColumnFields.has(column.field);
  }

  toggleColumn(field: string): void {
    if (this.visibleColumnFields.has(field)) {
      if (this.visibleColumnFields.size > 1) {
        this.visibleColumnFields.delete(field);
      }
      return;
    }

    this.visibleColumnFields.add(field);
  }

  runBulkAction(action: ListViewBulkAction): void {
    const items = [...this.selectedRows];
    action.actionFn(items);
    this.onBulkAction.emit({ action, items });
  }

  clearSelection(): void {
    this.selectedRows = [];
  }

  exportCsv(): void {
    const columns = this.visibleColumns.filter(column => column.type !== 'custom' && column.exportable !== false);
    const fileName = this.config?.exportFileName || this.toSafeFileName(this.config?.title || 'records');
    const rows = this.data ?? [];
    const csv = [
      columns.map(column => this.escapeCsv(column.header)).join(','),
      ...rows.map(item => columns.map(column => this.escapeCsv(this.getExportValue(item, column))).join(','))
    ].join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.csv`;
    link.click();
    URL.revokeObjectURL(url);
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

  private getExportValue(item: any, column: ListViewColumn): string {
    if (column.type === 'tags') {
      return this.getTagsData(item, column).join('; ');
    }

    const value = this.getCellData(item, column);
    if (value instanceof Date) {
      return value.toISOString();
    }

    return value === null || value === undefined ? '' : String(value);
  }

  private escapeCsv(value: string): string {
    return `"${value.replace(/"/g, '""')}"`;
  }

  private toSafeFileName(value: string): string {
    return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'records';
  }
}
