import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, DropdownModule],
  templateUrl: './student-dashboard.component.html',
  styleUrl: './student-dashboard.component.scss'
})
export class StudentDashboardComponent {
  campusSummary = [
    { label: 'Active Students', value: '1,248', delta: '+32', detail: 'this week', icon: 'pi pi-users' },
    { label: 'Average Attendance', value: '92.4%', delta: '+1.3%', detail: 'vs last term', icon: 'pi pi-calendar' },
    { label: 'Average GPA', value: '3.46', delta: '+0.08', detail: 'semester-to-date', icon: 'pi pi-chart-line' },
    { label: 'Assignments Due', value: '183', delta: '41 overdue', detail: 'next 7 days', icon: 'pi pi-book' },
  ];

  filterOptions = {
    campuses: [
      { label: 'All Campuses', value: 'all' },
      { label: 'North Campus', value: 'north' },
      { label: 'Central Campus', value: 'central' },
      { label: 'Innovation Hub', value: 'innovation' },
    ],
    grades: [
      { label: 'All Grades', value: 'all' },
      { label: 'Grade 9', value: '9' },
      { label: 'Grade 10', value: '10' },
      { label: 'Grade 11', value: '11' },
      { label: 'Grade 12', value: '12' },
    ],
    cohorts: [
      { label: 'All Cohorts', value: 'all' },
      { label: 'STEM Scholars', value: 'stem' },
      { label: 'Humanities', value: 'humanities' },
      { label: 'Athlete Program', value: 'athlete' },
      { label: 'Arts Collective', value: 'arts' },
    ],
  };

  selectedCampus = 'all';
  selectedGrade = 'all';
  selectedCohort = 'all';

  studentSnapshots = [
    {
      name: 'Aarav Sharma',
      grade: '12',
      cohort: 'STEM Scholars',
      attendance: '96%',
      gpa: '3.92',
      offenses: 0,
      risk: 'Low',
      nextAction: 'Senior thesis review',
    },
    {
      name: 'Diya Patel',
      grade: '11',
      cohort: 'Arts Collective',
      attendance: '88%',
      gpa: '3.21',
      offenses: 1,
      risk: 'Medium',
      nextAction: 'Parent conference 22 Nov',
    },
    {
      name: 'Kabir Kumar',
      grade: '10',
      cohort: 'Athlete Program',
      attendance: '79%',
      gpa: '2.94',
      offenses: 3,
      risk: 'High',
      nextAction: 'Attendance intervention',
    },
    {
      name: 'Myra Reddy',
      grade: '9',
      cohort: 'Humanities',
      attendance: '94%',
      gpa: '3.58',
      offenses: 0,
      risk: 'Low',
      nextAction: 'Debate prep feedback',
    },
    {
      name: 'Rhea Mishra',
      grade: '11',
      cohort: 'STEM Scholars',
      attendance: '89%',
      gpa: '3.75',
      offenses: 0,
      risk: 'Medium',
      nextAction: 'Lab redo submission',
    },
  ];

  alertFeed = [
    {
      title: 'Attendance below 80%',
      detail: '7 students flagged this week · top concern Grade 10',
      severity: 'high',
    },
    {
      title: 'Scholarship review pending',
      detail: '24 senior students missing financial docs',
      severity: 'medium',
    },
    {
      title: 'Parent feedback window',
      detail: 'Close surveys by 25 Nov to finalize term reports',
      severity: 'low',
    },
  ];
}
