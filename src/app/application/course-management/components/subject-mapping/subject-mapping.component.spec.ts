import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SubjectMappingComponent } from './subject-mapping.component';
import { provideRouter } from '@angular/router';

describe('SubjectMappingComponent', () => {
    let component: SubjectMappingComponent;
    let fixture: ComponentFixture<SubjectMappingComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SubjectMappingComponent],
            providers: [
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(SubjectMappingComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});