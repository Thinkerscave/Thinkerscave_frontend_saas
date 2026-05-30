import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdjustmentFormComponent } from './adjustment-form.component';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';

describe('AdjustmentFormComponent', () => {
    let component: AdjustmentFormComponent;
    let fixture: ComponentFixture<AdjustmentFormComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AdjustmentFormComponent],
            providers: [
                provideRouter([]),
                MessageService
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(AdjustmentFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});