import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, map, of } from 'rxjs';
import { moduleSettingsApi } from '../constants/api.endpoint';

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface ModuleSettingsResponse {
  settings?: Record<string, unknown>;
}

export interface StudentOption {
  label: string;
  value: string;
}

const DEFAULT_SOCIAL_CATEGORIES = [
  'GENERAL', 'OBC', 'EBC', 'SC', 'ST', 'OTHER', 'PREFER_NOT_TO_SAY'
];

@Injectable({ providedIn: 'root' })
export class StudentReferenceDataService {
  private readonly http = inject(HttpClient);

  socialCategories() {
    return this.http.get<ApiEnvelope<ModuleSettingsResponse>>(moduleSettingsApi.module('STUDENTS')).pipe(
      map(response => {
        const configured = response.data?.settings?.['SOCIAL_CATEGORY_OPTIONS'];
        const values = Array.isArray(configured)
          ? configured.filter((value): value is string => typeof value === 'string')
          : DEFAULT_SOCIAL_CATEGORIES;
        return values.map(value => ({
          value,
          label: value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase())
        }));
      }),
      catchError(() => of(DEFAULT_SOCIAL_CATEGORIES.map(value => ({
        value,
        label: value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase())
      }))))
    );
  }
}
