import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RestrictionOverridesComponent } from './restriction-overrides.component';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';

describe('RestrictionOverridesComponent', () => {
    let component: RestrictionOverridesComponent;
    let fixture: ComponentFixture<RestrictionOverridesComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RestrictionOverridesComponent],
            providers: [
                provideRouter([]),
                MessageService
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(RestrictionOverridesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});