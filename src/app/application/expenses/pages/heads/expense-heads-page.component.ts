import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { UiFeedbackService } from '../../../../core/feedback/ui-feedback.service';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { SaasPageHeaderComponent } from '../../../../shared/ui/saas';
import { extractApiError } from '../../../../shared/utils/api-error.util';
import { ExpenseHeadDialogComponent } from '../../components/expense-head-dialog/expense-head-dialog.component';
import { EXPENSE_RESOURCES, ExpenseCategory, ExpenseHead } from '../../models/expenses.model';
import { ExpensesApiService } from '../../services/expenses-api.service';

@Component({
 selector:'app-expense-heads-page',standalone:true,imports:[CommonModule,FormsModule,RouterLink,AppToastComponent,HasPermissionDirective,SaasPageHeaderComponent,ExpenseHeadDialogComponent],
 template:`<section class="tc-page-shell tc-directory-page expenses-page"><app-toast/><tc-saas-page-header subtitle="Organization-managed expense classification for operational spending">
  <a class="p-button p-button-outlined p-button-sm" routerLink="/app/expenses">Back to Expenses</a><button class="p-button p-button-sm" *tcHasPerm="resources.HEADS; action:'manage'" (click)="open(null)"><i class="pi pi-plus mr-1"></i>Add Expense Head</button></tc-saas-page-header>
  <div class="tc-card tc-card--panel expenses-panel"><div class="tc-card__body"><div class="expenses-toolbar"><input class="p-inputtext p-component" placeholder="Search name or description" [(ngModel)]="draftQ"/>
   <select class="p-inputtext p-component" [(ngModel)]="categoryId"><option [ngValue]="null">All Categories</option>@for(c of categories;track c.expenseCategoryId){<option [ngValue]="c.expenseCategoryId">{{c.name}}</option>}</select>
   <select class="p-inputtext p-component" [(ngModel)]="status"><option value="">All Statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select><button class="p-button p-button-sm" (click)="apply()">Apply</button><button class="p-button p-button-outlined p-button-sm" (click)="reset()">Reset</button></div>
   @if(loading){<div class="tc-loading"><i class="pi pi-spin pi-spinner"></i> Loading heads…</div>}@else{<div class="expenses-table-wrap"><table class="expenses-table"><thead><tr><th>Head Name</th><th>Category</th><th>Author (Default)</th><th>Description</th><th>Status</th><th>Actions</th></tr></thead><tbody>
    @for(h of filtered;track h.expenseHeadId){<tr><td>{{h.name}}</td><td>{{h.category.name}}</td><td>{{h.defaultRequesterName||'—'}}</td><td>{{h.description||'—'}}</td><td><span class="tc-saas-pill" [attr.data-tone]="h.status==='ACTIVE'?'success':'muted'">{{h.status}}</span></td><td><button class="p-button p-button-text p-button-sm" *tcHasPerm="resources.HEADS; action:'manage'" (click)="open(h)"><i class="pi pi-pencil"></i></button><button class="p-button p-button-text p-button-sm" *tcHasPerm="resources.HEADS; action:'manage'" (click)="toggle(h)">{{h.status==='ACTIVE'?'Deactivate':'Activate'}}</button></td></tr>}@empty{<tr><td colspan="6">No expense heads found.</td></tr>}
   </tbody></table></div>}</div></div><app-expense-head-dialog [(visible)]="dialog" [head]="selected" (saved)="load()"/></section>`,
 styleUrls:['../../expenses.shared.scss']
})
export class ExpenseHeadsPageComponent implements OnInit{
 private readonly api=inject(ExpensesApiService);private readonly feedback=inject(UiFeedbackService);readonly resources=EXPENSE_RESOURCES;
 rows:ExpenseHead[]=[];categories:ExpenseCategory[]=[];loading=true;draftQ='';q='';categoryId:number|null=null;status='';dialog=false;selected:ExpenseHead|null=null;
 get filtered():ExpenseHead[]{return this.rows.filter(h=>(!this.categoryId||h.category.expenseCategoryId===this.categoryId)&&(!this.status||h.status===this.status));}
 ngOnInit():void{this.api.listCategories().subscribe(c=>this.categories=c);this.load();}
 load():void{this.loading=true;this.api.listHeads(this.q,0,200).subscribe({next:p=>{this.rows=p.content;this.loading=false;},error:e=>{this.loading=false;this.feedback.error('Expense heads',extractApiError(e,'Request failed').message);}});}
 apply():void{this.q=this.draftQ.trim();this.load();}reset():void{this.draftQ='';this.q='';this.categoryId=null;this.status='';this.load();}
 open(h:ExpenseHead|null):void{this.selected=h;this.dialog=true;}
 toggle(h:ExpenseHead):void{this.api.patchHeadStatus(h.expenseHeadId,h.status==='ACTIVE'?'INACTIVE':'ACTIVE').subscribe({next:()=>this.load(),error:e=>this.feedback.error('Update failed',extractApiError(e,'Request failed').message)});}
}
