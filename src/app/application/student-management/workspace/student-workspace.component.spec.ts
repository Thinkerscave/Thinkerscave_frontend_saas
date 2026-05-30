import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StudentWorkspaceComponent } from './student-workspace.component';
import { provideRouter } from '@angular/router';

describe('StudentWorkspaceComponent', () => {
    let component: StudentWorkspaceComponent;
    let fixture: ComponentFixture<StudentWorkspaceComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [StudentWorkspaceComponent],
            providers: [
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(StudentWorkspaceComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});