import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StructureListComponent } from './structure-list.component';
import { provideRouter } from '@angular/router';

describe('StructureListComponent', () => {
    let component: StructureListComponent;
    let fixture: ComponentFixture<StructureListComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [StructureListComponent],
            providers: [
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(StructureListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});