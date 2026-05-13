import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { RouterModule, Router } from '@angular/router';
import { TabsModule } from 'primeng/tabs';
import { SyllabusService } from '../../services/syllabus.service';
import { Syllabus } from '../../../../shared/models/syllabus.model';
import { SyllabusStatus } from '../../../../core/enums/syllabus-status.enum';
import { StandardListViewComponent } from '../../../../shared/components/standard-list-view/standard-list-view.component';
import { ListViewConfig } from '../../../../shared/components/standard-list-view/list-view-models';
import { SyllabusEditorComponent } from '../syllabus-editor/syllabus-editor.component';
import { LoginService } from '../../../../services/login.service';

@Component({
  selector: 'app-syllabus-list',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, TagModule, RouterModule, StandardListViewComponent, TabsModule, SyllabusEditorComponent],
  templateUrl: './syllabus-list.component.html',
  styleUrls: ['./syllabus-list.component.scss']
})
export class SyllabusListComponent implements OnInit {
  syllabi: Syllabus[] = [];
  loading: boolean = true;
  activeTabIndex: number = 1; // Default to View Tab
  editId: number | null = null;

  constructor(
    private syllabusService: SyllabusService,
    private router: Router,
    private loginService: LoginService
  ) { }

  get listViewConfig(): ListViewConfig {
    return {
      title: 'Syllabus Management',
      isClientSide: true,
      showSearch: true,
      searchPlaceholder: 'Search syllabi...',
      loading: this.loading,
      primaryAction: {
        label: 'Create New Syllabus',
        icon: 'pi pi-plus',
        visibleFn: () => this.loginService.getUserPrivileges().includes('MANAGE_SYLLABUS_ADD'),
        actionFn: () => {
          this.editId = null;
          this.activeTabIndex = 0;
        }
      },
      columns: [
        { field: 'syllabusCode', header: 'Code', type: 'text', sortable: true },
        { field: 'version', header: 'Version', type: 'text', sortable: true },
        { field: 'status', header: 'Status', type: 'badge', sortable: true },
        { field: 'approvedDate', header: 'Approved Date', type: 'date', sortable: true }
      ],
      rowActions: [
        {
          label: 'Edit',
          icon: 'pi pi-pencil',
          isPrimary: true,
          visibleFn: () => this.loginService.getUserPrivileges().includes('MANAGE_SYLLABUS_EDIT'),
          actionFn: (syllabus) => {
            if (syllabus.id) {
              this.editId = syllabus.id;
              this.activeTabIndex = 0;
            }
          }
        },
        {
          label: 'History',
          icon: 'pi pi-clock',
          isPrimary: true,
          color: 'secondary',
          visibleFn: () => this.loginService.getUserPrivileges().includes('MANAGE_SYLLABUS_VIEW'),
          actionFn: (syllabus) => this.router.navigate(['/application/academics/syllabus/history', syllabus.id])
        }
      ]
    };
  }

  ngOnInit(): void {
    this.loadSyllabi();
  }

  loadSyllabi(): void {
    this.loading = true;
    this.syllabusService.getAllSyllabi().subscribe({
      next: (data) => {
        this.syllabi = data;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  onEditorSaveComplete() {
    this.activeTabIndex = 1;
    this.loadSyllabi();
  }

  onEditorCancel() {
    this.activeTabIndex = 1;
  }
}
