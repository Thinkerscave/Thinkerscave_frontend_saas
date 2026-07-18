import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  forwardRef,
  HostListener,
  inject,
  Input
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { AppValidationMessageComponent } from './app-validation-message.component';
import { AppSelectOption } from './app-select.model';

let nextSelectId = 0;

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CommonModule, AppValidationMessageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppSelectComponent),
      multi: true
    }
  ],
  template: `
    <div class="app-select" [class.is-open]="open" [class.is-invalid]="!!error" [class.is-disabled]="disabled">
      <label *ngIf="label" class="app-field__label" [attr.for]="selectId">
        {{ label }}<span *ngIf="required" class="app-field__required" aria-hidden="true">*</span>
      </label>

      <button
        type="button"
        class="app-select__trigger"
        [id]="selectId"
        [disabled]="disabled"
        [attr.aria-expanded]="open"
        aria-haspopup="listbox"
        (click)="toggle()"
        (keydown)="onTriggerKeydown($event)">
        <span class="app-select__value" [class.is-placeholder]="!selectedLabel">{{ selectedLabel || placeholder }}</span>
        <i class="pi pi-chevron-down app-select__chevron" aria-hidden="true"></i>
      </button>

      <ul *ngIf="open" class="app-select__menu" role="listbox" [attr.aria-labelledby]="selectId">
        <li
          *ngFor="let option of options; let i = index"
          role="option"
          class="app-select__option"
          [class.is-selected]="option.value === value"
          [class.is-highlighted]="i === highlightedIndex"
          [class.is-disabled]="option.disabled"
          [attr.aria-selected]="option.value === value"
          (click)="selectOption(option, $event)">
          {{ option.label }}
          <i *ngIf="option.value === value" class="pi pi-check app-select__check" aria-hidden="true"></i>
        </li>
        <li *ngIf="!options.length" class="app-select__empty">No options</li>
      </ul>

      <p *ngIf="hint && !error" class="app-field__hint">{{ hint }}</p>
      <app-validation-message [message]="error"></app-validation-message>
    </div>
  `,
  styleUrl: './app-select.component.scss'
})
export class AppSelectComponent implements ControlValueAccessor {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly host = inject(ElementRef<HTMLElement>);

  @Input() label = '';
  @Input() placeholder = 'Select…';
  @Input() hint = '';
  @Input() error = '';
  @Input() required = false;
  @Input() disabled = false;
  @Input() options: AppSelectOption[] = [];

  readonly selectId = `app-select-${++nextSelectId}`;
  value: string | null = null;
  open = false;
  highlightedIndex = -1;

  private onValueChange: (value: string | null) => void = () => undefined;
  onTouched: () => void = () => undefined;

  get selectedLabel(): string {
    return this.options.find(o => o.value === this.value)?.label ?? '';
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.open) return;
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

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

  toggle(): void {
    if (this.disabled) return;
    this.open ? this.close() : this.openMenu();
  }

  openMenu(): void {
    this.open = true;
    const selectedIndex = this.options.findIndex(o => o.value === this.value);
    this.highlightedIndex = selectedIndex >= 0 ? selectedIndex : 0;
    this.cdr.markForCheck();
  }

  close(): void {
    if (!this.open) return;
    this.open = false;
    this.highlightedIndex = -1;
    this.onTouched();
    this.cdr.markForCheck();
  }

  selectOption(option: AppSelectOption, event?: Event): void {
    event?.stopPropagation();
    if (option.disabled) return;
    this.value = option.value;
    this.onValueChange(option.value);
    this.close();
  }

  onTriggerKeydown(event: KeyboardEvent): void {
    if (this.disabled) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!this.open) this.openMenu();
        else this.moveHighlight(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!this.open) this.openMenu();
        else this.moveHighlight(-1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!this.open) this.openMenu();
        else if (this.highlightedIndex >= 0) this.selectOption(this.options[this.highlightedIndex]);
        break;
      case 'Escape':
        event.preventDefault();
        this.close();
        break;
      case 'Tab':
        this.close();
        break;
      default:
        break;
    }
  }

  private moveHighlight(delta: number): void {
    if (!this.options.length) return;
    let next = this.highlightedIndex;
    do {
      next = (next + delta + this.options.length) % this.options.length;
    } while (this.options[next]?.disabled && next !== this.highlightedIndex);
    this.highlightedIndex = next;
    this.cdr.markForCheck();
  }
}
