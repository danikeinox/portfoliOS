import type { Metadata } from 'next';
import Link from 'next/link';
import { getFeaturedProjects, getSeoSummary, t } from '@/lib/seo/content';
import { buildProfilePageJsonLd } from '@/lib/seo/json-ld';
import { CONTACT_EMAIL, getSiteUrl } from '@/lib/seo/site';

export const metadata: Metadata = {
  title: 'CV — Daniel Cabrera',
  description:
    'Currículum de Daniel Cabrera: desarrollador Full-Stack en Barcelona. Next.js, TypeScript, Firebase, Supabase, Rust. Proyectos en producción para clientes.',
  alternates: {
    canonical: `${getSiteUrl()}/cv`,
  },
  robots: { index: true, follow: true },
};

export default function CvPage() {
  const es = getSeoSummary('es');
  const en = getSeoSummary('en');
  const profileJsonLd = buildProfilePageJsonLd();
  const workProjects = es.featured.filter((p) => p.filterTags.includes('work'));
  const otherProjects = getFeaturedProjects('es').filter((p) => !p.filterTags.includes('work'));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(profileJsonLd) }}
      />
      <main className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
        <div className="mx-auto max-w-3xl px-6 py-12 space-y-8 text-base leading-relaxed">
          <header className="mb-10 border-b border-neutral-200 dark:border-neutral-800 pb-8">
            <h1 className="text-3xl font-bold tracking-tight">{es.name}</h1>
            <p className="mt-2 text-lg text-neutral-600 dark:text-neutral-400">
              {es.title} · {es.location}
            </p>
            <p className="mt-3 text-sm">
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#0A84FF] hover:underline">
                {CONTACT_EMAIL}
              </a>
              {' · '}
              <a href="https://github.com/danikeinox" className="text-[#0A84FF] hover:underline">
                GitHub
              </a>
              {' · '}
              <a href="https://www.linkedin.com/in/dcabreraa/" className="text-[#0A84FF] hover:underline">
                LinkedIn
              </a>
            </p>
            <p className="mt-4">
              <Link href="/" className="text-sm text-[#0A84FF] hover:underline">
                ← Abrir portfolio interactivo
              </Link>
            </p>
          </header>

          <section>
            <h2 className="text-xl font-semibold mb-3">Resumen profesional</h2>
            <p>{es.bio}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Competencias clave</h2>
            <ul className="list-disc pl-5 space-y-1">
              {es.skills.map((skill) => (
                <li key={skill}>{skill}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Proyectos en producción (clientes)</h2>
            {workProjects.map((project) => (
              <div key={project.id} className="mb-6">
                <h3 className="text-lg font-medium">{project.title}</h3>
                <p>{project.description}</p>
                {project.liveUrl && (
                  <p>
                    <a href={project.liveUrl}>{project.liveUrl}</a>
                  </p>
                )}
                <p className="text-sm text-neutral-500">{project.tags.join(' · ')}</p>
              </div>
            ))}
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Más proyectos</h2>
            {otherProjects.map((project) => (
              <div key={project.id} className="mb-4">
                <h3 className="text-lg font-medium">{project.title}</h3>
                <p>{project.description}</p>
                {project.liveUrl && (
                  <p>
                    <a href={project.liveUrl}>{project.liveUrl}</a>
                  </p>
                )}
              </div>
            ))}
          </section>

          <section lang="en">
            <h2 className="text-xl font-semibold mb-3">English summary</h2>
            <p>
              <strong>{en.title}</strong> — {en.location}
            </p>
            <p>{en.bio}</p>
            <p>{t('en', 'seo.root.description')}</p>
          </section>

          <footer className="mt-12 pt-6 border-t border-neutral-200 dark:border-neutral-800 text-sm text-neutral-500">
            <Link href="/app/contact" className="text-[#0A84FF] hover:underline">
              Contacto
            </Link>
            {' · '}
            <Link href="/app/portfolio" className="text-[#0A84FF] hover:underline">
              Todos los proyectos
            </Link>
          </footer>
        </div>
      </main>
    </>
  );
}
