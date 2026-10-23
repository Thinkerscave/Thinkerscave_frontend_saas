import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-front-desk-workspace',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  templateUrl: './front-desk-workspace.component.html',
  styleUrl: './front-desk-workspace.component.scss'
})
export class FrontDeskWorkspaceComponent {}
