import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AcademicSubjectsPageComponent } from './academic-subjects-page.component';

describe('AcademicSubjectsPageComponent', () => {
    let component: AcademicSubjectsPageComponent;
    let fixture: ComponentFixture<AcademicSubjectsPageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AcademicSubjectsPageComponent],
            providers: [
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(AcademicSubjectsPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});