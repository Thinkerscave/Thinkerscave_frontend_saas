import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LateFeeConfigComponent } from './late-fee-config.component';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';

describe('LateFeeConfigComponent', () => {
    let component: LateFeeConfigComponent;
    let fixture: ComponentFixture<LateFeeConfigComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LateFeeConfigComponent],
            providers: [
                provideRouter([]),
                MessageService
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(LateFeeConfigComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});