import { CommonModule } from '@angular/common';
import { Component, EventEmitter, NgModule, Output , ChangeDetectionStrategy} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { FileUpload } from 'primeng/fileupload';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';
export interface DocumentRow {
  docName: string;
  file: File | null;
}
@Component({
  selector: 'app-file-uploader',
    changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule,
    FormsModule,
    CardModule,
    InputTextModule,
    ButtonModule, FileUpload, TooltipModule, RippleModule],
  templateUrl: './file-uploader.component.html',
  styleUrl: './file-uploader.component.scss'
})
export class FileUploaderComponent {
  // This array holds the state for all the document rows displayed on the screen.
  // It is initialized with one empty row to ensure the form is visible on load.
  documents: DocumentRow[] = [
    { docName: '', file: null }
  ];

  @Output() documentsReady = new EventEmitter<{ files: File[], types: string[] }>();

  constructor() { }

  /**
   * Adds a new, empty document row to the 'documents' array, which
   * causes a new row to be rendered in the template.
   */
  addDocumentRow(): void {
    this.documents.push({
      docName: '',
      file: null
    });
  }

  /**
   * Removes a specific document row from the array using its index.
   * @param index The index of the row to remove.
   */
  removeDocumentRow(index: number): void {

    this.documents.splice(index, 1);
  }

  /**
   * Resets the form back to its original state: a single empty row.
   */
  cancel(): void {
    this.documents = [
      { docName: '', file: null }
    ];
  }

  /**
   * Handles the file selection event from the PrimeNG p-fileUpload component.
   * @param event The file upload event, which contains the selected file(s).
   * @param index The index of the row where the file was selected.
   */
  onFileSelect(event: any, index: number): void {
    // PrimeNG p-fileUpload (onSelect) emits { files: File[], originalEvent: Event }
    // NOT a native DOM event — so event.target is undefined.
    const file: File = event?.files?.[0] ?? event?.currentFiles?.[0];
    if (file) {
      this.documents[index].file = file;
    }
  }

  /**
   * Gathers all the data and prepares it for submission.
   * In a real app, this would send the data to a backend service.
   */
  submitAll(): void {
    // Basic validation to check if all fields are filled.
    const isValid = this.documents.every(doc => doc.docName.trim() !== '' && doc.file !== null);

    if (isValid) {
      const files = this.documents.map(doc => doc.file!) as File[];
      const types = this.documents.map(doc => doc.docName.trim());
      // Emit to parent
      this.documentsReady.emit({ files, types });
    } else {
      alert('Please ensure every row has a document name and an uploaded file.');
    }
  }
}

