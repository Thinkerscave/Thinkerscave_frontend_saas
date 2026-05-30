import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OpsNavComponent } from './operations-primitives.component';
import { provideRouter } from '@angular/router';

describe('OpsNavComponent', () => {
    let component: OpsNavComponent;
    let fixture: ComponentFixture<OpsNavComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [OpsNavComponent],
            providers: [
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(OpsNavComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});