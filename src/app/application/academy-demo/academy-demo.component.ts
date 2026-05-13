import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';

@Component({
    selector: 'app-academy-demo',
    standalone: true,
    imports: [CommonModule, CardModule],
    templateUrl: './academy-demo.component.html',
    styleUrls: ['./academy-demo.component.scss']
})
export class AcademyDemoComponent {
}
