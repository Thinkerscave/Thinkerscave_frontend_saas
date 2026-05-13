import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { RouterModule, Router } from '@angular/router';
import { SyllabusService } from '../../services/syllabus.service';
import { Syllabus } from '../../../../shared/models/syllabus.model';
import { StandardListViewComponent } from '../../../../shared/components/standard-list-view/standard-list-view.component';
import { ListViewConfig } from '../../../../shared/components/standard-list-view/list-view-models';

@Component({
  selector: 'app-syllabus-version-history',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, TagModule, RouterModule, StandardListViewComponent],
  templateUrl: './syllabus-version-history.component.html',
  styleUrls: ['./syllabus-version-history.component.scss']
})
export class SyllabusVersionHistoryComponent implements OnInit {
  history: Syllabus[] = [];
  currentSyllabusId!: number;

  constructor(
    private syllabusService: SyllabusService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  get listViewConfig(): ListViewConfig {
    return {
      title: 'Syllabus Version History',
      isClientSide: true,
      showSearch: true,
      searchPlaceholder: 'Search versions...',
      loading: false, // loading state not managed originally
      primaryAction: {
        label: 'Create New Version',
        icon: 'pi pi-copy',
        actionFn: () => this.createNewVersion()
      },
      columns: [
        { field: 'version', header: 'Version', type: 'text', sortable: true },
        { field: 'status', header: 'Status', type: 'badge', sortable: true },
        { field: 'createdDate', header: 'Created Date', type: 'date', sortable: true },
        { field: 'approvedDate', header: 'Approved Date', type: 'date', sortable: true }
      ],
      rowActions: [
        {
          label: 'View / Edit',
          icon: 'pi pi-eye',
          isPrimary: true,
          actionFn: (ver) => this.router.navigate(['/application/academics/syllabus/edit', ver.id])
        }
      ]
    };
  }

  ngOnInit(): void {
    this.currentSyllabusId = this.route.snapshot.params['id'];
    this.loadHistory();
  }

  loadHistory() {
    this.syllabusService.getSyllabusHistory(this.currentSyllabusId).subscribe({
      next: (data: Syllabus[]) => {
        this.history = data;
      },
      error: (err: any) => console.error(err)
    });
  }

  createNewVersion() {
    this.syllabusService.createNewVersion(this.currentSyllabusId).subscribe({
      next: (newVer: Syllabus) => {
        console.log('New version created', newVer);
        this.loadHistory();
      },
      error: (err: any) => console.error(err)
    });
  }
}
