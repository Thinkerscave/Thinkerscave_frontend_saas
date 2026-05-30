import { AfterViewInit, Directive, ElementRef, inject, Input } from '@angular/core';

/**
 * Reliably focuses an element after it enters the DOM — works in SPA dialogs
 * and dynamically rendered content where native `autofocus` fails.
 *
 * Usage:
 *   <input appAutofocus />
 *   <input [appAutofocus]="shouldFocus" />
 */
@Directive({ selector: '[appAutofocus]', standalone: true })
export class AutofocusDirective implements AfterViewInit {
  @Input() appAutofocus: boolean | '' = true;

  private readonly el = inject(ElementRef<HTMLElement>);

  ngAfterViewInit(): void {
    if (this.appAutofocus === '' || this.appAutofocus) {
      queueMicrotask(() => this.el.nativeElement.focus());
    }
  }
}
