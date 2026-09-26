export const BRAND = {
  name: 'Mission 007',
  shortName: 'MISSION',
  numeral: '007',
  tagline: 'Licensed to Caffeinate',
  description:
    'A classified coffee house. Espresso, signature drinks, and covert comfort — served shaken, never ordinary.',
  logo: '/mission-007-logo.png',
  heroImage:
    'https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=2070&auto=format&fit=crop',
  heroSlides: [
    { url: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80&w=2070&auto=format&fit=crop' },
    { url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2070&auto=format&fit=crop' },
    { url: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=2070&auto=format&fit=crop' }
  ]
};

const LEGACY_BRAND = /tea\s*max|teamax|milk tea hub|beracah|terraza/i;

export function brandedText(value: string | undefined | null, fallback: string) {
  if (!value || LEGACY_BRAND.test(value)) return fallback;
  return value;
}

export function brandedLogo(value: string | undefined | null) {
  if (!value || LEGACY_BRAND.test(value) || value.includes('teamax-logo') || value.includes('logo.jpg')) return BRAND.logo;
  return value;
}
