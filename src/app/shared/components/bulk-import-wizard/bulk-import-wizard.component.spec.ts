import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MessageService } from 'primeng/api';

import { BulkImportWizardComponent } from './bulk-import-wizard.component';
import { BulkImportConfig } from './bulk-import-wizard.models';

interface SampleRow {
    name: string;
}

describe('BulkImportWizardComponent', () => {
    let component: BulkImportWizardComponent<SampleRow>;
    let fixture: ComponentFixture<BulkImportWizardComponent<SampleRow>>;

    const config: BulkImportConfig<SampleRow> = {
        parseFile: async () => [{ name: 'Alpha' }],
        validate: async rows => ({ validRows: rows, errors: [] }),
        execute: async rows => ({ imported: rows.length, skipped: 0, failed: 0 }),
        columns: [{ field: 'name', header: 'Name' }]
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [BulkImportWizardComponent],
            providers: [
                MessageService,
                provideNoopAnimations()
            ]
        }).compileComponents();

        fixture = TestBed.createComponent<BulkImportWizardComponent<SampleRow>>(BulkImportWizardComponent);
        component = fixture.componentInstance;
        component.config = config;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
