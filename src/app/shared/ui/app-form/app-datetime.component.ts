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
import { CalendarModule } from 'primeng/calendar';
import { AppValidationMessageComponent } from './app-validation-message.component';

export type AppDateTimeMode = 'datetime' | 'date' | 'time';

let nextDateTimeId = 0;

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Picker-only date / date-time / time field.
 *
 * The model is a string the API can bind directly:
 * - `date`: `YYYY-MM-DD`
 * - `time`: `HH:mm:ss`
 * - `datetime`: `YYYY-MM-DDTHH:mm:ss` — local wall clock, or UTC when `timezone="utc"`
 *   (for backend `LocalDateTime` columns that store UTC).
 */
@Component({
  selector: 'app-datetime',
  standalone: true,
  imports: [CommonModule, FormsModule, CalendarModule, AppValidationMessageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppDateTimeComponent),
      multi: true
    }
  ],
  template: `
    <div class="app-field app-datetime" [class.is-invalid]="!!error">
      <label *ngIf="label" class="app-field__label" [attr.for]="inputId">
        {{ label }}<span *ngIf="required" class="app-field__required" aria-hidden="true">*</span>
      </label>
      <p-calendar
        [inputId]="inputId"
        [ngModel]="date"
        (ngModelChange)="onPick($event)"
        (onClose)="onTouched()"
        (onClear)="onPick(null)"
        [showTime]="mode === 'datetime'"
        [timeOnly]="mode === 'time'"
        [hourFormat]="hourFormat"
        [stepMinute]="stepMinute"
        [minDate]="minDate"
        [maxDate]="maxDate"
        [dateFormat]="dateFormat"
        [placeholder]="placeholder || defaultPlaceholder"
        [disabled]="disabled"
        [showIcon]="true"
        [readonlyInput]="true"
        [showButtonBar]="!required"
        appendTo="body"
        styleClass="app-datetime__picker" />
      <p *ngIf="hint && !error" class="app-field__hint">{{ hint }}</p>
      <app-validation-message [message]="error"></app-validation-message>
    </div>
  `,
  styleUrl: './app-datetime.component.scss'
})
export class AppDateTimeComponent implements ControlValueAccessor {
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() label = '';
  @Input() placeholder = '';
  @Input() hint = '';
  @Input() error = '';
  @Input() required = false;
  @Input() disabled = false;
  @Input() mode: AppDateTimeMode = 'datetime';
  @Input() timezone: 'local' | 'utc' = 'local';
  @Input() minDate: Date | null = null;
  @Input() maxDate: Date | null = null;
  @Input() stepMinute = 15;
  @Input() hourFormat: '12' | '24' = '12';
  @Input() dateFormat = 'dd M yy';

  readonly inputId = `app-datetime-${++nextDateTimeId}`;
  date: Date | null = null;

  private onValueChange: (value: string) => void = () => undefined;
  onTouched: () => void = () => undefined;

  get defaultPlaceholder(): string {
    if (this.mode === 'date') return 'Select date';
    if (this.mode === 'time') return 'Select time';
    return 'Select date and time';
  }

  writeValue(value: string | Date | null): void {
    this.date = this.parse(value);
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

  onPick(value: Date | null): void {
    this.date = value;
    this.onValueChange(value ? this.format(value) : '');
  }

  private format(d: Date): string {
    const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
    if (this.mode === 'date') return date;
    if (this.mode === 'time') return time;
    if (this.timezone === 'utc') {
      const utc = new Date(d);
      utc.setSeconds(0, 0);
      return utc.toISOString().slice(0, 19);
    }
    return `${date}T${time}`;
  }

  private parse(value: string | Date | null): Date | null {
    if (!value) return null;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
    const text = String(value).trim();
    let parsed: Date;
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      const [y, m, d] = text.split('-').map(Number);
      parsed = new Date(y, m - 1, d);
    } else if (/^\d{2}:\d{2}(:\d{2})?$/.test(text)) {
      const [h, min] = text.split(':').map(Number);
      parsed = new Date();
      parsed.setHours(h, min, 0, 0);
    } else if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(text)) {
      parsed = new Date(text);
    } else {
      parsed = new Date(this.timezone === 'utc' ? `${text}Z` : text);
    }
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
}
