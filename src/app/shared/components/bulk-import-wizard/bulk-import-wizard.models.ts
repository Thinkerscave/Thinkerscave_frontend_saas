/**
 * Contract that the page hosting the wizard implements.
 *
 *  - {@link parseFile}  parses an uploaded file into rows of arbitrary shape
 *  - {@link validate}   inspects parsed rows and returns per-row errors
 *  - {@link execute}    persists the accepted rows server-side
 *  - {@link templateUrl} optional download URL for a template CSV/XLSX
 */
export interface BulkImportConfig<TRow = any> {
  templateUrl?: string;
  acceptedFileTypes?: string[];
  maxFileSizeBytes?: number;
  parseFile: (file: File) => Promise<TRow[]>;
  validate: (rows: TRow[]) => Promise<BulkImportValidationResult<TRow>>;
  execute: (rows: TRow[]) => Promise<BulkImportExecutionResult>;
  columns: BulkImportColumn<TRow>[];
}

export interface BulkImportColumn<TRow = any> {
  field: keyof TRow & string;
  header: string;
  width?: string;
}

export interface BulkImportRowError {
  rowIndex: number;
  field?: string;
  message: string;
}

export interface BulkImportValidationResult<TRow = any> {
  validRows: TRow[];
  errors: BulkImportRowError[];
}

export interface BulkImportExecutionResult {
  imported: number;
  skipped: number;
  failed: number;
  message?: string;
}
