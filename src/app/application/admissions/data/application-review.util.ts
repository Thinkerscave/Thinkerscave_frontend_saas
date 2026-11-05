import { ApplicationProfileDetails, ApplicationRecord } from '../models/admissions-crm.model';
import { formatAdmissionsLabel } from './admissions-workspace.config';

export interface ReviewField {
  label: string;
  value: string;
  empty?: boolean;
}

export interface ReviewSection {
  key: string;
  title: string;
  icon: string;
  fields: ReviewField[];
}

/** Show a dash for missing values so reviewers see what was not filled. */
export function displayReviewValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  const text = String(value).trim();
  return text ? text : '—';
}

export function reviewField(label: string, value: unknown): ReviewField {
  const display = displayReviewValue(value);
  return { label, value: display, empty: display === '—' };
}

function joinAddress(parts: Array<string | null | undefined>): string {
  return parts.map(p => (p || '').trim()).filter(Boolean).join(', ');
}

/** Full read-only sections for approver overview (from saved application). */
export function buildApplicationReviewSections(app: ApplicationRecord): ReviewSection[] {
  const p: ApplicationProfileDetails = app.profile ?? {};
  const present = joinAddress([
    p.addressLine1,
    p.addressLine2,
    p.landmark,
    p.city,
    p.district,
    p.state,
    p.country,
    p.pinCode
  ]) || displayReviewValue(app.address);

  const permanent = p.sameAsPresentAddress
    ? 'Same as present address'
    : joinAddress([
        p.permanentAddressLine1,
        p.permanentAddressLine2,
        p.permanentLandmark,
        p.permanentCity,
        p.permanentDistrict,
        p.permanentState,
        p.permanentCountry,
        p.permanentPinCode
      ]);
  const additionalGuardians = p.guardians?.filter(guardian => !guardian.primaryContact) ?? [];
  const guardianFields = additionalGuardians.length
    ? additionalGuardians.flatMap((guardian, index) => [
        reviewField(`Additional guardian ${index + 1}`, guardian.fullName),
        reviewField('Relationship', guardian.relationship),
        reviewField('Mobile', guardian.mobile),
        reviewField('Email', guardian.email),
        reviewField('Occupation', guardian.occupation)
      ])
    : [
        reviewField('Secondary guardian', p.secondaryGuardianName || p.motherName),
        reviewField('Secondary relationship', p.secondaryGuardianRelationship || p.motherRelationship),
        reviewField('Secondary mobile', p.secondaryGuardianMobile || p.motherContact),
        reviewField('Secondary email', p.secondaryGuardianEmail || p.motherEmail),
        reviewField('Secondary occupation', p.secondaryGuardianOccupation || p.motherOccupation)
      ];

  return [
    {
      key: 'student',
      title: 'Student',
      icon: 'pi pi-user',
      fields: [
        reviewField('Full name', app.applicantName),
        reviewField('Date of birth', app.dateOfBirth),
        reviewField('Gender', app.gender),
        reviewField('Blood group', p.bloodGroup),
        reviewField('Nationality', p.nationality),
        reviewField('Social category', p.socialCategory ?? p.category),
        reviewField('Mother tongue', p.motherTongue),
        reviewField('Email', app.email),
        reviewField('Mobile', app.contactNumber),
        reviewField('ID type', p.identityDocumentType ? formatAdmissionsLabel(p.identityDocumentType) : null),
        reviewField('ID number', p.identityDocumentNumber || p.aadhaarNumber)
      ]
    },
    {
      key: 'family',
      title: 'Parent / Guardian',
      icon: 'pi pi-users',
      fields: [
        reviewField('Primary guardian', app.parentName),
        reviewField('Relationship', p.parentRelationship),
        reviewField('Mobile', app.parentContact),
        reviewField('Email', app.parentEmail),
        reviewField('Occupation', p.fatherOccupation),
        ...guardianFields,
        reviewField('Emergency contact', p.emergencyContactName),
        reviewField('Emergency relationship', p.emergencyContactRelationship),
        reviewField('Emergency mobile', p.emergencyContactMobile),
        reviewField('Emergency alternate', p.emergencyContactAlternateMobile)
      ]
    },
    {
      key: 'address',
      title: 'Address',
      icon: 'pi pi-map-marker',
      fields: [
        reviewField('Present address', present),
        reviewField('City', p.city),
        reviewField('State', p.state),
        reviewField('PIN', p.pinCode),
        reviewField('Country', p.country),
        reviewField('Permanent address', permanent || '—')
      ]
    },
    {
      key: 'academic',
      title: 'Academic & admission',
      icon: 'pi pi-book',
      fields: [
        reviewField('Applying for class', app.applyingForClass),
        reviewField('Previous schooling', p.hasPreviousSchooling),
        reviewField('Previous school', p.previousSchoolName),
        reviewField('Previous board', p.previousBoard),
        reviewField('Previous class', p.previousClass),
        reviewField('Previous year', p.previousAcademicYear),
        reviewField('Last percentage', p.lastPercentage),
        reviewField('TC number', p.tcNumber),
        reviewField('TC date', p.tcDate),
        reviewField('Medium', p.mediumOfInstruction),
        reviewField('First language', p.firstLanguage),
        reviewField('Second language', p.secondLanguage),
        reviewField('Sibling', p.siblingName)
      ]
    }
  ];
}
