import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CounsellorDashboardComponent } from './counsellor-dashboard.component';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';

describe('CounsellorDashboardComponent', () => {
    let component: CounsellorDashboardComponent;
    let fixture: ComponentFixture<CounsellorDashboardComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CounsellorDashboardComponent],
            providers: [
                provideRouter([]),
                MessageService
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(CounsellorDashboardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});