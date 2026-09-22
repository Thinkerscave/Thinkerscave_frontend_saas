/**
 * Centralized loading model — every component declares WHAT is loading
 * and HOW it should look, instead of inventing its own spinner/skeleton.
 */

/** Lifecycle phase for a loadable unit of UI. */
export type LoadingPhase = 'idle' | 'loading' | 'success' | 'empty' | 'error';

/**
 * Where loading feedback appears.
 * - page: first paint of a route body (never shell title/breadcrumb)
 * - section: one block under already-visible chrome
 * - results: list/table/card results area only (filters stay)
 * - tab: current tab panel only (hero/tabs stay)
 * - action: button/control spinner only
 * - modal: inside an already-open dialog
 */
export type LoadingScope =
  | 'page'
  | 'section'
  | 'table'
  | 'cards'
  | 'results'
  | 'tab'
  | 'action'
  | 'modal';

/**
 * Skeleton layout that mirrors the final UI structure of the page/section.
 * Counts are presets for a typical viewport — callers may override.
 */
export type LoadingLayout =
  | 'directory-table' // KPI → filter → 8–10 table rows
  | 'directory-cards' // KPI → filter → 6–8 cards
  | 'table-only'      // optional filter → 8–12 rows
  | 'cards-only'      // 6–8 cards
  | 'detail'          // hero → tabs → content sections
  | 'detail-section'  // tab/body content only
  | 'dashboard'       // KPI → charts → table
  | 'form'            // form fields
  | 'modal';           // compact form/list inside dialog

export interface LoadingLayoutPreset {
  layout: LoadingLayout;
  kpis: number;
  showKpis: boolean;
  showFilter: boolean;
  rows: number;
  columns: number;
  cards: number;
  tabs: number;
  charts: number;
  sections: number;
}

/** Viewport-aware defaults — not arbitrary global counts. */
export const LOADING_LAYOUT_PRESETS: Record<LoadingLayout, LoadingLayoutPreset> = {
  'directory-table': {
    layout: 'directory-table',
    kpis: 4,
    showKpis: true,
    showFilter: true,
    rows: 8,
    columns: 6,
    cards: 0,
    tabs: 0,
    charts: 0,
    sections: 0
  },
  'directory-cards': {
    layout: 'directory-cards',
    kpis: 4,
    showKpis: true,
    showFilter: true,
    rows: 0,
    columns: 0,
    cards: 8,
    tabs: 0,
    charts: 0,
    sections: 0
  },
  'table-only': {
    layout: 'table-only',
    kpis: 0,
    showKpis: false,
    showFilter: false,
    rows: 10,
    columns: 5,
    cards: 0,
    tabs: 0,
    charts: 0,
    sections: 0
  },
  'cards-only': {
    layout: 'cards-only',
    kpis: 0,
    showKpis: false,
    showFilter: false,
    rows: 0,
    columns: 0,
    cards: 8,
    tabs: 0,
    charts: 0,
    sections: 0
  },
  detail: {
    layout: 'detail',
    kpis: 0,
    showKpis: false,
    showFilter: false,
    rows: 0,
    columns: 0,
    cards: 0,
    tabs: 5,
    charts: 0,
    sections: 3
  },
  'detail-section': {
    layout: 'detail-section',
    kpis: 0,
    showKpis: false,
    showFilter: false,
    rows: 6,
    columns: 4,
    cards: 0,
    tabs: 0,
    charts: 0,
    sections: 2
  },
  dashboard: {
    layout: 'dashboard',
    kpis: 4,
    showKpis: true,
    showFilter: false,
    rows: 6,
    columns: 5,
    cards: 0,
    tabs: 0,
    charts: 2,
    sections: 0
  },
  form: {
    layout: 'form',
    kpis: 0,
    showKpis: false,
    showFilter: false,
    rows: 0,
    columns: 0,
    cards: 0,
    tabs: 0,
    charts: 0,
    sections: 6
  },
  modal: {
    layout: 'modal',
    kpis: 0,
    showKpis: false,
    showFilter: false,
    rows: 4,
    columns: 3,
    cards: 0,
    tabs: 0,
    charts: 0,
    sections: 4
  }
};

export interface LoadingStateSnapshot {
  phase: LoadingPhase;
  scope: LoadingScope;
  layout: LoadingLayout;
  errorMessage: string;
  hasLoaded: boolean;
}

/**
 * Small mutable controller for a component's load lifecycle.
 * Always terminates: success | empty | error | cancel (reset).
 */
export class LoadingController {
  phase: LoadingPhase = 'idle';
  scope: LoadingScope = 'page';
  layout: LoadingLayout = 'directory-table';
  errorMessage = '';
  /** True after first successful/empty/error resolution for this controller. */
  hasLoaded = false;

  constructor(init?: Partial<Pick<LoadingController, 'scope' | 'layout'>>) {
    if (init?.scope) this.scope = init.scope;
    if (init?.layout) this.layout = init.layout;
  }

  get isLoading(): boolean {
    return this.phase === 'loading';
  }

  get showSkeleton(): boolean {
    return this.phase === 'loading' && this.scope !== 'action';
  }

  get showContent(): boolean {
    return this.phase === 'success' || (this.hasLoaded && this.phase === 'loading' && this.scope !== 'page');
  }

  get showEmpty(): boolean {
    return this.phase === 'empty';
  }

  get showError(): boolean {
    return this.phase === 'error';
  }

  /** Soft refresh: keep chrome/content, only results/section busy. */
  get isSoftRefreshing(): boolean {
    return this.phase === 'loading' && this.hasLoaded && this.scope !== 'page';
  }

  start(scope: LoadingScope = this.scope, layout: LoadingLayout = this.layout): void {
    this.scope = scope;
    this.layout = layout;
    this.errorMessage = '';
    // First paint uses page/section skeleton; later loads soft-refresh.
    if (!this.hasLoaded && (scope === 'page' || scope === 'section')) {
      this.scope = scope;
    } else if (this.hasLoaded && scope === 'page') {
      this.scope = 'results';
    }
    this.phase = 'loading';
  }

  succeed(): void {
    this.phase = 'success';
    this.hasLoaded = true;
    this.errorMessage = '';
  }

  empty(message = ''): void {
    this.phase = 'empty';
    this.hasLoaded = true;
    this.errorMessage = message;
  }

  fail(message = 'Something went wrong. Please retry.'): void {
    this.phase = 'error';
    this.hasLoaded = true;
    this.errorMessage = message;
  }

  /** Call on destroy / navigation cancel so state never sticks. */
  cancel(): void {
    if (this.phase === 'loading') {
      this.phase = this.hasLoaded ? 'success' : 'idle';
    }
  }

  reset(): void {
    this.phase = 'idle';
    this.errorMessage = '';
    this.hasLoaded = false;
  }

  snapshot(): LoadingStateSnapshot {
    return {
      phase: this.phase,
      scope: this.scope,
      layout: this.layout,
      errorMessage: this.errorMessage,
      hasLoaded: this.hasLoaded
    };
  }
}

/** Map directory view mode → layout. */
export function directoryLayout(view: 'grid' | 'table' | string, includeKpis = false): LoadingLayout {
  if (includeKpis) {
    return view === 'grid' ? 'directory-cards' : 'directory-table';
  }
  return view === 'grid' ? 'cards-only' : 'table-only';
}
