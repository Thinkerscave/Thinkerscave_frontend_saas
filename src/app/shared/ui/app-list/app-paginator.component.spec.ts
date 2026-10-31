import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppPaginatorComponent } from './app-paginator.component';

describe('AppPaginatorComponent', () => {
  let fixture: ComponentFixture<AppPaginatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppPaginatorComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(AppPaginatorComponent);
  });

  it('hides pagination controls when all records fit on the current page', () => {
    fixture.componentInstance.totalRecords = 4;
    fixture.componentInstance.rows = 10;

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('nav.app-paginator')).toBeNull();
  });

  it('shows pagination controls when records exceed the current page size', () => {
    fixture.componentInstance.totalRecords = 11;
    fixture.componentInstance.rows = 10;

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('nav.app-paginator')).not.toBeNull();
  });
});
