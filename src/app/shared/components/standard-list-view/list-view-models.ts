export interface ListViewColumn {
    field: string;
    header: string;
    type: 'text' | 'date' | 'number' | 'badge' | 'tags' | 'boolean' | 'custom';
    sortable?: boolean;
    width?: string;
    align?: 'left' | 'center' | 'right';
    // For custom types, the host can pass a template or handle formatting
    valueGetter?: (item: any) => string;
    tagsGetter?: (item: any) => string[]; // Array of strings to render as tags
}

export interface ListViewAction {
    label: string;
    icon?: string;
    color?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'danger';
    isPrimary?: boolean; // Determines if it's shown as a standalone button or in a menu
    actionFn: (item: any) => void;
    visibleFn?: (item: any) => boolean; // Role-based or data-based visibility
    requiresConfirmation?: boolean;
    confirmationMessage?: string;
}

export interface ListViewGlobalAction {
    label: string;
    icon?: string;
    color?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'danger';
    actionFn: () => void;
    visibleFn?: () => boolean;
}

export interface ListViewConfig {
    title: string;
    subtitle?: string;
    columns: ListViewColumn[];
    rowActions?: ListViewAction[];
    primaryAction?: ListViewGlobalAction;
    secondaryActions?: ListViewGlobalAction[];

    // Settings
    showSearch?: boolean;
    searchPlaceholder?: string;

    // Pagination & Loading
    loading?: boolean;
    isClientSide?: boolean; // Whether to slice data client-side, helpful for migration Phase 1
    totalRecords?: number;
    rows?: number;
    rowsPerPageOptions?: number[];

    // Future enhancements: Bulk actions, filters, etc.
}

export interface PageRequestParams {
    first: number;
    rows: number;
    sortField?: string;
    sortOrder?: number;
    globalFilter?: string;
}
