import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { RadioButtonModule } from 'primeng/radiobutton';
import { InputSwitchModule } from 'primeng/inputswitch';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { FormConfig, FormField } from './form-models';

@Component({
    selector: 'app-standard-form',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        InputTextModule,
        InputNumberModule,
        DropdownModule,
        CalendarModule,
        RadioButtonModule,
        InputSwitchModule,
        TextareaModule,
        ButtonModule
    ],
    templateUrl: './standard-form.component.html',
    styleUrls: ['./standard-form.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class StandardFormComponent {
    @Input() config!: FormConfig;
    @Input() model: any = {};
    @Input() loading: boolean = false;
    @Input() activeSectionIndex = 0;

    @Output() onSubmit = new EventEmitter<any>();
    @Output() onCancel = new EventEmitter<void>();
    @Output() onReset = new EventEmitter<void>();
    @Output() sectionChange = new EventEmitter<number>();

    get visibleSections() {
        return this.config?.sections ?? [];
    }

    get isWizard(): boolean {
        return this.config?.layout === 'wizard';
    }

    get isFirstSection(): boolean {
        return this.activeSectionIndex <= 0;
    }

    get isLastSection(): boolean {
        return this.activeSectionIndex >= this.visibleSections.length - 1;
    }

    submitForm() {
        this.onSubmit.emit(this.model);
    }

    goToSection(index: number): void {
        this.activeSectionIndex = Math.max(0, Math.min(index, this.visibleSections.length - 1));
        this.sectionChange.emit(this.activeSectionIndex);
    }

    nextSection(): void {
        this.goToSection(this.activeSectionIndex + 1);
    }

    previousSection(): void {
        this.goToSection(this.activeSectionIndex - 1);
    }

    getValidationMessage(field: FormField): string {
        return field.errorMessage || `${field.label} is required.`;
    }

    cancelForm() {
        this.onCancel.emit();
    }

    resetForm() {
        this.onReset.emit();
    }
}
