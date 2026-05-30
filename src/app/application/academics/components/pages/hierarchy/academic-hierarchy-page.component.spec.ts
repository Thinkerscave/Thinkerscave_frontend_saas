import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AcademicHierarchyPageComponent } from './academic-hierarchy-page.component';

describe('AcademicHierarchyPageComponent', () => {
    let component: AcademicHierarchyPageComponent;
    let fixture: ComponentFixture<AcademicHierarchyPageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AcademicHierarchyPageComponent],
            providers: [
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(AcademicHierarchyPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});