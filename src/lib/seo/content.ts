import { translations, type Locale } from '@/lib/i18n';
import projectsData from '@/lib/projects.json';
import aboutData from '@/lib/about.json';
import { CONTACT_EMAIL, SITE_NAME, SITE_TAGLINE } from './site';

type TranslationRecord = Record<string, unknown>;

function getByPath(obj: TranslationRecord, path: string): string | undefined {
  const value = path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as TranslationRecord)) {
      return (acc as TranslationRecord)[key];
    }
    return undefined;
  }, obj);

  return typeof value === 'string' ? value : undefined;
}

export function t(locale: Locale, key: string): string {
  return getByPath(translations[locale] as TranslationRecord, key) ?? key;
}

export function getFeaturedProjects(locale: Locale = 'es') {
  return projectsData.projects.map((project) => ({
    id: project.id,
    title: t(locale, project.titleKey),
    description: t(locale, project.descriptionShortKey),
    tags: project.tags,
    liveUrl: project.liveUrl && project.liveUrl !== '#' ? project.liveUrl : null,
    githubUrl: project.githubUrl,
    filterTags: project.filterTags ?? [],
  }));
}

export function getProjectBySlug(slug: string) {
  return projectsData.projects.find((p) => toProjectSlug(p.id) === slug);
}

export function toProjectSlug(id: string): string {
  return id
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export function getSeoSummary(locale: Locale = 'es') {
  const bio = t(locale, aboutData.bioKey);
  const title = t(locale, aboutData.titleKey);
  const location = t(locale, aboutData.locationKey);
  const skills = aboutData.skills.map((s) => s.name);
  const featured = getFeaturedProjects(locale).filter(
    (p) => p.filterTags.includes('work') || p.liveUrl
  );

  return {
    name: SITE_NAME,
    title,
    tagline: SITE_TAGLINE,
    location,
    bio,
    skills,
    email: CONTACT_EMAIL,
    featured,
  };
}

export const DEFAULT_KEYWORDS = [
  'Daniel Cabrera',
  'desarrollador full stack',
  'full stack developer',
  'Next.js',
  'TypeScript',
  'React',
  'Firebase',
  'Supabase',
  'Barcelona',
  'desarrollador web Barcelona',
  'freelance developer Spain',
  'ciberseguridad',
  'Rust',
  'portfolio developer',
] as const;
