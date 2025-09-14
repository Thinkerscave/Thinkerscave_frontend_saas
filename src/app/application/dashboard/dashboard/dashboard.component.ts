import { Component } from '@angular/core';
import { StudentDashboardComponent } from '../student-dashboard/student-dashboard.component';
import { BreadCrumbService } from '../../../services/bread-crumb.service';

@Component({
  selector: 'app-dashboard',
  imports: [StudentDashboardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  constructor(private breadcrumbService: BreadCrumbService) {}

  ngOnInit() {
    // ✅ Set breadcrumb when dashboard loads
    this.breadcrumbService.setBreadcrumb('Dashboard', '');
  }
}
