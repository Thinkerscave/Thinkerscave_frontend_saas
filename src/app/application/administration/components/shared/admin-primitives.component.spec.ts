import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminNavComponent } from './admin-primitives.component';
import { provideRouter } from '@angular/router';

describe('AdminNavComponent', () => {
    let component: AdminNavComponent;
    let fixture: ComponentFixture<AdminNavComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AdminNavComponent],
            providers: [
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(AdminNavComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});