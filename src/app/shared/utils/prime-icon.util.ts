const FALLBACK_ICON = 'pi pi-circle';

const ICON_ALIASES: Record<string, string> = {
  dashboard: 'pi pi-home',
  home: 'pi pi-home',
  groups: 'pi pi-users',
  users: 'pi pi-users',
  business: 'pi pi-building',
  building: 'pi pi-building',
  server: 'pi pi-server',
  apps: 'pi pi-th-large',
  'sliders-h': 'pi pi-sliders-h',
  sliders: 'pi pi-sliders-h',
  sync: 'pi pi-sync',
  history: 'pi pi-history',
  monitor_heart: 'pi pi-heart',
  'monitor-heart': 'pi pi-heart',
  credit_card: 'pi pi-credit-card',
  'credit-card': 'pi pi-credit-card',
  local_offer: 'pi pi-tag',
  'local-offer': 'pi pi-tag',
  attendance: 'pi pi-calendar',
  'calendar-today': 'pi pi-calendar',
  calendar_today: 'pi pi-calendar',
  'event-available': 'pi pi-calendar',
  event_available: 'pi pi-calendar'
};

const ICON_COMPATIBILITY_MAP: Record<string, string> = {
  'pi pi-calendar-check': 'pi pi-calendar'
};

function applyIconCompatibility(iconClass: string): string {
  return ICON_COMPATIBILITY_MAP[iconClass] ?? iconClass;
}

export function normalizePrimeIcon(icon?: string | null, fallback = FALLBACK_ICON): string {
  const value = icon?.trim();

  if (!value) {
    return fallback;
  }

  if (value.startsWith('pi pi-')) {
    return applyIconCompatibility(value);
  }

  if (value.startsWith('pi-')) {
    return applyIconCompatibility(`pi ${value}`);
  }

  if (value.startsWith('pi ')) {
    return applyIconCompatibility(value);
  }

  const alias = ICON_ALIASES[value.toLowerCase()];
  if (alias) {
    return applyIconCompatibility(alias);
  }

  return applyIconCompatibility(`pi pi-${value}`);
}