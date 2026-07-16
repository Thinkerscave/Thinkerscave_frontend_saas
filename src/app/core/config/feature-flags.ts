import { environment } from '../../../environments/environment';

/**
 * Central feature flags for release gating.
 * Re-enable a module by flipping the matching environment flag and redeploying.
 */
export const featureFlags = {
  feeManagementEnabled: environment.features?.feeManagementEnabled === true
} as const;

export type FeatureFlagKey = keyof typeof featureFlags;

export function isFeatureEnabled(flag: FeatureFlagKey): boolean {
  return featureFlags[flag];
}
