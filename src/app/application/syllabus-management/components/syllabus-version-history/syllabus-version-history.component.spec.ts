import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SyllabusVersionHistoryComponent } from './syllabus-version-history.component';
import { provideRouter } from '@angular/router';

describe('SyllabusVersionHistoryComponent', () => {
    let component: SyllabusVersionHistoryComponent;
    let fixture: ComponentFixture<SyllabusVersionHistoryComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SyllabusVersionHistoryComponent],
            providers: [
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(SyllabusVersionHistoryComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});