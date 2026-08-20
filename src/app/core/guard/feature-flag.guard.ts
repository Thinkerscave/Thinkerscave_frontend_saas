import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { FeatureFlagKey, isFeatureEnabled } from '../config/feature-flags';

/**
 * Blocks navigation when a feature flag is disabled.
 */
export function featureFlagGuard(flag: FeatureFlagKey): CanActivateFn {
  return () => {
    if (isFeatureEnabled(flag)) {
      return true;
    }
    return inject(Router).createUrlTree(['/unauthorized']);
  };
}
