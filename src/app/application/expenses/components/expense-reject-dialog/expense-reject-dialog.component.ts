import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { UiFeedbackService } from '../../../../core/feedback/ui-feedback.service';
import { extractApiError } from '../../../../shared/utils/api-error.util';
import { ExpensesApiService } from '../../services/expenses-api.service';

@Component({
  selector:'app-expense-reject-dialog', standalone:true, imports:[CommonModule,FormsModule,DialogModule],
  template:`<p-dialog header="Reject Expense" [(visible)]="visible" (visibleChange)="visibleChange.emit($event)" [modal]="true" [style]="{width:'480px',maxWidth:'95vw'}">
    <label class="expense-dialog-label">Reason *<textarea class="p-inputtext p-component w-full" rows="4" [(ngModel)]="remarks" maxlength="1000"></textarea></label>
    <div class="expense-actions"><button class="p-button p-button-outlined" (click)="visibleChange.emit(false)">Cancel</button><button class="p-button p-button-danger" [disabled]="saving||!remarks.trim()" (click)="reject()">Reject</button></div>
  </p-dialog>`, styleUrls:['../../expenses.shared.scss']
})
export class ExpenseRejectDialogComponent {
  private readonly api=inject(ExpensesApiService);private readonly feedback=inject(UiFeedbackService);
  @Input() visible=false;@Input() expenseId:number|null=null;@Output() visibleChange=new EventEmitter<boolean>();@Output() rejected=new EventEmitter<void>();
  remarks='';saving=false;
  reject():void{if(!this.expenseId||!this.remarks.trim())return;this.saving=true;this.api.reject(this.expenseId,this.remarks.trim()).subscribe({next:()=>{this.saving=false;this.feedback.success('Expense rejected','The expense was rejected.');this.rejected.emit();this.visibleChange.emit(false);this.remarks='';},error:e=>{this.saving=false;this.feedback.error('Reject failed',extractApiError(e,'Request failed').message);}});}
}
