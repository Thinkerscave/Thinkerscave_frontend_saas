import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { EmptyStateComponent } from './empty-state.component';

describe('EmptyStateComponent', () => {
    let component: EmptyStateComponent;
    let fixture: ComponentFixture<EmptyStateComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EmptyStateComponent],
            providers: [provideNoopAnimations()]
        }).compileComponents();

        fixture = TestBed.createComponent(EmptyStateComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should emit action when CTA is triggered', () => {
        let emitted = false;
        component.action.subscribe(() => (emitted = true));
        component.action.emit();
        expect(emitted).toBeTrue();
    });
});
