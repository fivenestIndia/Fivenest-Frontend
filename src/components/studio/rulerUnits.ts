// rulerUnits.ts - Measurement Units & Typography Registry for Fivenest Studio

export type RulerUnit = 'in' | 'mm' | 'cm' | 'pt' | 'ft';

export interface UnitConfig {
  unit: RulerUnit;
  label: string;
  symbol: string;
  toInches: (val: number) => number;
  fromInches: (val: number) => number;
  format: (val: number, decimals?: number) => string;
  majorStep: number;
  subdivisions: number;
  inputStep: number;
  defaultDecimals: number;
}

export const RULER_UNITS: Record<RulerUnit, UnitConfig> = {
  in: {
    unit: 'in',
    label: 'Inches (in / ")',
    symbol: 'in',
    toInches: (v) => v,
    fromInches: (v) => v,
    format: (v, d = 1) => `${v.toFixed(d)}"`,
    majorStep: 1,
    subdivisions: 4,     // 1/4", 1/2", 3/4"
    inputStep: 0.1,
    defaultDecimals: 1
  },
  mm: {
    unit: 'mm',
    label: 'Millimeters (mm)',
    symbol: 'mm',
    toInches: (v) => v / 25.4,
    fromInches: (v) => v * 25.4,
    format: (v, d = 0) => `${v.toFixed(d)} mm`,
    majorStep: 10,        // Every 10mm (1cm) marked
    subdivisions: 10,    // 1mm ticks, 5mm half-tick
    inputStep: 1,
    defaultDecimals: 0
  },
  cm: {
    unit: 'cm',
    label: 'Centimeters (cm)',
    symbol: 'cm',
    toInches: (v) => v / 2.54,
    fromInches: (v) => v * 2.54,
    format: (v, d = 1) => `${v.toFixed(d)} cm`,
    majorStep: 1,         // Every 1cm marked
    subdivisions: 10,    // 1mm ticks, 5mm half-tick
    inputStep: 0.1,
    defaultDecimals: 1
  },
  pt: {
    unit: 'pt',
    label: 'Points (pt)',
    symbol: 'pt',
    toInches: (v) => v / 72,
    fromInches: (v) => v * 72,
    format: (v, d = 0) => `${Math.round(v)} pt`,
    majorStep: 72,        // 72pt = 1 inch
    subdivisions: 6,     // 12pt intervals
    inputStep: 1,
    defaultDecimals: 0
  },
  ft: {
    unit: 'ft',
    label: 'Feet (ft)',
    symbol: 'ft',
    toInches: (v) => v * 12,
    fromInches: (v) => v / 12,
    format: (v, d = 2) => `${v.toFixed(d)} ft`,
    majorStep: 1,         // 1 foot
    subdivisions: 12,    // 1 inch = 1/12 ft
    inputStep: 0.05,
    defaultDecimals: 2
  }
};

export interface DefaultFontOption {
  value: string;
  label: string;
  category: 'Athletic' | 'Display' | 'Script' | 'System';
}

export const DEFAULT_STUDIO_FONTS: DefaultFontOption[] = [
  { value: 'OldSport02AthleticNcv-E0gj', label: 'Old Sport Athletic (Default)', category: 'Athletic' },
  { value: 'OldSport01CollegeNcv-aeGm', label: 'Old Sport College', category: 'Athletic' },
  { value: 'Jersey M54', label: 'Jersey M54', category: 'Athletic' },
  { value: 'Pop Warner', label: 'Pop Warner', category: 'Athletic' },
  { value: 'Calligraphy', label: 'Calligraphy Script', category: 'Script' },
  { value: 'Eaglore 2', label: 'Eaglore 2', category: 'Display' },
  { value: 'Khand-Bold', label: 'Khand Bold', category: 'Display' },
  { value: 'Khand-SemiBold', label: 'Khand SemiBold', category: 'Display' },
  { value: 'fhf', label: 'FHF Sport', category: 'Athletic' },
  { value: 'Impact', label: 'Impact (Bold)', category: 'System' },
  { value: 'Arial', label: 'Arial Black', category: 'System' },
  { value: 'Trebuchet MS', label: 'Trebuchet (Modern Sans)', category: 'System' },
  { value: 'Times New Roman', label: 'Times (Classic Serif)', category: 'System' }
];
