import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewChild,
  forwardRef,
  inject
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { AppValidationMessageComponent } from './app-validation-message.component';

export interface PhoneCountryOption {
  code: string;
  dialCode: string;
  flag: string;
  label: string;
  minLength: number;
  maxLength: number;
}

const DEFAULT_COUNTRIES: PhoneCountryOption[] = [
  { code: 'IN', dialCode: '+91', flag: '🇮🇳', label: 'India', minLength: 10, maxLength: 10 },
  { code: 'US', dialCode: '+1', flag: '🇺🇸', label: 'United States', minLength: 10, maxLength: 10 },
  { code: 'GB', dialCode: '+44', flag: '🇬🇧', label: 'United Kingdom', minLength: 10, maxLength: 11 },
  { code: 'AE', dialCode: '+971', flag: '🇦🇪', label: 'UAE', minLength: 9, maxLength: 9 },
  { code: 'SG', dialCode: '+65', flag: '🇸🇬', label: 'Singapore', minLength: 8, maxLength: 8 },
  { code: 'AU', dialCode: '+61', flag: '🇦🇺', label: 'Australia', minLength: 9, maxLength: 9 }
];

const CONTROL_KEYS = new Set([
  'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
  'Home', 'End'
]);

let nextPhoneId = 0;

function matchCountry(value: string, countries: PhoneCountryOption[]): PhoneCountryOption | undefined {
  return countries
    .slice()
    .sort((a, b) => b.dialCode.length - a.dialCode.length)
    .find(c => value.startsWith(c.dialCode));
}

export function phoneErrorMessage(
  value: string,
  countries: PhoneCountryOption[] = DEFAULT_COUNTRIES
): string | null {
  const trimmed = (value ?? '').trim();
  if (!trimmed) return 'Mobile number is required.';
  if (/[A-Za-z]/.test(trimmed) || /[^+\d]/.test(trimmed)) {
    return 'Enter a valid mobile number. Only digits are allowed.';
  }

  const country = matchCountry(trimmed, countries) ?? countries[0];
  const national = trimmed.startsWith(country.dialCode)
    ? trimmed.slice(country.dialCode.length).replace(/\D/g, '')
    : trimmed.replace(/\D/g, '');

  if (!national) return 'Mobile number is required.';
  if (country.code === 'IN') {
    return /^[6-9]\d{9}$/.test(national) ? null : 'Enter a valid 10-digit mobile number.';
  }
  if (national.length < country.minLength || national.length > country.maxLength) {
    const lengthLabel = country.minLength === country.maxLength
      ? `${country.minLength}-digit`
      : `${country.minLength}–${country.maxLength} digit`;
    return `Enter a valid ${lengthLabel} mobile number.`;
  }
  return null;
}

@Component({
  selector: 'app-phone-input',
  standalone: true,
  imports: [CommonModule, AppValidationMessageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppPhoneInputComponent),
      multi: true
    }
  ],
  template: `
    <div class="app-field" #root>
      <label *ngIf="label" class="app-field__label" [attr.for]="inputId">
        {{ label }}<span *ngIf="required" class="app-field__required" aria-hidden="true">*</span>
      </label>

      <div class="app-phone" [class.is-invalid]="!!displayError" [class.is-open]="menuOpen" [class.is-disabled]="disabled">
        <button
          type="button"
          class="app-phone__country"
          [disabled]="disabled"
          [attr.aria-expanded]="menuOpen"
          aria-haspopup="listbox"
          (click)="toggleMenu()">
          <span class="app-phone__flag" aria-hidden="true">{{ selected.flag }}</span>
          <span class="app-phone__dial">{{ selected.dialCode }}</span>
          <i class="pi pi-chevron-down app-phone__chevron" aria-hidden="true"></i>
        </button>

        <input
          #phoneField
          class="app-phone__control"
          [id]="inputId"
          type="tel"
          inputmode="numeric"
          pattern="[0-9]*"
          autocomplete="tel-national"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [attr.maxlength]="selected.maxLength"
          [value]="nationalNumber"
          (keydown)="onNationalKeydown($event)"
          (paste)="onNationalPaste($event)"
          (input)="onNationalInput($event)"
          (blur)="onBlur()"
        />

        <ul *ngIf="menuOpen" class="app-phone__menu" role="listbox">
          <li
            *ngFor="let country of countries"
            role="option"
            [attr.aria-selected]="country.code === selected.code"
            class="app-phone__option"
            [class.is-active]="country.code === selected.code"
            (click)="selectCountry(country)">
            <span class="app-phone__flag" aria-hidden="true">{{ country.flag }}</span>
            <span class="app-phone__option-label">{{ country.label }}</span>
            <span class="app-phone__option-dial">{{ country.dialCode }}</span>
          </li>
        </ul>
      </div>

      <app-validation-message [message]="displayError"></app-validation-message>
    </div>
  `,
  styleUrl: './app-phone-input.component.scss'
})
export class AppPhoneInputComponent implements ControlValueAccessor {
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('root') root?: ElementRef<HTMLElement>;
  @ViewChild('phoneField') phoneField?: ElementRef<HTMLInputElement>;

  @Input() label = '';
  @Input() placeholder = 'Enter mobile number';
  @Input() error = '';
  @Input() required = false;
  @Input() disabled = false;
  @Input() countries: PhoneCountryOption[] = DEFAULT_COUNTRIES;
  @Output() blurred = new EventEmitter<void>();

  readonly inputId = `app-phone-${++nextPhoneId}`;

  selected: PhoneCountryOption = DEFAULT_COUNTRIES[0];
  nationalNumber = '';
  menuOpen = false;
  inputError = '';

  private onValueChange: (value: string) => void = () => undefined;
  onTouched: () => void = () => undefined;

  get displayError(): string {
    return this.error || this.inputError;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.menuOpen) return;
    const target = event.target as Node;
    if (this.root?.nativeElement.contains(target)) return;
    this.menuOpen = false;
    this.cdr.markForCheck();
  }

  writeValue(value: string | null): void {
    this.parseValue(value ?? '');
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

  toggleMenu(): void {
    if (this.disabled) return;
    this.menuOpen = !this.menuOpen;
    this.cdr.markForCheck();
  }

  selectCountry(country: PhoneCountryOption): void {
    this.selected = country;
    this.nationalNumber = this.nationalNumber.slice(0, country.maxLength);
    this.menuOpen = false;
    this.emitValue();
    this.syncInput();
    this.cdr.markForCheck();
  }

  onNationalKeydown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (CONTROL_KEYS.has(event.key)) return;
    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
      this.inputError = 'Enter a valid mobile number. Only digits are allowed.';
      this.cdr.markForCheck();
    }
  }

  onNationalPaste(event: ClipboardEvent): void {
    event.preventDefault();
    this.applyNational(event.clipboardData?.getData('text') ?? '');
  }

  onNationalInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.applyNational(target.value ?? '');
  }

  onBlur(): void {
    this.onTouched();
    this.blurred.emit();
  }

  private applyNational(raw: string): void {
    const hadInvalid = /[^\d]/.test(raw ?? '');
    const digits = (raw ?? '').replace(/\D/g, '').slice(0, this.selected.maxLength);
    this.nationalNumber = digits;
    this.inputError = hadInvalid ? 'Enter a valid mobile number. Only digits are allowed.' : '';
    this.emitValue();
    this.syncInput();
    this.cdr.markForCheck();
  }

  private syncInput(): void {
    const el = this.phoneField?.nativeElement;
    if (el && el.value !== this.nationalNumber) {
      el.value = this.nationalNumber;
    }
  }

  private parseValue(value: string): void {
    const trimmed = value.trim();
    if (!trimmed) {
      this.nationalNumber = '';
      return;
    }

    const match = matchCountry(trimmed, this.countries);
    if (match) {
      this.selected = match;
      this.nationalNumber = trimmed.slice(match.dialCode.length).replace(/\D/g, '').slice(0, match.maxLength);
      return;
    }

    this.nationalNumber = trimmed.replace(/\D/g, '').slice(0, this.selected.maxLength);
  }

  private emitValue(): void {
    const digits = this.nationalNumber.trim();
    const next = digits ? `${this.selected.dialCode}${digits}` : '';
    this.onValueChange(next);
  }
}
