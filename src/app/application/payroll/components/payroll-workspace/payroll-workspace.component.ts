import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-payroll-workspace',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './payroll-workspace.component.html',
  styleUrls: ['./payroll-workspace.component.scss']
})
export class PayrollWorkspaceComponent {}
