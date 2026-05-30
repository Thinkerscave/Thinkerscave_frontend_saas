export type UiTone = 'default' | 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'brand';

export type UiDensity = 'compact' | 'comfortable' | 'spacious';

export interface UiAction<T = unknown> {
  id?: string;
  label: string;
  icon?: string;
  tone?: UiTone;
  routerLink?: string | any[];
  queryParams?: Record<string, unknown>;
  disabled?: boolean;
  visible?: boolean;
  payload?: T;
}

export interface UiNavItem {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  routerLink?: string | any[];
  queryParams?: Record<string, unknown>;
  badge?: string | number;
  disabled?: boolean;
}

export interface UiStat {
  label: string;
  value: string | number | null;
  icon?: string;
  tone?: UiTone;
  trend?: string;
  delta?: number | null;
  link?: string | any[];
}

export interface UiSummaryItem {
  label: string;
  value: string | number | null;
  icon?: string;
  tone?: UiTone;
}

export interface UiTimelineItem {
  id?: string | number;
  title: string;
  description?: string;
  timestamp?: string | Date | null;
  icon?: string;
  tone?: UiTone;
  actor?: string;
}

export interface UiActivityItem extends UiTimelineItem {
  category?: string;
  link?: string | any[];
}

export interface UiFilterOption {
  field: string;
  label: string;
  value: unknown;
  active?: boolean;
}