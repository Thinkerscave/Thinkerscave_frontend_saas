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

let nextTextareaId = 0;

@Component({
  selector: 'app-textarea',
  standalone: true,
  imports: [CommonModule, FormsModule, AppValidationMessageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppTextareaComponent),
      multi: true
    }
  ],
  template: `
    <div class="app-field">
      <label *ngIf="label" class="app-field__label" [attr.for]="textareaId">
        {{ label }}<span *ngIf="required" class="app-field__required" aria-hidden="true">*</span>
      </label>
      <div class="app-textarea-wrap" [class.has-counter]="maxLength != null">
        <textarea
          class="app-field__control app-textarea"
          [class.is-invalid]="!!error"
          [class.app-textarea--compact]="compact"
          [id]="textareaId"
          [rows]="rows"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [readonly]="readonly"
          [attr.maxlength]="maxLength"
          [ngModel]="value"
          (ngModelChange)="onChange($event)"
          (blur)="onTouched()"
        ></textarea>
        <span *ngIf="maxLength != null" class="app-textarea__counter" aria-live="polite">
          {{ value.length }} / {{ maxLength }}
        </span>
      </div>
      <p *ngIf="hint && !error" class="app-field__hint">{{ hint }}</p>
      <app-validation-message [message]="error"></app-validation-message>
    </div>
  `,
  styleUrl: './app-textarea.component.scss'
})
export class AppTextareaComponent implements ControlValueAccessor {
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() label = '';
  @Input() placeholder = '';
  @Input() hint = '';
  @Input() error = '';
  @Input() required = false;
  @Input() disabled = false;
  @Input() readonly = false;
  @Input() rows = 3;
  @Input() maxLength: number | null = null;
  @Input() compact = false;

  readonly textareaId = `app-textarea-${++nextTextareaId}`;
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
    const next = value ?? '';
    this.value = this.maxLength != null ? next.slice(0, this.maxLength) : next;
    this.onValueChange(this.value);
  }
}
