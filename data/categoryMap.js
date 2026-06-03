const CATEGORY_MAP = {
  'Energy': 'energy',
  'Transportation': 'transportation',
  'Food & Agriculture': 'foodAgriculture',
  'Carbon Removal': 'carbonRemoval',
  'Solutions & Action': 'solutions',
};

export const CATEGORY_DISPLAY_NAMES = Object.keys(CATEGORY_MAP);

export function mapCategoryToKey(displayName) {
  return CATEGORY_MAP[displayName] ?? displayName;
}
