import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProjectBySlug, t, toProjectSlug } from '@/lib/seo/content';
import { buildProjectJsonLd } from '@/lib/seo/json-ld';
import { getSiteUrl } from '@/lib/seo/site';
import projectsData from '@/lib/projects.json';

const CASE_STUDY_SLUGS = new Set([
  'perfectos-desconocidos-2',
  'carliyoelbot',
  'tonet-browser',
]);

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return projectsData.projects
    .map((p) => toProjectSlug(p.id))
    .filter((slug) => CASE_STUDY_SLUGS.has(slug))
    .map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return { title: 'Proyecto' };

  const title = t('es', project.titleKey);
  const description = t('es', project.descriptionShortKey);
  const siteUrl = getSiteUrl();

  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}/proyectos/${slug}` },
    openGraph: { title, description, url: `${siteUrl}/proyectos/${slug}`, type: 'article' },
  };
}

export default async function ProjectCaseStudyPage({ params }: PageProps) {
  const { slug } = await params;
  if (!CASE_STUDY_SLUGS.has(slug)) notFound();

  const project = getProjectBySlug(slug);
  if (!project) notFound();

  const title = t('es', project.titleKey);
  const descriptionShort = t('es', project.descriptionShortKey);
  const descriptionLong = t('es', project.descriptionLongKey);
  const titleEn = t('en', project.titleKey);
  const descriptionLongEn = t('en', project.descriptionLongKey);
  const jsonLd = buildProjectJsonLd(slug);
  const liveUrl = project.liveUrl && project.liveUrl !== '#' ? project.liveUrl : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <main className="sr-only" lang="es">
        <article>
          <h1>{title}</h1>
          <p>{descriptionShort}</p>
          <p>{descriptionLong}</p>
          <h2>Stack tecnológico</h2>
          <ul>
            {project.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
          {liveUrl && (
            <p>
              Sitio en producción: <a href={liveUrl}>{liveUrl}</a>
            </p>
          )}
          {project.githubUrl && (
            <p>
              Código: <a href={project.githubUrl}>{project.githubUrl}</a>
            </p>
          )}
          <p>
            <Link href="/app/portfolio">Ver todos los proyectos</Link> ·{' '}
            <Link href="/cv">CV de Daniel Cabrera</Link> ·{' '}
            <Link href="/">Portfolio interactivo</Link>
          </p>
        </article>
        <article lang="en">
          <h1>{titleEn}</h1>
          <p>{descriptionLongEn}</p>
        </article>
      </main>
    </>
  );
}
