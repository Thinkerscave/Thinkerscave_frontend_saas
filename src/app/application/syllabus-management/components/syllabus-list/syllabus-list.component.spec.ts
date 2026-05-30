import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SyllabusListComponent } from './syllabus-list.component';
import { provideRouter } from '@angular/router';

describe('SyllabusListComponent', () => {
    let component: SyllabusListComponent;
    let fixture: ComponentFixture<SyllabusListComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SyllabusListComponent],
            providers: [
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(SyllabusListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});