import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddLeadComponent } from './add-lead.component';
import { provideRouter } from '@angular/router';

describe('AddLeadComponent', () => {
    let component: AddLeadComponent;
    let fixture: ComponentFixture<AddLeadComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AddLeadComponent],
            providers: [
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(AddLeadComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});