import { Component, OnInit , ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TreeNode, MenuItem, ConfirmationService } from 'primeng/api';
import { TreeModule } from 'primeng/tree';
import { SplitterModule } from 'primeng/splitter';
import { ButtonModule } from 'primeng/button';
import { ContextMenuModule } from 'primeng/contextmenu';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { TabsModule } from 'primeng/tabs';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { ChipsModule } from 'primeng/chips';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AcademicStructureService } from '../../services/academic-structure.service';
import { AcademicContainer, StructureTemplate } from '../../../../shared/models/academic-container.model';
import { LoginService } from '../../../../core/services/login.service';
import { TenantConfigService, TenantConfig } from '../../../../core/services/tenant-config.service';
import { CourseService } from '../../../course-management/services/course.service';
import { StructureFormComponent } from '../structure-form/structure-form.component';

@Component({
  selector: 'app-structure-list',
    changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    TreeModule,
    SplitterModule,
    ButtonModule,
    ContextMenuModule,
    ConfirmDialogModule,
    TagModule,
    RouterModule,
    TabsModule,
    DialogModule,
    InputTextModule,
    DropdownModule,
    InputNumberModule,
    ChipsModule,
    ReactiveFormsModule,
    StructureFormComponent
  ],
  providers: [ConfirmationService],
  templateUrl: './structure-list.component.html',
  styleUrls: ['./structure-list.component.scss']
})
export class StructureListComponent implements OnInit {
  containers: AcademicContainer[] = [];
  treeNodes: TreeNode[] = [];
  selectedNode: TreeNode | null = null;
  selectedContainer: AcademicContainer | null = null;
  contextMenuItems: MenuItem[] = [];
  loading: boolean = true;
  orgId: number;
  currentYearId: number | null = null;

  activeTabIndex: number = 1; // Default to View tab
  editId: number | null = null;
  parentId: number | null = null;

  // Dynamic Generation Modal State
  generateDialogVisible: boolean = false;
  generatorForm: FormGroup;
  containerTypes: { label: string, value: string }[] = [];
  tenantConfig: TenantConfig | null = null;

  constructor(
    private structureService: AcademicStructureService,
    private loginService: LoginService,
    private courseService: CourseService,
    private router: Router,
    private confirmationService: ConfirmationService,
    private fb: FormBuilder,
    private tenantConfigService: TenantConfigService
  ) {
    this.orgId = this.loginService.getUser()?.organizationId || 1;
    this.tenantConfig = this.tenantConfigService.getConfig();

    if (this.tenantConfig && this.tenantConfig.allowedContainerTypes) {
      this.containerTypes = this.tenantConfig.allowedContainerTypes.map(type => ({ label: type, value: type }));
    } else {
      // Fallback
      this.containerTypes = [
        { label: 'CLASS', value: 'CLASS' },
        { label: 'SECTION', value: 'SECTION' },
        { label: 'COURSE', value: 'COURSE' },
        { label: 'BRANCH', value: 'BRANCH' },
        { label: 'SEMESTER', value: 'SEMESTER' },
        { label: 'YEAR', value: 'YEAR' }
      ];
    }

    this.generatorForm = this.fb.group({
      rootType: ['CLASS', Validators.required],
      rootPrefix: ['Class'],
      rootStartRange: [1, [Validators.required, Validators.min(1)]],
      rootEndRange: [10, [Validators.required, Validators.min(1)]],
      childType: ['SECTION', Validators.required],
      childPrefix: ['Section'],
      childNames: [['A']]
    });
  }

  ngOnInit(): void {
    this.loadCurrentYearAndStructures();
    this.setupContextMenu();
  }

  setupContextMenu() {
    this.contextMenuItems = [
      {
        label: 'Add Child Container',
        icon: 'pi pi-plus',
        command: () => this.addChild(this.selectedNode)
      },
      {
        label: 'Delete Container',
        icon: 'pi pi-trash',
        styleClass: 'text-red-500',
        command: () => this.deleteNode(this.selectedNode)
      }
    ];
  }

  loadCurrentYearAndStructures() {
    this.loading = true;
    this.courseService.getAllAcademicYears(this.orgId).subscribe({
      next: (years) => {
        const activeYear = years.find(y => y.isActive);
        const yearId = activeYear ? (activeYear.academicYearId || activeYear.id) : null;
        if (yearId) {
          this.currentYearId = yearId;
          this.loadStructures();
        } else {
          this.loading = false;
        }
      },
      error: () => this.loading = false
    });
  }

  loadStructures() {
    if (!this.currentYearId) return;
    this.loading = true;
    this.structureService.getTopLevelContainers(this.orgId, this.currentYearId).subscribe({
      next: (data: AcademicContainer[]) => {
        this.containers = data;
        this.treeNodes = this.buildTree(this.containers);
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading structure', err);
        this.loading = false;
      }
    });
  }

  buildTree(containers: AcademicContainer[]): TreeNode[] {
    const processContainer = (c: AcademicContainer): TreeNode => {
      const node: TreeNode = {
        label: c.containerName,
        data: c,
        expandedIcon: 'pi pi-folder-open',
        collapsedIcon: 'pi pi-folder',
        children: c.childContainers ? c.childContainers.map(child => processContainer(child)) : []
      };
      return node;
    };

    return containers.map(c => processContainer(c));
  }

  onNodeSelect(event: any) {
    this.selectedNode = event.node;
    this.selectedContainer = event.node.data;
  }

  addRootContainer() {
    this.editId = null;
    this.parentId = null;
    this.activeTabIndex = 0;
  }

  addChild(node: TreeNode | null) {
    if (!node) return;
    this.editId = null;
    this.parentId = node.data.containerId;
    this.activeTabIndex = 0;
  }

  editContainer(container: AcademicContainer) {
    this.parentId = null;
    this.editId = container.containerId as number;
    this.activeTabIndex = 0;
  }

  onFormSaveComplete() {
    this.activeTabIndex = 1;
    this.loadStructures();
  }

  onFormCancel() {
    this.activeTabIndex = 1;
  }

  deleteNode(node: TreeNode | null) {
    if (!node) return;
    this.confirmationService.confirm({
      message: `Are you sure you want to delete ${node.label} and all its children?`,
      accept: () => {
        if (node.data.containerId) {
          this.structureService.deleteContainer(node.data.containerId).subscribe(() => {
            this.loadStructures();
            this.selectedContainer = null;
            this.selectedNode = null;
          });
        }
      }
    });
  }

  openGenerateDialog() {
    this.generateDialogVisible = true;
  }

  submitDynamicStructure() {
    if (this.generatorForm.invalid || !this.currentYearId) return;

    this.confirmationService.confirm({
      message: 'This will dynamically generate the configured bulk structure. Proceed?',
      accept: () => {
        const template: StructureTemplate = this.generatorForm.value;
        this.structureService.generateDynamicStructure(this.orgId, this.currentYearId!, template).subscribe({
          next: () => {
            this.generateDialogVisible = false;
            this.loadStructures();
          },
          error: (err) => {
            console.error('Error generating structure', err);
          }
        });
      }
    });
  }
}
