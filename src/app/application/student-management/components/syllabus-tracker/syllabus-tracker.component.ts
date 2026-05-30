import { Component, OnInit , ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccordionModule } from 'primeng/accordion';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';
import { SyllabusService } from '../../../syllabus-management/services/syllabus.service';
import { Syllabus } from '../../../../shared/models/syllabus.model';
import { ProgressBarComponent } from '../progress-bar/progress-bar.component';

@Component({
  selector: 'app-syllabus-tracker',
    changeDetection: ChangeDetectionStrategy.OnPush,
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
    const syllabusId = this.syllabusId(this.syllabus);
    if (!syllabusId) {
      this.loading = false;
      return;
    }

    this.syllabusService.getStudentProgress(this.studentId, syllabusId).subscribe({
      next: (progressData: any) => {
        this.completedTopics.clear();
        const topicProgress = progressData?.topicProgress ?? {};

        if (Array.isArray(progressData)) {
          progressData.forEach(progressItem => {
            if (progressItem.status === 'COMPLETED' && progressItem.topicId) {
              this.completedTopics.add(Number(progressItem.topicId));
            }
          });
        } else {
          Object.entries(topicProgress).forEach(([topicId, status]) => {
            if (status === 'COMPLETED') {
              this.completedTopics.add(Number(topicId));
            }
          });
        }

        this.progress = Number(progressData?.overallCompletion ?? this.calculateProgress());
        this.loading = false;
      },
      error: (err: any) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  isTopicCompleted(topicId: number | undefined): boolean {
    return topicId !== undefined && this.completedTopics.has(topicId);
  }

  toggleTopic(topic: any) {
    const topicId = this.topicId(topic);
    if (!topicId) {
      return;
    }

    const isCompleted = !this.completedTopics.has(topicId);
    if (isCompleted) {
      this.completedTopics.add(topicId);
    } else {
      this.completedTopics.delete(topicId);
    }

    const payload = {
      studentId: this.studentId,
      topicId,
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
    if (!this.syllabus) return 0;
    let totalTopics = 0;
    let completedCount = 0;

    this.syllabus.chapters.forEach(chapter => {
      if (chapter.topics) {
        totalTopics += chapter.topics.length;
        chapter.topics.forEach(topic => {
          const topicId = this.topicId(topic);
          if (topicId && this.completedTopics.has(topicId)) {
            completedCount++;
          }
        });
      }
    });

    this.progress = totalTopics === 0 ? 0 : Math.round((completedCount / totalTopics) * 100);
    return this.progress;
  }

  syllabusId(syllabus: Syllabus | undefined): number | undefined {
    return syllabus?.id ?? syllabus?.syllabusId;
  }

  chapterTitle(chapter: any): string {
    return chapter.name ?? chapter.chapterName ?? `Chapter ${chapter.chapterNumber ?? ''}`.trim();
  }

  topicId(topic: any): number | undefined {
    return topic.id ?? topic.topicId;
  }

  topicTitle(topic: any): string {
    return topic.name ?? topic.topicName ?? `Topic ${topic.topicNumber ?? ''}`.trim();
  }

  topicDuration(topic: any): string {
    if (topic.estimatedMinutes !== undefined) {
      return `${topic.estimatedMinutes} mins`;
    }

    if (topic.estimatedHours !== undefined) {
      return `${topic.estimatedHours} hrs`;
    }

    return '';
  }
}
