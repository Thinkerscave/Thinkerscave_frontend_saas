import { HttpErrorResponse } from '@angular/common/http';

export interface ApiFieldError {
  field: string;
  message: string;
  rejectedValue?: unknown;
}

export interface ExtractedApiError {
  status: number;
  code: string;
  message: string;
  correlationId?: string;
  fieldErrors: Record<string, string>;
}

/** Maps backend DTO field names onto provision-form error keys. */
const PROVISION_FIELD_ALIASES: Record<string, string> = {
  tenantSubdomain: 'domain',
  existingCustomerId: 'customerId',
  adminFirstName: 'adminFullName',
  adminLastName: 'adminFullName',
  subscriptionPlanId: 'subscriptionPlanId',
  adminEmail: 'adminEmail',
  adminMobile: 'adminMobile',
  organizationName: 'organizationName',
  shortName: 'shortName',
  institutionType: 'institutionType',
  city: 'city',
  state: 'state',
  country: 'country'
};

function humanizeFieldMessage(field: string, message: string): string {
  const cleaned = (message || '').trim();
  if (!cleaned) {
    return 'Invalid value.';
  }
  // Bean Validation defaults → clearer copy
  if (/well-formed email/i.test(cleaned) || /must be a well-formed email/i.test(cleaned)) {
    return 'Enter a valid email address.';
  }
  if (/must not be blank/i.test(cleaned) || /must not be null/i.test(cleaned)) {
    return 'This field is required.';
  }
  if (/size must be between/i.test(cleaned)) {
    return 'Value length is out of the allowed range.';
  }
  // Drop redundant "field: message" prefixes when already bound under the field
  const prefix = `${field}:`;
  if (cleaned.toLowerCase().startsWith(prefix.toLowerCase())) {
    return cleaned.slice(prefix.length).trim();
  }
  return cleaned;
}

/**
 * Normalizes Spring {@code ApiError} / validation envelopes into a UI-friendly shape.
 * Never surfaces stack traces or Hibernate internals.
 */
export function extractApiError(err: unknown, fallbackMessage: string): ExtractedApiError {
  const httpErr = err instanceof HttpErrorResponse ? err : null;
  const body = (httpErr?.error && typeof httpErr.error === 'object')
    ? httpErr.error as Record<string, unknown>
    : (err && typeof err === 'object' ? err as Record<string, unknown> : {});

  const status = httpErr?.status
    ?? (typeof body['status'] === 'number' ? body['status'] : 0);

  const code = typeof body['code'] === 'string' ? body['code'] : '';
  const correlationId = typeof body['correlationId'] === 'string'
    ? body['correlationId']
    : undefined;

  let message = '';
  if (typeof body['message'] === 'string' && body['message'].trim()) {
    message = body['message'].trim();
  } else if (typeof httpErr?.error === 'string' && httpErr.error.trim() && !httpErr.error.trim().startsWith('<')) {
    message = httpErr.error.trim();
  }

  // Strip obvious internals if a raw exception ever leaks through
  if (/hibernate|org\.springframework|java\.lang\.|sql exception|psqlException/i.test(message)) {
    message = fallbackMessage;
  }

  const fieldErrors: Record<string, string> = {};
  const rawErrors = body['errors'];
  if (Array.isArray(rawErrors)) {
    for (const item of rawErrors) {
      if (!item || typeof item !== 'object') continue;
      const entry = item as Record<string, unknown>;
      const rawField = typeof entry['field'] === 'string' ? entry['field'] : '';
      const rawMessage = typeof entry['message'] === 'string' ? entry['message'] : '';
      if (!rawField || !rawMessage) continue;
      if (/hibernate|org\.springframework|java\.lang\./i.test(rawMessage)) continue;

      const leaf = rawField.includes('.') ? rawField.slice(rawField.lastIndexOf('.') + 1) : rawField;
      const uiField = PROVISION_FIELD_ALIASES[leaf] ?? PROVISION_FIELD_ALIASES[rawField] ?? leaf;
      fieldErrors[uiField] = humanizeFieldMessage(uiField, rawMessage);
    }
  }

  if (!message) {
    message = Object.values(fieldErrors)[0] || fallbackMessage;
  }

  return { status, code, message, correlationId, fieldErrors };
}
