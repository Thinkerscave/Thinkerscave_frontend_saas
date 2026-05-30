import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LeadListComponent } from './lead-list.component';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';

describe('LeadListComponent', () => {
    let component: LeadListComponent;
    let fixture: ComponentFixture<LeadListComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LeadListComponent],
            providers: [
                provideRouter([]),
                MessageService
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(LeadListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});