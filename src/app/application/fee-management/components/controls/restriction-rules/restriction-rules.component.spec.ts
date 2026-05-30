import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RestrictionRulesComponent } from './restriction-rules.component';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';

describe('RestrictionRulesComponent', () => {
    let component: RestrictionRulesComponent;
    let fixture: ComponentFixture<RestrictionRulesComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RestrictionRulesComponent],
            providers: [
                provideRouter([]),
                MessageService
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(RestrictionRulesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});