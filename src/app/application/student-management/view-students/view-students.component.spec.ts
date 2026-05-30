import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViewStudentsComponent } from './view-students.component';
import { MessageService } from 'primeng/api';

describe('ViewStudentsComponent', () => {
    let component: ViewStudentsComponent;
    let fixture: ComponentFixture<ViewStudentsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ViewStudentsComponent],
            providers: [
                MessageService
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ViewStudentsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});