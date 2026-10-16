import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { DropdownModule } from 'primeng/dropdown';
import { SaasPageHeaderComponent } from '../../../../shared/ui/saas';
import { SchoolOperationsDataService } from '../../../school-operations/services/school-operations-data.service';
import { AttendanceOrgSettings } from '../../../school-operations/models/school-operations.model';
import { TcPageSkeletonComponent } from '../../../../shared/ui/loading';
import { LoginService } from '../../../../core/services/login.service';

@Component({selector:'app-attendance-settings',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,imports:[CommonModule,FormsModule,DropdownModule,SaasPageHeaderComponent,TcPageSkeletonComponent],templateUrl:'./attendance-settings.component.html',styleUrl:'./attendance-settings.component.scss'})
export class AttendanceSettingsComponent implements OnInit {
  private readonly dataService=inject(SchoolOperationsDataService); private readonly cdr=inject(ChangeDetectorRef); private readonly destroyRef=inject(DestroyRef);
  private readonly loginService=inject(LoginService);
  settings: AttendanceOrgSettings=this.emptySettings();
  readonly editingPolicyOptions=[{label:'Same day',value:'SAME_DAY' as const},{label:'Same week',value:'SAME_WEEK' as const},{label:'Same month',value:'SAME_MONTH' as const}];
  loading=true; loaded=false; saving=false; saved=false; errorMessage='';
  get canManageSettings():boolean{return (this.loginService.getUserRole()??[]).some(role=>['ORGANIZATION_OWNER','ORGANIZATION_ADMIN'].includes(String(role).toUpperCase().replace(/^ROLE_/,'')));}
  ngOnInit():void{if(!this.canManageSettings){this.loading=false;this.errorMessage='You do not have permission to manage attendance settings.';return;}this.load();}
  load():void{this.loading=true;this.loaded=false;this.errorMessage='';this.dataService.getAttendanceSettings().pipe(finalize(()=>{this.loading=false;this.cdr.markForCheck();}),takeUntilDestroyed(this.destroyRef)).subscribe({next:data=>{this.settings={...data};this.loaded=true;this.cdr.markForCheck();},error:err=>{this.errorMessage=err?.error?.message||'Unable to load attendance settings.';}});}
  save():void{if(this.saving||!this.isValid())return;this.saving=true;this.saved=false;this.errorMessage='';const payload:Partial<AttendanceOrgSettings>={attendanceMode:this.settings.attendanceMode,minStudentAttendancePercent:this.settings.minStudentAttendancePercent,attendanceEditingPolicy:this.settings.attendanceEditingPolicy,staffLateGraceMinutes:this.settings.staffLateGraceMinutes,minStaffWorkingHours:this.settings.minStaffWorkingHours};this.dataService.saveAttendanceSettings(payload).pipe(finalize(()=>{this.saving=false;this.cdr.markForCheck();}),takeUntilDestroyed(this.destroyRef)).subscribe({next:data=>{this.settings={...data};this.saved=true;this.cdr.markForCheck();setTimeout(()=>{this.saved=false;this.cdr.markForCheck();},2400);},error:err=>{this.errorMessage=err?.error?.message||'Unable to save attendance settings.';}});}
  isValid():boolean{const threshold=this.settings.minStudentAttendancePercent;const grace=this.settings.staffLateGraceMinutes;const hours=this.settings.minStaffWorkingHours;return this.loaded&&this.settings.attendanceMode==='DAILY'&&this.editingPolicyOptions.some(option=>option.value===this.settings.attendanceEditingPolicy)&&typeof threshold==='number'&&Number.isInteger(threshold)&&threshold>=0&&threshold<=100&&typeof grace==='number'&&Number.isInteger(grace)&&grace>=0&&grace<=120&&typeof hours==='number'&&Number.isFinite(hours)&&hours>=1&&hours<=24&&Number.isInteger(hours*2);}
  private emptySettings():AttendanceOrgSettings{return{attendanceMode:'DAILY',attendanceEditingPolicy:'SAME_DAY',windowStartTime:'09:00',windowEndTime:'17:00',allowCopyPrevious:true,minStudentAttendancePercent:75,minStaffWorkingHours:8,staffLateGraceMinutes:15,freezeAfterDays:0};}
}
