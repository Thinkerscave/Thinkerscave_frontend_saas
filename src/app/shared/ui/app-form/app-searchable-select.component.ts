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

import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

import { AppValidationMessageComponent } from './app-validation-message.component';

import { AppSelectOption } from './app-select.model';



let nextSearchableSelectId = 0;



@Component({

  selector: 'app-searchable-select',

  standalone: true,

  imports: [CommonModule, FormsModule, AppValidationMessageComponent],

  changeDetection: ChangeDetectionStrategy.OnPush,

  providers: [

    {

      provide: NG_VALUE_ACCESSOR,

      useExisting: forwardRef(() => AppSearchableSelectComponent),

      multi: true

    }

  ],

  template: `

    <div class="app-searchable-select" [class.is-open]="open" [class.is-invalid]="!!error" [class.is-disabled]="disabled">

      <label *ngIf="label" class="app-field__label" [attr.for]="selectId">

        {{ label }}<span *ngIf="required" class="app-field__required" aria-hidden="true">*</span>

      </label>



      <button

        type="button"

        class="app-searchable-select__trigger"

        [id]="selectId"

        [disabled]="disabled"

        [attr.aria-expanded]="open"

        aria-haspopup="listbox"

        (click)="toggle()">

        <span class="app-searchable-select__value" [class.is-placeholder]="!selectedLabel">{{ selectedLabel || placeholder }}</span>

        <i class="pi pi-chevron-down app-searchable-select__chevron" aria-hidden="true"></i>

      </button>



      <div *ngIf="open" class="app-searchable-select__panel">

        <div class="app-searchable-select__search">

          <i class="pi pi-search" aria-hidden="true"></i>

          <input

            type="text"

            [(ngModel)]="searchTerm"

            [ngModelOptions]="{ standalone: true }"

            [placeholder]="searchPlaceholder"

            (keydown)="onSearchKeydown($event)"

            (click)="$event.stopPropagation()" />

        </div>



        <ul class="app-searchable-select__menu" role="listbox" [attr.aria-labelledby]="selectId">

          <li

            *ngFor="let option of filteredOptions; let i = index"

            role="option"

            class="app-searchable-select__option"

            [class.is-selected]="option.value === value"

            [class.is-highlighted]="i === highlightedIndex"

            [class.is-disabled]="option.disabled"

            [attr.aria-selected]="option.value === value"

            (click)="selectOption(option, $event)">

            {{ option.label }}

            <i *ngIf="option.value === value" class="pi pi-check app-searchable-select__check" aria-hidden="true"></i>

          </li>

          <li *ngIf="!filteredOptions.length" class="app-searchable-select__empty">{{ emptyText }}</li>

        </ul>

      </div>



      <p *ngIf="hint && !error" class="app-field__hint">{{ hint }}</p>

      <app-validation-message [message]="error"></app-validation-message>

    </div>

  `,

  styleUrl: './app-searchable-select.component.scss'

})

export class AppSearchableSelectComponent implements ControlValueAccessor {

  private readonly cdr = inject(ChangeDetectorRef);

  private readonly host = inject(ElementRef<HTMLElement>);



  @Input() label = '';

  @Input() placeholder = 'Select…';

  @Input() searchPlaceholder = 'Search…';

  @Input() emptyText = 'No matches found';

  @Input() hint = '';

  @Input() error = '';

  @Input() required = false;

  @Input() disabled = false;

  @Input() options: AppSelectOption[] = [];



  readonly selectId = `app-searchable-select-${++nextSearchableSelectId}`;

  value: string | null = null;

  open = false;

  searchTerm = '';

  highlightedIndex = -1;



  private onValueChange: (value: string | null) => void = () => undefined;

  onTouched: () => void = () => undefined;



  get selectedLabel(): string {

    return this.options.find(o => o.value === this.value)?.label ?? '';

  }



  get filteredOptions(): AppSelectOption[] {

    const term = this.searchTerm.trim().toLowerCase();

    if (!term) return this.options;

    return this.options.filter(o => o.label.toLowerCase().includes(term));

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

    this.searchTerm = '';

    const selectedIndex = this.filteredOptions.findIndex(o => o.value === this.value);

    this.highlightedIndex = selectedIndex >= 0 ? selectedIndex : 0;

    this.cdr.markForCheck();

    queueMicrotask(() => {

      const input = this.host.nativeElement.querySelector('.app-searchable-select__search input') as HTMLInputElement | null;

      input?.focus();

    });

  }



  close(): void {

    if (!this.open) return;

    this.open = false;

    this.searchTerm = '';

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



  onSearchKeydown(event: KeyboardEvent): void {

    switch (event.key) {

      case 'ArrowDown':

        event.preventDefault();

        this.moveHighlight(1);

        break;

      case 'ArrowUp':

        event.preventDefault();

        this.moveHighlight(-1);

        break;

      case 'Enter':

        event.preventDefault();

        if (this.highlightedIndex >= 0) {

          this.selectOption(this.filteredOptions[this.highlightedIndex]);

        }

        break;

      case 'Escape':

        event.preventDefault();

        this.close();

        break;

      default:

        this.highlightedIndex = 0;

        this.cdr.markForCheck();

        break;

    }

  }



  private moveHighlight(delta: number): void {

    const opts = this.filteredOptions;

    if (!opts.length) return;

    let next = this.highlightedIndex;

    do {

      next = (next + delta + opts.length) % opts.length;

    } while (opts[next]?.disabled && next !== this.highlightedIndex);

    this.highlightedIndex = next;

    this.cdr.markForCheck();

  }

}


