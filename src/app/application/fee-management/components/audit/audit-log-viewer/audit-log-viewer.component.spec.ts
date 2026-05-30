import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuditLogViewerComponent } from './audit-log-viewer.component';
import { provideRouter } from '@angular/router';

describe('AuditLogViewerComponent', () => {
    let component: AuditLogViewerComponent;
    let fixture: ComponentFixture<AuditLogViewerComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AuditLogViewerComponent],
            providers: [
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(AuditLogViewerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});