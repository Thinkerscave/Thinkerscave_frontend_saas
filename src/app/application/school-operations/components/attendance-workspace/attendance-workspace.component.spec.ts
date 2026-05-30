import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AttendanceWorkspaceComponent } from './attendance-workspace.component';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';

describe('AttendanceWorkspaceComponent', () => {
    let component: AttendanceWorkspaceComponent;
    let fixture: ComponentFixture<AttendanceWorkspaceComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AttendanceWorkspaceComponent],
            providers: [
                provideRouter([]),
                MessageService
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(AttendanceWorkspaceComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});