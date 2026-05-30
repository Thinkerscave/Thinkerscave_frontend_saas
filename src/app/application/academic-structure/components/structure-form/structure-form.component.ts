import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges , ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { AcademicStructureService } from '../../services/academic-structure.service';
import { ContainerType } from '../../../../core/enums/container-type.enum';
import { LoginService } from '../../../../core/services/login.service';
import { CourseService } from '../../../course-management/services/course.service';
import { TenantConfigService, TenantConfig } from '../../../../core/services/tenant-config.service';

@Component({
  selector: 'app-structure-form',
    changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputTextModule, ButtonModule, DropdownModule, RouterModule],
  templateUrl: './structure-form.component.html',
  styleUrls: ['./structure-form.component.scss']
})
export class StructureFormComponent implements OnInit, OnChanges {
  @Input() editId: number | null = null;
  @Input() parentId: number | null = null;
  @Output() saveComplete = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  structureForm: FormGroup;
  isEditMode = false;
  submitted = false;
  containerTypes: { label: string, value: string }[] = [];
  orgId: number;
  currentYearId: number | null = null;
  tenantConfig: TenantConfig | null = null;

  constructor(
    private fb: FormBuilder,
    private structureService: AcademicStructureService,
    private loginService: LoginService,
    private courseService: CourseService,
    private route: ActivatedRoute,
    private router: Router,
    private tenantConfigService: TenantConfigService
  ) {
    this.orgId = this.loginService.getUser()?.organizationId || 1;
    this.tenantConfig = this.tenantConfigService.getConfig();
    if (this.tenantConfig && this.tenantConfig.allowedContainerTypes) {
      this.containerTypes = this.tenantConfig.allowedContainerTypes.map(type => ({ label: type, value: type }));
    } else {
      this.containerTypes = Object.values(ContainerType).map(type => ({ label: type, value: type }));
    }

    this.structureForm = this.fb.group({
      containerId: [null],
      containerName: ['', Validators.required],
      containerCode: ['', Validators.required],
      containerType: [null, Validators.required],
      level: [1, Validators.required],
      capacity: [null],
      parentContainerId: [null],
      organisationId: [this.orgId],
      academicYearId: [null]
    });
  }

  ngOnInit(): void {
    // We keep route fallback just in case it's still hit via URL
    const id = this.route.snapshot.params['id'] || this.editId;

    this.courseService.getAllAcademicYears(this.orgId).subscribe(years => {
      const activeYear = years.find(y => y.isActive);
      if (activeYear) {
        this.currentYearId = (activeYear.academicYearId || activeYear.id) || null;
        this.structureForm.patchValue({ academicYearId: this.currentYearId });
      }

      if (id) {
        this.isEditMode = true;
        this.structureService.getContainerById(id).subscribe(data => {
          this.structureForm.patchValue(data);
        });
      }
    });

    this.route.queryParams.subscribe(params => {
      const pId = params['parentId'] || this.parentId;
      if (pId) {
        this.structureForm.patchValue({ parentContainerId: +pId });
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editId'] && !changes['editId'].isFirstChange()) {
      if (this.editId) {
        this.isEditMode = true;
        this.structureService.getContainerById(this.editId).subscribe(data => {
          this.structureForm.patchValue(data);
        });
      } else {
        this.isEditMode = false;
        this.structureForm.reset();
        this.structureForm.patchValue({ organisationId: this.orgId, academicYearId: this.currentYearId, level: 1 });
      }
    }

    if (changes['parentId']) {
      this.structureForm.patchValue({ parentContainerId: this.parentId });
    }
  }

  onSubmit() {
    this.submitted = true;
    if (this.structureForm.invalid) return;

    const action = this.isEditMode && (this.editId || this.route.snapshot.params['id'])
      ? this.structureService.updateContainer(this.editId || this.route.snapshot.params['id'], this.structureForm.value)
      : this.structureService.createContainer(this.structureForm.value);

    action.subscribe({
      next: () => {
        this.saveComplete.emit();
        // Fallback routing if used standalone
        if (!this.editId && !this.parentId && this.route.snapshot.url.length > 0 && this.route.snapshot.url[0].path !== 'structure') {
          this.router.navigate(['/application/academics/structure']);
        }
      },
      error: (err: any) => console.error(err)
    });
  }

  onCancel() {
    this.cancel.emit();
    if (!this.editId && !this.parentId && this.route.snapshot.url.length > 0 && this.route.snapshot.url[0].path !== 'structure') {
      this.router.navigate(['/application/academics/structure']);
    }
  }
}
