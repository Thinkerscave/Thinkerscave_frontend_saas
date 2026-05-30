import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AcademicCurriculumPageComponent } from './academic-curriculum-page.component';

describe('AcademicCurriculumPageComponent', () => {
    let component: AcademicCurriculumPageComponent;
    let fixture: ComponentFixture<AcademicCurriculumPageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AcademicCurriculumPageComponent],
            providers: [
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(AcademicCurriculumPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});