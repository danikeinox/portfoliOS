import type { Metadata } from 'next';
import CvDocument from '@/components/cv/CvDocument';
import { CV_EMAIL } from '@/lib/cv-data';
import { buildProfilePageJsonLd } from '@/lib/seo/json-ld';
import { getSiteUrl } from '@/lib/seo/site';

export const metadata: Metadata = {
  title: 'CV — Daniel Cabrera | Desarrollador Full-Stack',
  description:
    'Currículum de Daniel Cabrera: desarrollador Full-Stack en Barcelona. Next.js, TypeScript, Python, Firebase, Supabase. Experiencia en soporte técnico, proyectos en producción y ciberseguridad.',
  alternates: {
    canonical: `${getSiteUrl()}/cv`,
  },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'CV — Daniel Cabrera | Full-Stack Developer',
    description:
      'Full-Stack developer in Barcelona. Production web projects, IT infrastructure background, Next.js and TypeScript.',
    url: `${getSiteUrl()}/cv`,
    type: 'profile',
  },
};

export default function CvPage() {
  const profileJsonLd = buildProfilePageJsonLd();
  const enrichedJsonLd = {
    ...profileJsonLd,
    mainEntity: {
      ...(profileJsonLd.mainEntity as Record<string, unknown>),
      email: CV_EMAIL,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(enrichedJsonLd) }}
      />
      <CvDocument locale="es" />
    </>
  );
}
