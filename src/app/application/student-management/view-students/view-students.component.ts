import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
export interface Student {
  id: number;
  studentName: string;
  parentName: string;
  class: string;
  section: string;
  rollNo: number;
}
@Component({
  selector: 'app-view-students',
  imports: [CommonModule,
    TableModule,
    ButtonModule,
    TooltipModule,
    RippleModule],
  templateUrl: './view-students.component.html',
  styleUrl: './view-students.component.scss'
})
export class ViewStudentsComponent {
  students: Student[] = [];
  @Output() editRequested = new EventEmitter<Student>();
  constructor() { }

  // 3. Populate the array with dummy data when the component initializes.
  ngOnInit(): void {
    this.students = [
      { id: 101, studentName: 'Aarav Sharma', parentName: 'Rohan Sharma', class: '10th', section: 'A', rollNo: 1 },
      { id: 102, studentName: 'Vivaan Patel', parentName: 'Mehul Patel', class: '10th', section: 'B', rollNo: 2 },
      { id: 103, studentName: 'Aditya Singh', parentName: 'Vikram Singh', class: '9th', section: 'A', rollNo: 5 },
      { id: 104, studentName: 'Diya Gupta', parentName: 'Sanjay Gupta', class: '11th', section: 'C', rollNo: 3 },
      { id: 105, studentName: 'Isha Verma', parentName: 'Anil Verma', class: '10th', section: 'A', rollNo: 4 },
      { id: 106, studentName: 'Kabir Kumar', parentName: 'Sunil Kumar', class: '12th', section: 'B', rollNo: 1 },
      { id: 107, studentName: 'Myra Reddy', parentName: 'Prakash Reddy', class: '9th', section: 'C', rollNo: 8 },
      { id: 108, studentName: 'Rhea Mishra', parentName: 'Dinesh Mishra', class: '11th', section: 'A', rollNo: 6 },
      { id: 109, studentName: 'Sai Joshi', parentName: 'Nitin Joshi', class: '10th', section: 'B', rollNo: 7 },
      { id: 110, studentName: 'Zara Khan', parentName: 'Imran Khan', class: '12th', section: 'A', rollNo: 2 },
    ];
  }

  // 4. Define placeholder methods for button actions.
  editStudent(student: Student) {
    console.log('Editing student:', student.studentName);
    this.editRequested.emit(student);
  }

  deleteStudent(student: Student) {
    console.log('Deleting student:', student.studentName);
    // In a real app, you would show a confirmation dialog before deleting.
    // Example: this.students = this.students.filter(s => s.id !== student.id);
  }

  downloadInfo(student: Student) {
    console.log('Downloading info for:', student.studentName);
    // In a real app, you would generate a PDF or CSV file.
  }

  showMore(student: Student) {
    console.log('Showing more details for:', student.studentName);
    // In a real app, you might expand a row or navigate to a details page.
  }
}
