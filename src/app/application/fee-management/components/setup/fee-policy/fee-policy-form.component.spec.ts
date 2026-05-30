import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeePolicyFormComponent } from './fee-policy-form.component';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';

describe('FeePolicyFormComponent', () => {
    let component: FeePolicyFormComponent;
    let fixture: ComponentFixture<FeePolicyFormComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FeePolicyFormComponent],
            providers: [
                provideRouter([]),
                MessageService
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(FeePolicyFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});