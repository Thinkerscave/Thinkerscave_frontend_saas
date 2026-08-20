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

export const SIDEBAR_ICON_OPTIONS: { label: string; value: string }[] = [
  { label: 'Home', value: 'pi pi-home' },
  { label: 'Th large', value: 'pi pi-th-large' },
  { label: 'Sitemap', value: 'pi pi-sitemap' },
  { label: 'Box', value: 'pi pi-box' },
  { label: 'Users', value: 'pi pi-users' },
  { label: 'User', value: 'pi pi-user' },
  { label: 'User edit', value: 'pi pi-user-edit' },
  { label: 'Id card', value: 'pi pi-id-card' },
  { label: 'Building', value: 'pi pi-building' },
  { label: 'Calendar', value: 'pi pi-calendar' },
  { label: 'Book', value: 'pi pi-book' },
  { label: 'File', value: 'pi pi-file' },
  { label: 'Folder', value: 'pi pi-folder' },
  { label: 'Chart', value: 'pi pi-chart-line' },
  { label: 'Wallet', value: 'pi pi-wallet' },
  { label: 'Credit card', value: 'pi pi-credit-card' },
  { label: 'Tag', value: 'pi pi-tag' },
  { label: 'Inbox', value: 'pi pi-inbox' },
  { label: 'Send', value: 'pi pi-send' },
  { label: 'Comments', value: 'pi pi-comments' },
  { label: 'Bell', value: 'pi pi-bell' },
  { label: 'Lock', value: 'pi pi-lock' },
  { label: 'Shield', value: 'pi pi-shield' },
  { label: 'Cog', value: 'pi pi-cog' },
  { label: 'Sliders', value: 'pi pi-sliders-h' },
  { label: 'Server', value: 'pi pi-server' },
  { label: 'Database', value: 'pi pi-database' },
  { label: 'Sync', value: 'pi pi-sync' },
  { label: 'History', value: 'pi pi-history' },
  { label: 'Heart', value: 'pi pi-heart' },
  { label: 'Star', value: 'pi pi-star' },
  { label: 'List', value: 'pi pi-list' },
  { label: 'Table', value: 'pi pi-table' },
  { label: 'Map', value: 'pi pi-map' },
  { label: 'Clock', value: 'pi pi-clock' },
  { label: 'Check', value: 'pi pi-check-circle' },
  { label: 'Briefcase', value: 'pi pi-briefcase' },
  { label: 'Graduation', value: 'pi pi-verified' },
  { label: 'Globe', value: 'pi pi-globe' },
  { label: 'Key', value: 'pi pi-key' }
];