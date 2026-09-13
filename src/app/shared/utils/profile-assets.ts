/** Return only a real uploaded photo URL — never substitute stock/demo images. */
export function resolveStudentPhotoUrl(
  _id: number | null | undefined,
  existing?: string | null
): string | null {
  if (!existing || !existing.trim()) {
    return null;
  }
  const url = existing.trim();
  if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('/api/')) {
    return url;
  }
  return null;
}

export function resolveStaffPhotoUrl(
  _id: number | null | undefined,
  existing?: string | null
): string | null {
  if (!existing || !existing.trim()) {
    return null;
  }
  const url = existing.trim();
  if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('/api/')) {
    return url;
  }
  return null;
}
