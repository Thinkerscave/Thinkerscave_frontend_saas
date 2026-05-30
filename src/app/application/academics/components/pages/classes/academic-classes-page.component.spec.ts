import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AcademicClassesPageComponent } from './academic-classes-page.component';

describe('AcademicClassesPageComponent', () => {
    let component: AcademicClassesPageComponent;
    let fixture: ComponentFixture<AcademicClassesPageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AcademicClassesPageComponent],
            providers: [
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(AcademicClassesPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});