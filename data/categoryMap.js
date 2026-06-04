const CATEGORY_MAP = {
  'Energy': 'energy',
  'Transportation': 'transportation',
  'Food & Agriculture': 'foodAgriculture',
  'Carbon Removal': 'carbonRemoval',
  'Solutions & Action': 'solutions',
};

export const CATEGORY_DISPLAY_NAMES = Object.keys(CATEGORY_MAP);

export function mapCategoryToKey(displayName) {
  if (Object.prototype.hasOwnProperty.call(CATEGORY_MAP, displayName)) {
    return CATEGORY_MAP[displayName];
  }
  // Unknown category: fall back to the raw name so persistence still works,
  // but surface it in dev so a missing mapping isn't a silent failure.
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.warn(
      `[categoryMap] Unknown category "${displayName}" — falling back to it as the data key. ` +
        'Add it to CATEGORY_MAP if this is a real category.'
    );
  }
  return displayName;
}
