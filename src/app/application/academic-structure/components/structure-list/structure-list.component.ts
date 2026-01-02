import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { AcademicStructureService } from '../../services/academic-structure.service';
import { AcademicContainer } from '../../../../shared/models/academic-container.model';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-structure-list',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, RouterModule],
  templateUrl: './structure-list.component.html',
  styleUrls: ['./structure-list.component.scss']
})
export class StructureListComponent implements OnInit {
  containers: AcademicContainer[] = [];
  loading: boolean = true;

  constructor(private structureService: AcademicStructureService) { }

  ngOnInit(): void {
    this.loadStructures();
  }

  loadStructures() {
    this.structureService.getAllContainers().subscribe({
      next: (data: AcademicContainer[]) => {
        this.containers = data;
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading structure', err);
        this.loading = false;
      }
    });
  }
}
