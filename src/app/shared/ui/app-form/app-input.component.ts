import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  forwardRef,
  inject,
  Input
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { AppValidationMessageComponent } from './app-validation-message.component';

let nextInputId = 0;

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, FormsModule, AppValidationMessageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppInputComponent),
      multi: true
    }
  ],
  template: `
    <div class="app-field">
      <label *ngIf="label" class="app-field__label" [attr.for]="inputId">
        {{ label }}<span *ngIf="required" class="app-field__required" aria-hidden="true">*</span>
      </label>
      <input
        class="app-field__control"
        [class.is-invalid]="!!error"
        [id]="inputId"
        [type]="type"
        [placeholder]="placeholder"
        [disabled]="disabled"
        [readonly]="readonly"
        [attr.autocomplete]="autocomplete"
        [attr.inputmode]="inputMode"
        [ngModel]="value"
        (ngModelChange)="onChange($event)"
        (blur)="onTouched()"
      />
      <p *ngIf="hint && !error" class="app-field__hint">{{ hint }}</p>
      <app-validation-message [message]="error"></app-validation-message>
    </div>
  `,
  styleUrl: './app-input.component.scss'
})
export class AppInputComponent implements ControlValueAccessor {
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() label = '';
  @Input() placeholder = '';
  @Input() type: 'text' | 'email' | 'tel' | 'url' | 'password' = 'text';
  @Input() hint = '';
  @Input() error = '';
  @Input() required = false;
  @Input() disabled = false;
  @Input() readonly = false;
  @Input() autocomplete?: string;
  @Input() inputMode?: string;

  readonly inputId = `app-input-${++nextInputId}`;
  value = '';

  private onValueChange: (value: string) => void = () => undefined;
  onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    this.value = value ?? '';
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onValueChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.cdr.markForCheck();
  }

  onChange(value: string): void {
    this.value = value;
    this.onValueChange(value);
  }
}
