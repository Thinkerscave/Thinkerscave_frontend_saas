export type FieldType = 'text' | 'number' | 'email' | 'password' | 'dropdown' | 'calendar' | 'textarea' | 'radio' | 'switch';

export interface FormField {
    field: string;
    label: string;
    type: FieldType;
    placeholder?: string;
    required?: boolean;
    options?: any[]; // For dropdown/radio
    optionLabel?: string;
    optionValue?: string;
    colSpan?: string; // e.g. 'col-6' or 'md:col-4'
    validation?: any;
    helperText?: string;
    visibleFn?: (data: any) => boolean;
}

export interface FormSection {
    title: string;
    description?: string;
    fields: FormField[];
}

export interface FormConfig {
    sections: FormSection[];
    submitLabel?: string;
    cancelLabel?: string;
    resetLabel?: string;
}
