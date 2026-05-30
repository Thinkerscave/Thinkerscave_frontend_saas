import { Directive, ElementRef, EventEmitter, inject, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { debounceTime, fromEvent, Subscription } from 'rxjs';

/**
 * Debounces input events and emits the current value after the delay.
 *
 * Usage:
 *   <input appDebounceInput (debounced)="onSearch($event)" />
 *   <input [debounceTime]="500" appDebounceInput (debounced)="onSearch($event)" />
 */
@Directive({ selector: '[appDebounceInput]', standalone: true })
export class DebounceInputDirective implements OnInit, OnDestroy {
  @Input() debounceTime = 300;
  @Output() debounced = new EventEmitter<string>();

  private readonly el = inject(ElementRef<HTMLInputElement>);
  private sub?: Subscription;

  ngOnInit(): void {
    this.sub = fromEvent(this.el.nativeElement, 'input')
      .pipe(debounceTime(this.debounceTime))
      .subscribe(() => this.debounced.emit(this.el.nativeElement.value));
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
