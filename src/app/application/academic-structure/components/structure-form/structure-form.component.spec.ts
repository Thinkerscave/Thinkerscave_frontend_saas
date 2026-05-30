import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StructureFormComponent } from './structure-form.component';
import { provideRouter } from '@angular/router';

describe('StructureFormComponent', () => {
    let component: StructureFormComponent;
    let fixture: ComponentFixture<StructureFormComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [StructureFormComponent],
            providers: [
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(StructureFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});