import type { MetadataRoute } from 'next';
import { INDEXABLE_ROUTES } from '@/lib/seo/routes';
import { getSiteUrl } from '@/lib/seo/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();

  return INDEXABLE_ROUTES.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
