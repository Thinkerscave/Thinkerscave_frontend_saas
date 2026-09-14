import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-expenses-workspace',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './expenses-workspace.component.html',
  styleUrls: ['./expenses-workspace.component.scss']
})
export class ExpensesWorkspaceComponent {}
