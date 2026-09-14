/**
 * @deprecated Legacy school-ops payroll client.
 * Use `PayrollApiService` under `application/payroll` and `financePayrollApi` / `payrollMeApi`.
 * Kept only so accidental imports fail loudly if revived — do not call these methods.
 */
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PayrollService {
  getAllPayroll(): never {
    throw new Error('Deprecated: use PayrollApiService (Finance → Payroll).');
  }

  getByStaffId(_staffId: number): never {
    throw new Error('Deprecated: use PayrollApiService (Finance → Payroll).');
  }

  saveOrUpdate(_dto: unknown): never {
    throw new Error('Deprecated: use PayrollApiService (Finance → Payroll).');
  }

  runPayroll(): never {
    throw new Error('Deprecated: use PayrollApiService (Finance → Payroll).');
  }
}
