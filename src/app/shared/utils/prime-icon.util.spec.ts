import { normalizePrimeIcon } from './prime-icon.util';

describe('normalizePrimeIcon', () => {
  it('returns fallback when icon is empty', () => {
    expect(normalizePrimeIcon(undefined, 'pi pi-question-circle')).toBe('pi pi-question-circle');
    expect(normalizePrimeIcon('   ', 'pi pi-question-circle')).toBe('pi pi-question-circle');
  });

  it('keeps valid prime icon classes as-is', () => {
    expect(normalizePrimeIcon('pi pi-home')).toBe('pi pi-home');
    expect(normalizePrimeIcon('pi-home')).toBe('pi pi-home');
    expect(normalizePrimeIcon('pi pi-users')).toBe('pi pi-users');
  });

  it('maps common backend icon aliases to prime icons', () => {
    expect(normalizePrimeIcon('dashboard')).toBe('pi pi-home');
    expect(normalizePrimeIcon('groups')).toBe('pi pi-users');
    expect(normalizePrimeIcon('business')).toBe('pi pi-building');
    expect(normalizePrimeIcon('monitor_heart')).toBe('pi pi-heart');
    expect(normalizePrimeIcon('credit_card')).toBe('pi pi-credit-card');
    expect(normalizePrimeIcon('local_offer')).toBe('pi pi-tag');
  });

  it('falls back to generated pi class for unknown values', () => {
    expect(normalizePrimeIcon('custom-icon')).toBe('pi pi-custom-icon');
  });
});
