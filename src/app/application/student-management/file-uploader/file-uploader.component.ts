import { CommonModule } from '@angular/common';
import { Component, EventEmitter, NgModule, Output } from '@angular/core';
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
    const file: File = event.target.files[0];
    if (file) { 
      // Update the 'file' property of the correct document object in the array.
      this.documents[index].file = file;
      
    }
  }

  /**
   * Gathers all the data and prepares it for submission.
   * In a real app, this would send the data to a backend service.
   */
  submitAll(): void {
    console.log("Submitting all documents:", this.documents);

    // Basic validation to check if all fields are filled.
    const isValid = this.documents.every(doc => doc.docName.trim() !== '' && doc.file !== null);

    if (isValid) {
      // In a real application, you would use a service to send this data
      // to your server, likely as multipart/form-data.

      const files = this.documents.map(doc => doc.file!) as File[];
      const types = this.documents.map(doc => doc.docName.trim());

      alert(types)
      alert(files)

      // Emit to parent
      this.documentsReady.emit({ files, types });
      alert('All documents are valid and ready for submission! (Check the console for data)');
    } else {
      alert('Please ensure every row has a document name and an uploaded file.');
    }
  }
}

