import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyFeesDashboardComponent } from './my-fees-dashboard.component';
import { provideRouter } from '@angular/router';

describe('MyFeesDashboardComponent', () => {
    let component: MyFeesDashboardComponent;
    let fixture: ComponentFixture<MyFeesDashboardComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MyFeesDashboardComponent],
            providers: [
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(MyFeesDashboardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});