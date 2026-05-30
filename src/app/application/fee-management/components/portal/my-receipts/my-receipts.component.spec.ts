import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyReceiptsComponent } from './my-receipts.component';
import { provideRouter } from '@angular/router';

describe('MyReceiptsComponent', () => {
    let component: MyReceiptsComponent;
    let fixture: ComponentFixture<MyReceiptsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MyReceiptsComponent],
            providers: [
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(MyReceiptsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});