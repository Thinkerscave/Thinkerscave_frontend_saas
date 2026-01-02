import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccordionModule } from 'primeng/accordion';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';
import { SyllabusService } from '../../../syllabus-management/services/syllabus.service';
import { Syllabus } from '../../../../shared/models/syllabus.model';
import { ProgressBarComponent } from '../progress-bar/progress-bar.component';

@Component({
  selector: 'app-syllabus-tracker',
  standalone: true,
  imports: [CommonModule, AccordionModule, CheckboxModule, FormsModule, ProgressBarComponent],
  templateUrl: './syllabus-tracker.component.html',
  styleUrls: ['./syllabus-tracker.component.scss']
})
export class SyllabusTrackerComponent implements OnInit {
  syllabus!: Syllabus;
  progress: number = 0;
  studentId: number = 1; // Mock student ID
  completedTopics: Set<number> = new Set();
  loading: boolean = true;

  constructor(private syllabusService: SyllabusService) { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    // Mock: fetching first syllabus for demo. In real app, fetch assigned syllabus for student.
    this.syllabusService.getAllSyllabi().subscribe({
      next: (syllabi: Syllabus[]) => {
        if (syllabi.length > 0) {
          this.syllabus = syllabi[0];
          this.loadProgress();
        } else {
          this.loading = false;
        }
      },
      error: (err: any) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  loadProgress() {
    if (!this.syllabus?.id) return;
    this.syllabusService.getStudentProgress(this.studentId, this.syllabus.id).subscribe({
      next: (progressData: any[]) => {
        // Assuming progressData is list of completed topic IDs or objects with topicId
        // For simplicity, let's assume it returns objects { topicId: 1, status: 'COMPLETED' }
        progressData.forEach(p => {
          if (p.status === 'COMPLETED') {
            this.completedTopics.add(p.topicId);
          }
        });
        this.calculateProgress();
        this.loading = false;
      },
      error: (err: any) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  isTopicCompleted(topicId: number): boolean {
    return this.completedTopics.has(topicId);
  }

  toggleTopic(topic: any, chapterId: number) {
    const isCompleted = !this.completedTopics.has(topic.id);
    if (isCompleted) {
      this.completedTopics.add(topic.id);
    } else {
      this.completedTopics.delete(topic.id);
    }

    const payload = {
      studentId: this.studentId,
      syllabusId: this.syllabus.id,
      chapterId: chapterId,
      topicId: topic.id,
      status: isCompleted ? 'COMPLETED' : 'PENDING'
    };

    this.syllabusService.updateProgress(payload).subscribe({
      next: () => {
        this.calculateProgress();
      },
      error: (err: any) => console.error('Failed to update progress', err)
    });
  }

  calculateProgress() {
    if (!this.syllabus) return;
    let totalTopics = 0;
    let completedCount = 0;

    this.syllabus.chapters.forEach(chapter => {
      if (chapter.topics) {
        totalTopics += chapter.topics.length;
        chapter.topics.forEach(topic => {
          // Check if topic.id is in completedTopics
          // Note: topic might not have ID if created purely client side without ID return?
          // We assume topics have IDs.
          if (topic.id && this.completedTopics.has(topic.id)) {
            completedCount++;
          }
        });
      }
    });

    this.progress = totalTopics === 0 ? 0 : Math.round((completedCount / totalTopics) * 100);
  }
}
