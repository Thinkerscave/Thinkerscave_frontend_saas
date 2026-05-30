export type FieldType = 'text' | 'number' | 'email' | 'password' | 'phone' | 'dropdown' | 'search-select' | 'calendar' | 'date' | 'textarea' | 'upload' | 'radio' | 'switch';

export interface FormField {
    field: string;
    label: string;
    type: FieldType;
    placeholder?: string;
    required?: boolean;
    options?: any[]; // For dropdown/radio
    optionLabel?: string;
    optionValue?: string;
    accept?: string;
    multiple?: boolean;
    colSpan?: string; // e.g. 'col-6' or 'md:col-4'
    validation?: any;
    helperText?: string;
    errorMessage?: string;
    visibleFn?: (data: any) => boolean;
}

export interface FormSection {
    title: string;
    description?: string;
    fields: FormField[];
}

export interface FormConfig {
    sections: FormSection[];
    layout?: 'standard' | 'wizard';
    density?: 'compact' | 'comfortable';
    stickyActions?: boolean;
    submitLabel?: string;
    cancelLabel?: string;
    resetLabel?: string;
    nextLabel?: string;
    previousLabel?: string;
}
