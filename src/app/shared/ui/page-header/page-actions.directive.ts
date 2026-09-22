import { Directive, OnDestroy, TemplateRef, inject } from '@angular/core';
import { BreadCrumbService } from '../../../core/services/bread-crumb.service';

/** Projects page actions into the shared header toolbar (right side). */
@Directive({
  selector: 'ng-template[tcPageActions]',
  standalone: true
})
export class PageActionsDirective implements OnDestroy {
  private readonly pageHeader = inject(BreadCrumbService);
  private readonly tpl = inject(TemplateRef<unknown>);

  constructor() {
    this.pageHeader.setActions(this.tpl);
  }

  ngOnDestroy(): void {
    this.pageHeader.clearActions(this.tpl);
  }
}
