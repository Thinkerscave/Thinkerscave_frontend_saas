import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

/**
 * @deprecated Staff payroll admin UI retired — route redirects to Finance Payroll.
 * Kept so accidental imports compile; navigates away immediately.
 */
@Component({
  selector: 'app-staff-payroll',
  standalone: true,
  template: `<p class="p-3">Redirecting to Finance Payroll…</p>`
})
export class StaffPayrollComponent implements OnInit {
  private readonly router = inject(Router);

  ngOnInit(): void {
    void this.router.navigateByUrl('/app/payroll');
  }
}
