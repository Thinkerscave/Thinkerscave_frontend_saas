import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { RouterModule } from '@angular/router';
import { SyllabusService } from '../../services/syllabus.service';
import { Syllabus } from '../../../../shared/models/syllabus.model';
import { SyllabusStatus } from '../../../../core/enums/syllabus-status.enum';

@Component({
  selector: 'app-syllabus-list',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, TagModule, RouterModule],
  templateUrl: './syllabus-list.component.html',
  styleUrls: ['./syllabus-list.component.scss']
})
export class SyllabusListComponent implements OnInit {
  syllabi: Syllabus[] = [];
  loading: boolean = true;

  constructor(private syllabusService: SyllabusService) { }

  ngOnInit(): void {
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

  getSeverity(status: SyllabusStatus) {
    switch (status) {
      case SyllabusStatus.PUBLISHED: return 'success';
      case SyllabusStatus.APPROVED: return 'info';
      case SyllabusStatus.DRAFT: return 'warning';
      case SyllabusStatus.ARCHIVED: return 'secondary';
      default: return 'info';
    }
  }
}
