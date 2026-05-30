import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AcademicSyllabusPageComponent } from './academic-syllabus-page.component';

describe('AcademicSyllabusPageComponent', () => {
    let component: AcademicSyllabusPageComponent;
    let fixture: ComponentFixture<AcademicSyllabusPageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AcademicSyllabusPageComponent],
            providers: [
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(AcademicSyllabusPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});