import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { admissionApi } from '../shared/constants/api.endpoint';

@Injectable({
  providedIn: 'root'
})
export class AdmissionService {

  constructor(private http: HttpClient) { }

  getFormConfig(): Observable<any> {
    return this.http.get(admissionApi.publicFormConfig);
  }

  submitAdmission(formValue: any): Observable<any> {
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
    return this.http.post(admissionApi.submit, formData);
  }

  saveDraft(formValue: any): Observable<any> {
    const draftPayload = this.preparePayload(formValue, true);
    return this.http.post(admissionApi.saveDraft, draftPayload);
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

    const payload: any = {
      // Use the applicationId from the form if it exists (for updating drafts)
      applicationId: formValue.applicationId,
      applicantName: `${basicInfo.first_name || ''} ${basicInfo.last_name || ''}`.trim(),
      dateOfBirth: dateOfBirth, // Use the formatted date string
      gender: basicInfo.gender?.name,
      applyingForSchoolOrCollege: basicInfo.applying_for_program?.name, // Updated from applying_for_school
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
      // Dynamic fields - collect all other fields from basicInfo
      ...this.collectDynamicFields(basicInfo),

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

  private collectDynamicFields(basicInfo: any): any {
    const staticFields = ['first_name', 'last_name', 'date_of_birth', 'gender'];
    const dynamicFields: any = {};

    Object.keys(basicInfo).forEach(key => {
      if (!staticFields.includes(key)) {
        // Map common fields to backend names if necessary, otherwise pass as is
        const mappedKey = this.mapToBackendKey(key);
        dynamicFields[mappedKey] = basicInfo[key]?.name !== undefined ? basicInfo[key].name : basicInfo[key];
      }
    });

    return dynamicFields;
  }

  private mapToBackendKey(key: string): string {
    const mapping: { [key: string]: string } = {
      'clinical_experience': 'clinicalExperience',
      'major_subject': 'majorSubject',
      'applying_for_program': 'applyingForSchoolOrCollege'
    };
    return mapping[key] || key;
  }
}