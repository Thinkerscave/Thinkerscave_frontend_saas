import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StudentAdmissionFormComponent } from './student-admission-form.component';
import { MessageService } from 'primeng/api';

describe('StudentAdmissionFormComponent', () => {
    let component: StudentAdmissionFormComponent;
    let fixture: ComponentFixture<StudentAdmissionFormComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [StudentAdmissionFormComponent],
            providers: [
                MessageService
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(StudentAdmissionFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});