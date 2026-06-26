export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  return url || 'https://danielcabrera.es';
}

export const SITE_NAME = 'Daniel Cabrera';
export const SITE_TAGLINE = 'Desarrollador Full-Stack';

export const SAME_AS = [
  'https://github.com/danikeinox',
  'https://www.linkedin.com/in/dcabreraa/',
] as const;

export const CONTACT_EMAIL = 'admin@danielcabrera.es';
