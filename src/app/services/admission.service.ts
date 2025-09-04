import { Injectable } from '@angular/core';
import { environment } from '../environment/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdmissionService {
 
     
  private apiUrl = `${environment.baseUrl}/admissions`;

  constructor(private http: HttpClient) { }

  submitAdmission(formValue: any): Observable<any> {
    const submissionUrl = `${this.apiUrl}/submit`;
    const preparedPayload = this.preparePayload(formValue);

    const formData = new FormData();
    const documents = preparedPayload.documents;
    const applicationData = { ...preparedPayload };
    delete applicationData.documents;

    formData.append(
      'applicationData', 
      new Blob([JSON.stringify(applicationData)], { type: 'application/json' })
    );

    if (documents && documents.length > 0) {
      documents.forEach((doc: { file: File, fileName: string }) => {
        if (doc.file) {
          formData.append('documents', doc.file, doc.fileName);
        }
      });
    }
    return this.http.post(submissionUrl, formData);
  }

  saveDraft(formValue: any): Observable<any> {
    const draftUrl = `${this.apiUrl}/draft`;
    const draftPayload = this.preparePayload(formValue, true); // Prepare payload for draft
    return this.http.post(draftUrl, draftPayload);
  }

  /**
   * A private helper method to transform raw form data into the structure the backend expects.
   * @param formValue The raw value from the admissionForm.
   * @param isDraft A boolean to indicate if this is for a draft save.
   * @returns A clean payload object.
   */
  private preparePayload(formValue: any, isDraft: boolean = false): any {
    const basicInfo = formValue.basicInfo || {};
    const parentDetails = formValue.parentDetails || {};
    const address = formValue.address || {};
    const emergencyContact = formValue.emergencyContact || {};

    // --- FIX IS HERE ---
    // Convert the date object to an ISO string and remove the trailing 'Z' for UTC.
    const dateOfBirth = basicInfo.date_of_birth 
      ? new Date(basicInfo.date_of_birth).toISOString().slice(0, -1) 
      : null;

    const payload = {
      // Use the applicationId from the form if it exists (for updating drafts)
      applicationId: formValue.applicationId, 
      applicantName: `${basicInfo.first_name || ''} ${basicInfo.last_name || ''}`.trim(),
      dateOfBirth: dateOfBirth, // Use the formatted date string
      gender: basicInfo.gender?.name,
      applyingForSchoolOrCollege: basicInfo.applying_for_school?.name,
      parentName: parentDetails.parent_name,
      guardianName: parentDetails.guardian_name,
      contactNumber: parentDetails.contact_number,
      email: parentDetails.email,
      address: {
        street: address.street,
        city: address.city,
        state: address.state,
        pinCode: address.pincode
      },
      emergencyContact: {
        name: emergencyContact.name,
        number: emergencyContact.number
      },
      // Keep original documents array for final submission
      documents: formValue.documents || [] 
    };

    // For drafts, we only want the file names, not the file objects
    if (isDraft) {
      const draftPayload: any = { ...payload };
      draftPayload.uploadedDocuments = draftPayload.documents.map((doc: { fileName: string }) => doc.fileName);
      delete draftPayload.documents;
      return draftPayload;
    }

    return payload;
  }
}