import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-fees-outstanding-page',
  standalone: true,
  template: '',
  styles: [':host { display: none; }']
})
export class FeesOutstandingPageComponent implements OnInit {
  private readonly router = inject(Router);

  ngOnInit(): void {
    void this.router.navigate(['/app/fees/students'], {
      queryParams: { outstandingOnly: true },
      replaceUrl: true
    });
  }
}
