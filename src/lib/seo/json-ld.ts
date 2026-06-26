import projectsData from '@/lib/projects.json';
import aboutData from '@/lib/about.json';
import { getSeoSummary, t, toProjectSlug } from './content';
import { CONTACT_EMAIL, getSiteUrl, SAME_AS, SITE_NAME } from './site';

export function buildPersonJsonLd() {
  const siteUrl = getSiteUrl();
  const summary = getSeoSummary('es');

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: SITE_NAME,
    jobTitle: summary.title,
    description: summary.bio,
    url: siteUrl,
    email: CONTACT_EMAIL,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Barcelona',
      addressCountry: 'ES',
    },
    knowsAbout: aboutData.skills.map((s) => s.name),
    sameAs: [...SAME_AS],
  };
}

export function buildWebSiteJsonLd() {
  const siteUrl = getSiteUrl();
  const description = t('es', 'seo.root.description');

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: `${SITE_NAME} — Portfolio`,
    url: siteUrl,
    description,
    inLanguage: ['es-ES', 'en-US'],
    author: {
      '@type': 'Person',
      name: SITE_NAME,
      url: siteUrl,
    },
  };
}

export function buildProjectsItemListJsonLd() {
  const siteUrl = getSiteUrl();
  const items = projectsData.projects
    .filter((p) => p.liveUrl && p.liveUrl !== '#')
    .map((project, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'CreativeWork',
        name: t('es', project.titleKey),
        description: t('es', project.descriptionShortKey),
        url: project.liveUrl,
        author: { '@type': 'Person', name: SITE_NAME },
        keywords: project.tags.join(', '),
      },
    }));

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Proyectos de Daniel Cabrera',
    itemListElement: items,
    url: `${siteUrl}/app/portfolio`,
  };
}

export function buildProjectJsonLd(slug: string) {
  const project = projectsData.projects.find((p) => toProjectSlug(p.id) === slug);
  if (!project) return null;

  const siteUrl = getSiteUrl();
  const name = t('es', project.titleKey);
  const description = t('es', project.descriptionLongKey);

  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name,
    description,
    url: project.liveUrl && project.liveUrl !== '#' ? project.liveUrl : `${siteUrl}/proyectos/${slug}`,
    image: project.mainImage?.imageUrl,
    author: { '@type': 'Person', name: SITE_NAME, url: siteUrl },
    keywords: project.tags.join(', '),
    inLanguage: 'es-ES',
  };
}

export function buildProfilePageJsonLd() {
  const siteUrl = getSiteUrl();
  const summary = getSeoSummary('es');

  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    name: `${SITE_NAME} — CV`,
    url: `${siteUrl}/cv`,
    mainEntity: {
      '@type': 'Person',
      name: SITE_NAME,
      jobTitle: summary.title,
      description: summary.bio,
      email: CONTACT_EMAIL,
      knowsAbout: summary.skills,
      sameAs: [...SAME_AS],
    },
  };
}

export function buildJsonLdGraph(extra?: Record<string, unknown> | null) {
  const graph: Record<string, unknown>[] = [
    buildPersonJsonLd(),
    buildWebSiteJsonLd(),
    buildProjectsItemListJsonLd(),
  ];

  if (extra) graph.push(extra);

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}
