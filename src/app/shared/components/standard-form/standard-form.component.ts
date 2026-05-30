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
import { FormConfig } from './form-models';

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

    @Output() onSubmit = new EventEmitter<any>();
    @Output() onCancel = new EventEmitter<void>();
    @Output() onReset = new EventEmitter<void>();

    submitForm() {
        this.onSubmit.emit(this.model);
    }

    cancelForm() {
        this.onCancel.emit();
    }

    resetForm() {
        this.onReset.emit();
    }
}
