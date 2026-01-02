import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { RouterModule } from '@angular/router';
import { SyllabusService } from '../../services/syllabus.service';
import { Syllabus } from '../../../../shared/models/syllabus.model';

@Component({
  selector: 'app-syllabus-version-history',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, TagModule, RouterModule],
  templateUrl: './syllabus-version-history.component.html',
  styleUrls: ['./syllabus-version-history.component.scss']
})
export class SyllabusVersionHistoryComponent implements OnInit {
  history: Syllabus[] = [];
  currentSyllabusId!: number;

  constructor(
    private syllabusService: SyllabusService,
    private route: ActivatedRoute
  ) { }

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
