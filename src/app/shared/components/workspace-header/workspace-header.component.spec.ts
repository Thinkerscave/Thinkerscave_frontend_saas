import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { WorkspaceHeaderComponent } from './workspace-header.component';

describe('WorkspaceHeaderComponent', () => {
    let component: WorkspaceHeaderComponent;
    let fixture: ComponentFixture<WorkspaceHeaderComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [WorkspaceHeaderComponent],
            providers: [
                provideRouter([]),
                provideNoopAnimations()
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(WorkspaceHeaderComponent);
        component = fixture.componentInstance;
        component.title = 'Workspace';
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should render the supplied title', () => {
        expect(component.title).toBe('Workspace');
    });
});
