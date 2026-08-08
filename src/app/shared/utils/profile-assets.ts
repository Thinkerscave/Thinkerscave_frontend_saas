/**
 * Deterministic demo profile photo helpers.
 * Used when API photoUrl is empty so directories/profiles still show real imagery.
 */
const STUDENT_PHOTOS = [
  '/assets/profiles/students/student1.jpg',
  '/assets/profiles/students/student2.jpg',
  '/assets/profiles/students/student3.jpg',
  '/assets/profiles/students/student4.jpg',
  '/assets/profiles/students/student5.jpg',
  '/assets/profiles/students/student6.jpg'
] as const;

const STAFF_PHOTOS = [
  '/assets/profiles/staff/teacher1.jpg',
  '/assets/profiles/staff/teacher2.jpg',
  '/assets/profiles/staff/teacher3.jpg',
  '/assets/profiles/staff/teacher4.jpg',
  '/assets/profiles/staff/teacher5.jpg'
] as const;

export function resolveStudentPhotoUrl(
  id: number | null | undefined,
  existing?: string | null
): string | null {
  if (existing) {
    return existing;
  }
  if (id == null || !Number.isFinite(id) || id <= 0) {
    return null;
  }
  return STUDENT_PHOTOS[(id - 1) % STUDENT_PHOTOS.length];
}

export function resolveStaffPhotoUrl(
  id: number | null | undefined,
  existing?: string | null
): string | null {
  if (existing) {
    return existing;
  }
  if (id == null || !Number.isFinite(id) || id <= 0) {
    return null;
  }
  return STAFF_PHOTOS[(id - 1) % STAFF_PHOTOS.length];
}

export const PROFILE_ASSET_PATHS = {
  students: STUDENT_PHOTOS,
  staff: STAFF_PHOTOS,
  logos: [
    '/assets/profiles/logos/logo1.jpg',
    '/assets/profiles/logos/logo2.jpg',
    '/assets/profiles/logos/logo3.png',
    '/assets/profiles/logos/logo4.jpg',
    '/assets/profiles/logos/logo5.jpg'
  ]
} as const;
