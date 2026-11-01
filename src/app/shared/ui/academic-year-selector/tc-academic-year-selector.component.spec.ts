import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AcademicYearContextService } from '../../services/academic-year-context.service';
import { TcAcademicYearSelectorComponent } from './tc-academic-year-selector.component';

describe('TcAcademicYearSelectorComponent', () => {
  let fixture: ComponentFixture<TcAcademicYearSelectorComponent>;
  let component: TcAcademicYearSelectorComponent;
  let selectYear: jasmine.Spy;

  beforeEach(async () => {
    selectYear = jasmine.createSpy('selectYear');
    await TestBed.configureTestingModule({
      imports: [TcAcademicYearSelectorComponent],
      providers: [{
        provide: AcademicYearContextService,
        useValue: {
          years: () => [],
          selectedYearId: () => null,
          loading: () => false,
          selectedYearLabel: () => '',
          ensureLoaded: () => of([]),
          selectedYearId$: of(null),
          selectYear
        }
      }]
    }).compileComponents();

    fixture = TestBed.createComponent(TcAcademicYearSelectorComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('options', [
      { academicYearId: 1, name: '2026-27', status: 'CURRENT' },
      { academicYearId: 2, name: '2025-26', status: 'ACTIVE' }
    ]);
    fixture.componentRef.setInput('value', 1);
    fixture.detectChanges();
  });

  it('uses supplied years without changing the shared academic-year context', () => {
    expect(fixture.nativeElement.textContent).toContain('2026-27');

    const change = jasmine.createSpy('yearChange');
    component.yearChange.subscribe(change);
    const trigger = fixture.nativeElement.querySelector('.tc-ay__trigger') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
    const option = fixture.nativeElement.querySelector('[role="option"]') as HTMLButtonElement;
    option.click();

    expect(change).toHaveBeenCalledOnceWith(1);
    expect(selectYear).not.toHaveBeenCalled();
  });
});
