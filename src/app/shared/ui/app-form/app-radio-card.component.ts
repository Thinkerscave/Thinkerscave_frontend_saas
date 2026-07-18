import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  forwardRef,
  inject,
  Input
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { AppValidationMessageComponent } from './app-validation-message.component';

let nextRadioGroupId = 0;

@Component({
  selector: 'app-radio-card',
  standalone: true,
  imports: [CommonModule, AppValidationMessageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppRadioCardComponent),
      multi: true
    }
  ],
  template: `
    <div class="app-radio-card-group" [class.is-invalid]="!!error">
      <label *ngIf="label" class="app-field__label">
        {{ label }}<span *ngIf="required" class="app-field__required" aria-hidden="true">*</span>
      </label>

      <div class="app-radio-card-group__options" role="radiogroup" [attr.aria-label]="label || null">
        <button
          type="button"
          *ngFor="let option of options"
          class="app-radio-card"
          role="radio"
          [class.is-selected]="value === option.value"
          [class.is-disabled]="disabled || option.disabled"
          [attr.aria-checked]="value === option.value"
          [disabled]="disabled || option.disabled"
          (click)="select(option.value)">
          <span class="app-radio-card__indicator" aria-hidden="true"></span>
          <span class="app-radio-card__body">
            <span class="app-radio-card__title-row">
              <i *ngIf="option.icon" [class]="option.icon" class="app-radio-card__icon" aria-hidden="true"></i>
              <strong class="app-radio-card__title">{{ option.title }}</strong>
            </span>
            <small *ngIf="option.description" class="app-radio-card__description">{{ option.description }}</small>
          </span>
        </button>
      </div>

      <p *ngIf="hint && !error" class="app-field__hint">{{ hint }}</p>
      <app-validation-message [message]="error"></app-validation-message>
    </div>
  `,
  styleUrl: './app-radio-card.component.scss'
})
export class AppRadioCardComponent implements ControlValueAccessor {
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() label = '';
  @Input() hint = '';
  @Input() error = '';
  @Input() required = false;
  @Input() disabled = false;
  @Input() options: AppRadioCardOption[] = [];

  readonly groupName = `app-radio-card-${++nextRadioGroupId}`;
  value: string | null = null;

  private onValueChange: (value: string | null) => void = () => undefined;
  onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    this.value = value;
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onValueChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.cdr.markForCheck();
  }

  select(next: string): void {
    if (this.disabled) return;
    this.value = next;
    this.onValueChange(next);
    this.onTouched();
    this.cdr.markForCheck();
  }
}

export interface AppRadioCardOption {
  value: string;
  title: string;
  description?: string;
  icon?: string;
  disabled?: boolean;
}
