import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LeadDetailComponent } from './lead-detail.component';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';

describe('LeadDetailComponent', () => {
    let component: LeadDetailComponent;
    let fixture: ComponentFixture<LeadDetailComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LeadDetailComponent],
            providers: [
                provideRouter([]),
                MessageService
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(LeadDetailComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});