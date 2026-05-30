import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkflowNavComponent } from './workflow-primitives.component';
import { provideRouter } from '@angular/router';

describe('WorkflowNavComponent', () => {
    let component: WorkflowNavComponent;
    let fixture: ComponentFixture<WorkflowNavComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [WorkflowNavComponent],
            providers: [
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(WorkflowNavComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});