export const MATERIAL_DESIGN_ICON_VALUES = [
  'calendar',
  'credit-card',
  'cash',
  'currency-usd',
  'bank',
  'cellphone',
  'wifi',
  'television',
  'music',
  'movie',
  'gamepad',
  'youtube',
  'spotify',
  'apple',
  'microsoft',
  'cloud',
  'web',
  'bell',
  'cart',
  'school',
  'home',
  'car',
  'train',
  'airplane',
  'dumbbell',
  'heart',
  'shield',
  'briefcase',
  'help-circle'
] as const;

export type MaterialDesignIcon = typeof MATERIAL_DESIGN_ICON_VALUES[number];

// help-circle -> Help Circle
const formatIconLabel = (iconValue: string) =>
  iconValue
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

export const MATERIAL_DESIGN_ICON_OPTIONS = MATERIAL_DESIGN_ICON_VALUES.map((value) => ({
  value,
  label: formatIconLabel(value)
}));
