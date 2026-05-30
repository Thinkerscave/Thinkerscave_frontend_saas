import { Pipe, PipeTransform } from '@angular/core';

type Severity = 'success' | 'info' | 'warn' | 'warning' | 'danger' | 'secondary';

interface ActiveResult {
  label: string;
  severity: Severity;
}

/**
 * Converts a boolean active flag to a display label or label+severity object.
 *
 * Usage:
 *   {{ isActive | activeLabel }}                    → 'Active' or 'Inactive'
 *   {{ isActive | activeLabel:'full' }}             → { label: 'Active', severity: 'success' }
 *   [value]="item.isActive | activeLabel"
 *   [severity]="(item.isActive | activeLabel:'full').severity"
 */
@Pipe({ name: 'activeLabel', standalone: true, pure: true })
export class ActiveLabelPipe implements PipeTransform {
  transform(value: boolean | null | undefined): string;
  transform(value: boolean | null | undefined, mode: 'full'): ActiveResult;
  transform(value: boolean | null | undefined, mode?: 'full'): string | ActiveResult {
    const active = !!value;
    const label = active ? 'Active' : 'Inactive';
    const severity: Severity = active ? 'success' : 'danger';

    if (mode === 'full') {
      return { label, severity };
    }
    return label;
  }
}
