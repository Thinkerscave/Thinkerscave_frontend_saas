import { Pipe, PipeTransform } from '@angular/core';

/**
 * Extracts up to 2 initials from a name string.
 *
 * Usage:
 *   {{ 'John Doe' | initials }}          → 'JD'
 *   {{ 'Alice' | initials }}             → 'A'
 *   {{ user.firstName | initials:user.lastName }} → 'FL'
 */
@Pipe({ name: 'initials', standalone: true, pure: true })
export class InitialsPipe implements PipeTransform {
  transform(value: string | null | undefined, lastName?: string): string {
    if (!value) return '';

    if (lastName) {
      return `${value.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }

    return value
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0])
      .join('')
      .toUpperCase();
  }
}
