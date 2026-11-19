// Passport / visa / ID photo specifications.
//
// widthMm / heightMm      Finished print size.
// headMm                  Allowed chin-to-crown height, [min, max].
// eyeFromBottomMm         Allowed eye-line height above the bottom edge (only
//                         where the issuing authority publishes one).
// background              Default background colour for the document.
//
// Entries marked `guideline: true` have no officially published head-size
// range; the range is a sensible ICAO-style default, not a legal requirement.

export const photoSpecs = [
  {
    id: 'bd-passport',
    country: 'Bangladesh',
    label: 'Passport size (45 × 55 mm)',
    widthMm: 45,
    heightMm: 55,
    headMm: [32, 38],
    background: '#ffffff',
    backgroundNote: 'White',
    guideline: true,
  },
  {
    id: 'bd-visa',
    country: 'Bangladesh',
    label: 'Visa / general forms (35 × 45 mm)',
    widthMm: 35,
    heightMm: 45,
    headMm: [30, 36],
    background: '#ffffff',
    backgroundNote: 'White',
    guideline: true,
  },
  {
    id: 'bd-stamp',
    country: 'Bangladesh',
    label: 'Stamp size (20 × 25 mm)',
    widthMm: 20,
    heightMm: 25,
    headMm: [15, 19],
    background: '#ffffff',
    backgroundNote: 'White',
    guideline: true,
  },
  {
    id: 'us-passport',
    country: 'United States',
    label: 'Passport / Visa (2 × 2 in)',
    widthMm: 50.8,
    heightMm: 50.8,
    headMm: [25, 35],
    eyeFromBottomMm: [28, 35],
    background: '#ffffff',
    backgroundNote: 'White or off-white',
  },
  {
    id: 'uk-passport',
    country: 'United Kingdom',
    label: 'Passport (35 × 45 mm)',
    widthMm: 35,
    heightMm: 45,
    headMm: [29, 34],
    background: '#eceef1',
    backgroundNote: 'Light grey or cream',
  },
  {
    id: 'schengen-visa',
    country: 'Schengen / EU',
    label: 'Visa & EU passport (35 × 45 mm)',
    widthMm: 35,
    heightMm: 45,
    headMm: [32, 36],
    background: '#f1f3f5',
    backgroundNote: 'Light, plain (white or light grey)',
  },
  {
    id: 'ca-passport',
    country: 'Canada',
    label: 'Passport (50 × 70 mm)',
    widthMm: 50,
    heightMm: 70,
    headMm: [31, 36],
    background: '#ffffff',
    backgroundNote: 'White or light-coloured',
  },
  {
    id: 'ca-visa',
    country: 'Canada',
    label: 'Visa / permit (35 × 45 mm)',
    widthMm: 35,
    heightMm: 45,
    headMm: [31, 36],
    background: '#ffffff',
    backgroundNote: 'White or light-coloured',
  },
  {
    id: 'in-passport',
    country: 'India',
    label: 'Passport / Visa / OCI (2 × 2 in)',
    widthMm: 50.8,
    heightMm: 50.8,
    headMm: [25, 35],
    background: '#ffffff',
    backgroundNote: 'White',
  },
  {
    id: 'au-passport',
    country: 'Australia',
    label: 'Passport (35 × 45 mm)',
    widthMm: 35,
    heightMm: 45,
    headMm: [32, 36],
    background: '#ffffff',
    backgroundNote: 'White or light grey',
  },
  {
    id: 'cn-passport',
    country: 'China',
    label: 'Passport / Visa (33 × 48 mm)',
    widthMm: 33,
    heightMm: 48,
    headMm: [28, 33],
    background: '#ffffff',
    backgroundNote: 'White',
  },
  {
    id: 'jp-passport',
    country: 'Japan',
    label: 'Passport (35 × 45 mm)',
    widthMm: 35,
    heightMm: 45,
    headMm: [32, 36],
    background: '#ffffff',
    backgroundNote: 'White or very light',
  },
  {
    id: 'sg-passport',
    country: 'Singapore',
    label: 'Passport (35 × 45 mm)',
    widthMm: 35,
    heightMm: 45,
    headMm: [25, 35],
    background: '#ffffff',
    backgroundNote: 'White',
  },
  {
    id: 'my-passport',
    country: 'Malaysia',
    label: 'Passport (35 × 50 mm)',
    widthMm: 35,
    heightMm: 50,
    headMm: [25, 30],
    background: '#ffffff',
    backgroundNote: 'White',
    guideline: true,
  },
  {
    id: 'ae-visa',
    country: 'United Arab Emirates',
    label: 'Visa / Emirates ID (43 × 55 mm)',
    widthMm: 43,
    heightMm: 55,
    headMm: [32, 38],
    background: '#ffffff',
    backgroundNote: 'White',
    guideline: true,
  },
  {
    id: 'pk-passport',
    country: 'Pakistan',
    label: 'Passport / CNIC (35 × 45 mm)',
    widthMm: 35,
    heightMm: 45,
    headMm: [30, 36],
    background: '#ffffff',
    backgroundNote: 'White',
    guideline: true,
  },
  {
    id: 'generic-35x45',
    country: 'Common sizes',
    label: '35 × 45 mm (ICAO standard)',
    widthMm: 35,
    heightMm: 45,
    headMm: [32, 36],
    background: '#ffffff',
    backgroundNote: 'White',
  },
  {
    id: 'generic-40x60',
    country: 'Common sizes',
    label: '40 × 60 mm',
    widthMm: 40,
    heightMm: 60,
    headMm: [32, 40],
    background: '#ffffff',
    backgroundNote: 'White',
    guideline: true,
  },
]

export const CUSTOM_SPEC_ID = 'custom'

export const customSizeLimits = { minMm: 15, maxMm: 120 }

/** Build a spec for a user-entered size, with a proportional head range. */
export function buildCustomSpec(widthMm, heightMm) {
  const { minMm, maxMm } = customSizeLimits
  const clamp = (value, fallback) => {
    const n = Number(value)
    if (!Number.isFinite(n)) return fallback
    return Math.min(maxMm, Math.max(minMm, n))
  }
  const w = clamp(widthMm, 35)
  const h = clamp(heightMm, 45)
  const round1 = (n) => Math.round(n * 10) / 10
  return {
    id: CUSTOM_SPEC_ID,
    country: 'Common sizes',
    label: `Custom (${round1(w)} × ${round1(h)} mm)`,
    widthMm: w,
    heightMm: h,
    headMm: [round1(h * 0.62), round1(h * 0.76)],
    background: '#ffffff',
    backgroundNote: 'Your choice',
    guideline: true,
  }
}

export const backgroundSwatches = [
  { hex: '#ffffff', label: 'White' },
  { hex: '#f1f3f5', label: 'Off-white' },
  { hex: '#e3e6ea', label: 'Light grey' },
  { hex: '#dbeafe', label: 'Light blue' },
  { hex: '#3b82c4', label: 'Blue' },
  { hex: '#c62828', label: 'Red' },
]

export const printSheets = [
  { id: '4x6', label: '4 × 6 in', widthMm: 101.6, heightMm: 152.4 },
  { id: '5x7', label: '5 × 7 in', widthMm: 127, heightMm: 177.8 },
  { id: 'a4', label: 'A4', widthMm: 210, heightMm: 297 },
]
