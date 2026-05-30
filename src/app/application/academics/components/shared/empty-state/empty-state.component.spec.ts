import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AcademicEmptyStateComponent } from './empty-state.component';

describe('AcademicEmptyStateComponent', () => {
    let component: AcademicEmptyStateComponent;
    let fixture: ComponentFixture<AcademicEmptyStateComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AcademicEmptyStateComponent],
            providers: [
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(AcademicEmptyStateComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});