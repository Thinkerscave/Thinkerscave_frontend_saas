import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { UiFeedbackService } from '../../../../core/feedback/ui-feedback.service';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { SaasPageHeaderComponent } from '../../../../shared/ui/saas';
import { extractApiError } from '../../../../shared/utils/api-error.util';
import { ExpenseFormDrawerComponent } from '../../components/expense-form-drawer/expense-form-drawer.component';
import { ExpenseRejectDialogComponent } from '../../components/expense-reject-dialog/expense-reject-dialog.component';
import { RecordExpensePaymentDialogComponent } from '../../components/record-expense-payment-dialog/record-expense-payment-dialog.component';
import { EXPENSE_RESOURCES, ExpenseDetail, expenseStatusLabel, expenseStatusTone } from '../../models/expenses.model';
import { ExpensesApiService } from '../../services/expenses-api.service';

type Tab='details'|'payments'|'approvals'|'attachments'|'activity';
@Component({
 selector:'app-expense-detail-page',standalone:true,imports:[CommonModule,RouterLink,AppToastComponent,HasPermissionDirective,SaasPageHeaderComponent,ExpenseFormDrawerComponent,ExpenseRejectDialogComponent,RecordExpensePaymentDialogComponent],
 template:`<section class="tc-page-shell tc-directory-page expenses-page"><app-toast/>
  <tc-saas-page-header [subtitle]="expense?.expenseNumber||'Expense detail'"><a class="p-button p-button-outlined p-button-sm" routerLink="/app/expenses">Back</a>
   @if(expense){<span class="tc-saas-pill" [attr.data-tone]="tone(expense.approvalStatus)">{{label(expense.approvalStatus)}}</span><span class="tc-saas-pill" [attr.data-tone]="tone(expense.paymentStatus)">{{label(expense.paymentStatus)}}</span>
    @if(expense.approvalStatus==='DRAFT'||expense.approvalStatus==='PENDING_APPROVAL'||expense.approvalStatus==='APPROVED'){<button class="p-button p-button-outlined p-button-sm" *tcHasPerm="resources.EXPENSES; action:'manage'" (click)="drawer=true">Edit</button>}
    @if(expense.approvalStatus==='DRAFT'){<button class="p-button p-button-sm" *tcHasPerm="resources.EXPENSES; action:'manage'" (click)="submit()">Submit</button>}
    @if(expense.approvalStatus==='APPROVED'&&expense.paymentStatus!=='PAID'){<button class="p-button p-button-sm" *tcHasPerm="resources.PAYMENT; action:'manage'" (click)="payment=true">Record Payment</button>}
    @if(expense.approvalStatus==='PENDING_APPROVAL'){<button class="p-button p-button-sm" *tcHasPerm="resources.APPROVAL; action:'approve'" (click)="approve()">Approve</button><button class="p-button p-button-danger p-button-sm" *tcHasPerm="resources.APPROVAL; action:'approve'" (click)="reject=true">Reject</button>}
    @if(expense.approvalStatus==='REJECTED'){<button class="p-button p-button-outlined p-button-sm" *tcHasPerm="resources.EXPENSES; action:'manage'" (click)="returnToDraft()">Return to Draft</button>}
   }</tc-saas-page-header>
  @if(loading){<div class="tc-loading"><i class="pi pi-spin pi-spinner"></i> Loading expense…</div>}@else if(expense){
   <div class="expense-summary"><div><span>Total Amount</span><strong>{{money(expense.amount)}}</strong></div><div><span>Paid Amount</span><strong>{{money(expense.paidAmount)}}</strong></div><div><span>Remaining</span><strong>{{money(expense.remainingAmount)}}</strong></div></div>
   <div class="expenses-tabs">@for(t of tabs;track t){<button [class.is-active]="tab===t" (click)="tab=t">{{label(t)}}</button>}</div>
   <div class="tc-card tc-card--panel expenses-panel"><div class="tc-card__body">
    @if(tab==='details'){<dl class="expense-details"><div><dt>Expense Head</dt><dd>{{expense.headName}}</dd></div><div><dt>Category</dt><dd>{{expense.categoryName}}</dd></div><div><dt>Date</dt><dd>{{expense.expenseDate|date:'mediumDate'}}</dd></div><div><dt>Amount</dt><dd>{{money(expense.amount)}}</dd></div><div><dt>Vendor</dt><dd>{{expense.vendorName||'—'}}</dd></div><div><dt>Invoice No.</dt><dd>{{expense.vendorInvoiceNumber||'—'}}</dd></div><div><dt>Requester</dt><dd>{{expense.requester.name}}</dd></div><div><dt>Remarks</dt><dd>{{expense.remarks||'—'}}</dd></div></dl>}
    @if(tab==='payments'){<table class="expenses-table"><thead><tr><th>Date</th><th>Method</th><th>Reference</th><th>Remarks</th><th>Amount</th></tr></thead><tbody>@for(p of expense.payments;track p.expensePaymentId){<tr><td>{{p.paidOn|date:'mediumDate'}}</td><td>{{p.paymentMethodName||'—'}}</td><td>{{p.referenceNumber||'—'}}</td><td>{{p.remarks||'—'}}</td><td>{{money(p.amount)}}</td></tr>}@empty{<tr><td colspan="5">No payments recorded.</td></tr>}</tbody></table>}
    @if(tab==='approvals'){<ul class="expense-timeline">@for(a of expense.approvalEvents;track a.id){<li><strong>{{label(a.eventType)}}</strong><span>{{a.actor||'System'}} · {{a.occurredOn|date:'medium'}}</span><p>{{a.remarks||''}}</p></li>}@empty{<li>No approval events.</li>}</ul>}
    @if(tab==='attachments'){<label class="p-button p-button-outlined p-button-sm" *tcHasPerm="resources.EXPENSES; action:'manage'">Upload<input hidden type="file" accept=".pdf,.jpg,.jpeg,.png" (change)="upload($event)"/></label><ul class="expense-files">@for(a of expense.attachments;track a.managedDocumentId){<li><span>{{a.fileName}}</span><button class="p-button p-button-text" (click)="download(a.managedDocumentId,a.fileName)">Download</button><button class="p-button p-button-text" *tcHasPerm="resources.EXPENSES; action:'manage'" (click)="remove(a.managedDocumentId)">Delete</button></li>}@empty{<li>No attachments.</li>}</ul>}
    @if(tab==='activity'){<ul class="expense-timeline">@for(a of activity;track a.when+a.label){<li><strong>{{a.label}}</strong><span>{{a.when|date:'medium'}}</span><p>{{a.detail}}</p></li>}@empty{<li>No activity yet.</li>}</ul>}
   </div></div>
  }
  <app-expense-form-drawer [(open)]="drawer" [expense]="expense" (saved)="load()"/><app-record-expense-payment-dialog [(visible)]="payment" [expense]="expense" (paid)="load()"/><app-expense-reject-dialog [(visible)]="reject" [expenseId]="expense?.expenseId||null" (rejected)="load()"/>
 </section>`,styleUrls:['../../expenses.shared.scss']
})
export class ExpenseDetailPageComponent implements OnInit{
 private readonly route=inject(ActivatedRoute);private readonly api=inject(ExpensesApiService);private readonly feedback=inject(UiFeedbackService);
 readonly resources=EXPENSE_RESOURCES;readonly tabs:Tab[]=['details','payments','approvals','attachments','activity'];tab:Tab='details';expense:ExpenseDetail|null=null;loading=true;drawer=false;payment=false;reject=false;
 get id():number{return Number(this.route.snapshot.paramMap.get('expenseId'));}
 get activity():{label:string;when:string;detail:string}[]{if(!this.expense)return[];return[...this.expense.approvalEvents.map(a=>({label:this.label(a.eventType),when:a.occurredOn||'',detail:a.remarks||a.actor||''})),...this.expense.payments.map(p=>({label:'Payment Recorded',when:p.createdOn||p.paidOn,detail:this.money(p.amount)})),...this.expense.attachments.map(a=>({label:'Attachment Uploaded',when:a.uploadedOn||'',detail:a.fileName}))].sort((a,b)=>b.when.localeCompare(a.when));}
 ngOnInit():void{this.load();}load():void{this.loading=true;this.api.get(this.id).subscribe({next:e=>{this.expense=e;this.loading=false;},error:e=>{this.loading=false;this.feedback.error('Expense',extractApiError(e,'Request failed').message);}});}
 submit():void{this.api.submit(this.id).subscribe({next:()=>this.load(),error:e=>this.feedback.error('Submit failed',extractApiError(e,'Request failed').message)});}
 approve():void{this.api.approve(this.id).subscribe({next:()=>this.load(),error:e=>this.feedback.error('Approve failed',extractApiError(e,'Request failed').message)});}
 returnToDraft():void{this.api.returnToDraft(this.id).subscribe({next:()=>{this.feedback.success('Returned to draft','Expense can be corrected and resubmitted.');this.load();},error:e=>this.feedback.error('Return failed',extractApiError(e,'Request failed').message)});}
 upload(event:Event):void{const f=(event.target as HTMLInputElement).files?.[0];if(f)this.api.uploadAttachment(this.id,f).subscribe({next:()=>this.load(),error:e=>this.feedback.error('Upload failed',extractApiError(e,'Request failed').message)});}
 download(documentId:number,name:string):void{this.api.downloadAttachment(this.id,documentId).subscribe(b=>{const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=name;a.click();URL.revokeObjectURL(u);});}
 remove(documentId:number):void{this.api.deleteAttachment(this.id,documentId).subscribe(()=>this.load());}
 money(v?:number|null):string{return Number(v??0).toLocaleString('en-IN',{style:'currency',currency:'INR'});}label=expenseStatusLabel;tone=expenseStatusTone;
}
