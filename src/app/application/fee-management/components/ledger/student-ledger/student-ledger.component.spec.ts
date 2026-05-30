import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StudentLedgerComponent } from './student-ledger.component';
import { provideRouter } from '@angular/router';

describe('StudentLedgerComponent', () => {
    let component: StudentLedgerComponent;
    let fixture: ComponentFixture<StudentLedgerComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [StudentLedgerComponent],
            providers: [
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(StudentLedgerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});