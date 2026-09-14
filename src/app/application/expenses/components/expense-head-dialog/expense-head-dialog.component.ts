import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { forkJoin } from 'rxjs';
import { StaffService } from '../../../staff/services/staff.service';
import { UiFeedbackService } from '../../../../core/feedback/ui-feedback.service';
import { extractApiError } from '../../../../shared/utils/api-error.util';
import { ExpenseCategory, ExpenseHead } from '../../models/expenses.model';
import { ExpensesApiService } from '../../services/expenses-api.service';

@Component({
 selector:'app-expense-head-dialog',standalone:true,imports:[CommonModule,ReactiveFormsModule,DialogModule],
 template:`<p-dialog [header]="head?'Edit Expense Head':'Add Expense Head'" [(visible)]="visible" (visibleChange)="visibleChange.emit($event)" [modal]="true" [draggable]="false" [style]="{width:'560px',maxWidth:'95vw'}">
  <form [formGroup]="form" class="expense-dialog-form" (ngSubmit)="save()">
   <label>Head Name *<input formControlName="name"/></label><label>Category *<select formControlName="expenseCategoryId"><option [ngValue]="null">Select category</option>@for(c of categories;track c.expenseCategoryId){<option [ngValue]="c.expenseCategoryId">{{c.name}}</option>}</select></label>
   <label>Author / Default Requester<select formControlName="defaultRequesterStaffId"><option [ngValue]="null">None</option>@for(s of staff;track s.staffId){<option [ngValue]="s.staffId">{{s.firstName}} {{s.lastName}}</option>}</select></label>
   <label>Description<textarea formControlName="description"></textarea></label><label>Status *<select formControlName="status"><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label>
   <div class="expense-actions"><button type="button" class="p-button p-button-outlined" (click)="visibleChange.emit(false)">Cancel</button><button class="p-button" [disabled]="saving">Save Head</button></div>
  </form></p-dialog>`,styleUrls:['../../expenses.shared.scss']
})
export class ExpenseHeadDialogComponent implements OnChanges{
 private readonly fb=inject(FormBuilder);private readonly api=inject(ExpensesApiService);private readonly staffApi=inject(StaffService);private readonly feedback=inject(UiFeedbackService);
 @Input() visible=false;@Input() head:ExpenseHead|null=null;@Output() visibleChange=new EventEmitter<boolean>();@Output() saved=new EventEmitter<void>();
 categories:ExpenseCategory[]=[];staff:any[]=[];saving=false;
 form=this.fb.group({name:['',Validators.required],expenseCategoryId:[null as number|null,Validators.required],defaultRequesterStaffId:[null as number|null],description:[''],status:['ACTIVE',Validators.required]});
 ngOnChanges():void{if(this.visible){forkJoin({categories:this.api.listCategories(),staff:this.staffApi.getStaffList({page:0,size:200})}).subscribe(x=>{this.categories=x.categories;this.staff=x.staff.content;this.form.reset({name:this.head?.name??'',expenseCategoryId:this.head?.category.expenseCategoryId??null,defaultRequesterStaffId:this.head?.defaultRequesterStaffId??null,description:this.head?.description??'',status:this.head?.status??'ACTIVE'});});}}
 save():void{if(this.form.invalid)return;const r=this.form.getRawValue();const body={name:r.name!.trim(),expenseCategoryId:r.expenseCategoryId!,defaultRequesterStaffId:r.defaultRequesterStaffId,description:r.description?.trim()||null,status:r.status as 'ACTIVE'|'INACTIVE'};this.saving=true;(this.head?this.api.updateHead(this.head.expenseHeadId,body):this.api.createHead(body)).subscribe({next:()=>{this.saving=false;this.feedback.success('Expense head saved','Expense head updated.');this.saved.emit();this.visibleChange.emit(false);},error:e=>{this.saving=false;this.feedback.error('Save failed',extractApiError(e,'Request failed').message);}});}
}
