import type { Metadata } from 'next';
import { getSiteUrl } from './site';
import { DEFAULT_KEYWORDS, t } from './content';

export type IndexableRoute = {
  path: string;
  changeFrequency: 'weekly' | 'monthly' | 'yearly';
  priority: number;
};

/** Public routes worth indexing (no auth-gated or demo-only screens). */
export const INDEXABLE_ROUTES: IndexableRoute[] = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/cv', changeFrequency: 'monthly', priority: 0.95 },
  { path: '/app/about', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/app/portfolio', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/app/contact', changeFrequency: 'monthly', priority: 0.85 },
  { path: '/app/blog', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/app/testimonials', changeFrequency: 'monthly', priority: 0.75 },
  { path: '/app/services', changeFrequency: 'monthly', priority: 0.75 },
  { path: '/proyectos/perfectos-desconocidos-2', changeFrequency: 'monthly', priority: 0.85 },
  { path: '/proyectos/carliyoelbot', changeFrequency: 'monthly', priority: 0.85 },
  { path: '/proyectos/tonet-browser', changeFrequency: 'monthly', priority: 0.8 },
];

type AppSeoEntry = {
  titleKey: string;
  descriptionKey: string;
  keywords?: string[];
};

const APP_SEO: Record<string, AppSeoEntry> = {
  about: {
    titleKey: 'seo.apps.about.title',
    descriptionKey: 'seo.apps.about.description',
    keywords: ['sobre mí', 'full stack developer', 'Barcelona'],
  },
  portfolio: {
    titleKey: 'seo.apps.portfolio.title',
    descriptionKey: 'seo.apps.portfolio.description',
    keywords: ['proyectos web', 'case studies', 'Next.js projects'],
  },
  contact: {
    titleKey: 'seo.apps.contact.title',
    descriptionKey: 'seo.apps.contact.description',
    keywords: ['contacto desarrollador', 'hire developer'],
  },
  blog: {
    titleKey: 'seo.apps.blog.title',
    descriptionKey: 'seo.apps.blog.description',
    keywords: ['blog desarrollo web', 'tech blog'],
  },
  testimonials: {
    titleKey: 'seo.apps.testimonials.title',
    descriptionKey: 'seo.apps.testimonials.description',
  },
  services: {
    titleKey: 'seo.apps.services.title',
    descriptionKey: 'seo.apps.services.description',
    keywords: ['desarrollo web a medida', 'freelance'],
  },
};

export function getAppSeoMetadata(slug: string): Metadata {
  const siteUrl = getSiteUrl();
  const entry = APP_SEO[slug];

  if (!entry) {
    return {
      title: slug,
      alternates: { canonical: `${siteUrl}/app/${slug}` },
      robots: { index: false, follow: true },
    };
  }

  const title = t('es', entry.titleKey);
  const description = t('es', entry.descriptionKey);
  const keywords = [...DEFAULT_KEYWORDS, ...(entry.keywords ?? [])];

  return {
    title,
    description,
    keywords: [...keywords],
    alternates: { canonical: `${siteUrl}/app/${slug}` },
    openGraph: {
      type: 'website',
      locale: 'es_ES',
      url: `${siteUrl}/app/${slug}`,
      title,
      description,
      siteName: 'Daniel Cabrera',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export function getRootMetadata(): Metadata {
  const siteUrl = getSiteUrl();
  const title = t('es', 'seo.root.title');
  const description = t('es', 'seo.root.description');

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: title,
      template: '%s | Daniel Cabrera',
    },
    description,
    applicationName: 'Daniel Cabrera Portfolio',
    keywords: [...DEFAULT_KEYWORDS],
    authors: [{ name: 'Daniel Cabrera', url: siteUrl }],
    creator: 'Daniel Cabrera',
    publisher: 'Daniel Cabrera',
    other: { 'mobile-web-app-capable': 'yes' },
    manifest: '/manifest.webmanifest',
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    alternates: {
      canonical: '/',
      languages: {
        es: '/',
        en: '/',
        'x-default': '/',
      },
    },
    openGraph: {
      type: 'website',
      locale: 'es_ES',
      alternateLocale: ['en_US'],
      url: '/',
      title,
      description,
      siteName: 'Daniel Cabrera',
      images: [
        {
          url: '/opengraph-image',
          width: 1200,
          height: 630,
          alt: 'Daniel Cabrera — Desarrollador Full-Stack',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/opengraph-image'],
    },
    icons: {
      icon: [{ url: '/favicon.ico' }],
      apple: [{ url: '/favicon.ico' }],
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: 'Daniel Cabrera',
    },
  };
}
