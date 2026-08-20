/**
 * Central feature flags for release gating.
 * Add a key and wire `environment.features` when a module needs to be hidden.
 */
export const featureFlags: Record<string, boolean> = {};

export type FeatureFlagKey = string;

export function isFeatureEnabled(flag: FeatureFlagKey): boolean {
  return featureFlags[flag] === true;
}
