import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManageSalaryComponent } from './manage-salary.component';
import { MessageService } from 'primeng/api';

describe('ManageSalaryComponent', () => {
    let component: ManageSalaryComponent;
    let fixture: ComponentFixture<ManageSalaryComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ManageSalaryComponent],
            providers: [
                MessageService
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ManageSalaryComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});