import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeePolicyListComponent } from './fee-policy-list.component';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';

describe('FeePolicyListComponent', () => {
    let component: FeePolicyListComponent;
    let fixture: ComponentFixture<FeePolicyListComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FeePolicyListComponent],
            providers: [
                provideRouter([]),
                MessageService
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(FeePolicyListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});