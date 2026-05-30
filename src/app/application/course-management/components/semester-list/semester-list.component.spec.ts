import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SemesterListComponent } from './semester-list.component';
import { MessageService } from 'primeng/api';

describe('SemesterListComponent', () => {
    let component: SemesterListComponent;
    let fixture: ComponentFixture<SemesterListComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SemesterListComponent],
            providers: [
                MessageService
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(SemesterListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});