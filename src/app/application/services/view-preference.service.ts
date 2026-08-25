import { Injectable, inject } from '@angular/core';
import { UserPreferencesService } from './user-preferences.service';
import {
  AppListViewMode,
  UI_VIEW,
  isAppListViewMode
} from '../../shared/config/ui-standards';

const GLOBAL_PREF = 'defaultView';

/**
 * User-level default list presentation (grid vs table).
 * List pages open from the menu with this value. A page-level toggle is
 * temporary in memory (and restored via ListContextService after Back);
 * it must not write a new global preference.
 */
@Injectable({ providedIn: 'root' })
export class ViewPreferenceService {
  private readonly preferences = inject(UserPreferencesService);

  globalDefault(): AppListViewMode {
    const stored = this.preferences.get(GLOBAL_PREF, UI_VIEW.defaultMode);
    return isAppListViewMode(stored) ? stored : UI_VIEW.defaultMode;
  }

  setGlobalDefault(mode: AppListViewMode): void {
    this.preferences.set(GLOBAL_PREF, mode);
  }

  /** Prefer a restored list-context view, otherwise the signed-in user's default. */
  initialView(saved?: AppListViewMode | null): AppListViewMode {
    return isAppListViewMode(saved) ? saved : this.globalDefault();
  }
}
