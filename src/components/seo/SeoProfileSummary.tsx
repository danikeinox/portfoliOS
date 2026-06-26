import Link from 'next/link';
import { getSeoSummary, t } from '@/lib/seo/content';

/**
 * Server-rendered semantic summary for crawlers and screen readers.
 * Visually hidden — does not affect the iOS portfolio UI.
 */
export default function SeoProfileSummary() {
  const es = getSeoSummary('es');
  const en = getSeoSummary('en');

  return (
    <div className="sr-only" aria-label="Professional profile summary">
      <article id="profile-summary" lang="es">
        <h1>
          {es.name} — {es.title} ({es.location})
        </h1>
        <p>{t('es', 'seo.root.description')}</p>
        <p>{es.bio}</p>

        <h2>Competencias</h2>
        <ul>
          {es.skills.map((skill) => (
            <li key={skill}>{skill}</li>
          ))}
        </ul>

        <h2>Proyectos destacados</h2>
        <ul>
          {es.featured.map((project) => (
            <li key={project.id}>
              <strong>{project.title}</strong>: {project.description}
              {project.liveUrl && (
                <>
                  {' '}
                  — <a href={project.liveUrl}>{project.liveUrl}</a>
                </>
              )}
            </li>
          ))}
        </ul>

        <nav aria-label="Secciones del portfolio">
          <h2>Navegación</h2>
          <ul>
            <li>
              <Link href="/app/about">Sobre mí</Link>
            </li>
            <li>
              <Link href="/app/portfolio">Proyectos</Link>
            </li>
            <li>
              <Link href="/app/contact">Contacto</Link>
            </li>
            <li>
              <Link href="/cv">CV / Resume</Link>
            </li>
            <li>
              <Link href="/proyectos/perfectos-desconocidos-2">Perfectos Desconocidos 2</Link>
            </li>
            <li>
              <Link href="/proyectos/carliyoelbot">Carliyoelbot</Link>
            </li>
            <li>
              <Link href="/proyectos/tonet-browser">Tonet Browser</Link>
            </li>
          </ul>
        </nav>

        <p>
          <a href={`mailto:${es.email}`}>{es.email}</a> ·{' '}
          <a href="https://github.com/danikeinox">GitHub</a> ·{' '}
          <a href="https://www.linkedin.com/in/dcabreraa/">LinkedIn</a>
        </p>
      </article>

      <article lang="en">
        <h1>
          {en.name} — {en.title} ({en.location})
        </h1>
        <p>{t('en', 'seo.root.description')}</p>
        <p>{en.bio}</p>

        <h2>Core skills</h2>
        <ul>
          {en.skills.map((skill) => (
            <li key={`en-${skill}`}>{skill}</li>
          ))}
        </ul>

        <h2>Featured projects</h2>
        <ul>
          {en.featured.map((project) => (
            <li key={`en-${project.id}`}>
              <strong>{project.title}</strong>: {project.description}
              {project.liveUrl && (
                <>
                  {' '}
                  — <a href={project.liveUrl}>{project.liveUrl}</a>
                </>
              )}
            </li>
          ))}
        </ul>
      </article>
    </div>
  );
}
