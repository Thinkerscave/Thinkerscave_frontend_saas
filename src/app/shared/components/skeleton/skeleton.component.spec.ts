import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SkeletonComponent } from './skeleton.component';

describe('SkeletonComponent', () => {
    let component: SkeletonComponent;
    let fixture: ComponentFixture<SkeletonComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SkeletonComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(SkeletonComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should expand rows into an iterable array', () => {
        component.rows = 4;
        expect(component.rowsArr.length).toBe(4);
    });

    it('should clamp rows to at least 1', () => {
        component.rows = 0;
        expect(component.rowsArr.length).toBe(1);
    });

    it('should expand columns into an iterable array', () => {
        component.columns = 5;
        expect(component.columnsArr.length).toBe(5);
    });
});
