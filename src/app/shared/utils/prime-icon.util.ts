const FALLBACK_ICON = 'pi pi-circle';

export function normalizePrimeIcon(icon?: string | null, fallback = FALLBACK_ICON): string {
  const value = icon?.trim();

  if (!value) {
    return fallback;
  }

  if (value.startsWith('pi pi-')) {
    return value;
  }

  if (value.startsWith('pi-')) {
    return `pi ${value}`;
  }

  if (value.startsWith('pi ')) {
    return value;
  }

  return `pi pi-${value}`;
}