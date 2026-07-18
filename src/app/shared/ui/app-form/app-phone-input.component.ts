import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Input,
  ViewChild,
  forwardRef,
  inject
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
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

let nextPhoneId = 0;

@Component({
  selector: 'app-phone-input',
  standalone: true,
  imports: [CommonModule, FormsModule, AppValidationMessageComponent],
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

      <div class="app-phone" [class.is-invalid]="!!error" [class.is-open]="menuOpen" [class.is-disabled]="disabled">
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
          class="app-phone__control"
          [id]="inputId"
          type="tel"
          inputmode="tel"
          autocomplete="tel-national"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [ngModel]="nationalNumber"
          (ngModelChange)="onNationalChange($event)"
          (blur)="onTouched()"
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

      <app-validation-message [message]="error"></app-validation-message>
    </div>
  `,
  styleUrl: './app-phone-input.component.scss'
})
export class AppPhoneInputComponent implements ControlValueAccessor {
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('root') root?: ElementRef<HTMLElement>;

  @Input() label = '';
  @Input() placeholder = 'Enter mobile number';
  @Input() error = '';
  @Input() required = false;
  @Input() disabled = false;
  @Input() countries: PhoneCountryOption[] = DEFAULT_COUNTRIES;

  readonly inputId = `app-phone-${++nextPhoneId}`;

  selected: PhoneCountryOption = DEFAULT_COUNTRIES[0];
  nationalNumber = '';
  menuOpen = false;

  private onValueChange: (value: string) => void = () => undefined;
  onTouched: () => void = () => undefined;

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
    this.menuOpen = false;
    this.emitValue();
    this.cdr.markForCheck();
  }

  onNationalChange(value: string): void {
    this.nationalNumber = (value ?? '').replace(/[^\d]/g, '');
    this.emitValue();
  }

  private parseValue(value: string): void {
    const trimmed = value.trim();
    if (!trimmed) {
      this.nationalNumber = '';
      return;
    }

    const match = this.countries
      .slice()
      .sort((a, b) => b.dialCode.length - a.dialCode.length)
      .find(c => trimmed.startsWith(c.dialCode));

    if (match) {
      this.selected = match;
      this.nationalNumber = trimmed.slice(match.dialCode.length).replace(/[^\d]/g, '');
      return;
    }

    this.nationalNumber = trimmed.replace(/[^\d]/g, '');
  }

  private emitValue(): void {
    const digits = this.nationalNumber.trim();
    const next = digits ? `${this.selected.dialCode}${digits}` : '';
    this.onValueChange(next);
  }
}
