import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AdmissionEnquiryService {
  private readonly _visible = signal(false);
  readonly visible = this._visible.asReadonly();

  open(): void {
    this._visible.set(true);
  }

  close(): void {
    this._visible.set(false);
  }
}