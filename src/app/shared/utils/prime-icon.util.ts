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
  'local-offer': 'pi pi-tag'
};

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

  const alias = ICON_ALIASES[value.toLowerCase()];
  if (alias) {
    return alias;
  }

  return `pi pi-${value}`;
}