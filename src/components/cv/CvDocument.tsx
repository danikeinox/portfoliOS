import Image from 'next/image';
import Link from 'next/link';
import { getSiteUrl } from '@/lib/seo/site';
import { CV_CONTENT, CV_EMAIL, CV_LINKS, type CvLocale } from '@/lib/cv-data';
import CvPrintButton from './CvPrintButton';

type CvDocumentProps = {
  locale?: CvLocale;
};

export default function CvDocument({ locale = 'es' }: CvDocumentProps) {
  const cv = CV_CONTENT[locale];
  const altLocale: CvLocale = locale === 'es' ? 'en' : 'es';
  const siteUrl = getSiteUrl();

  const itJobs = cv.experience.filter((job) => job.category !== 'logistics');
  const parallelJobs = cv.experience.filter((job) => job.category === 'logistics');

  const renderJobs = (jobs: typeof cv.experience) =>
    jobs.map((job) => (
      <div key={`${job.company}-${job.period}`} className="relative pl-4 border-l-2 border-[#0A84FF]/40">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
          <h3 className="text-base font-semibold">{job.role}</h3>
          <span className="text-sm text-neutral-500 dark:text-neutral-400 shrink-0">{job.period}</span>
        </div>
        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {job.company} · {job.location}
        </p>
        <ul className="mt-2 space-y-1 text-sm text-neutral-600 dark:text-neutral-400 list-disc pl-4">
          {job.highlights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    ));

  return (
    <main className="cv-document min-h-screen bg-[#f5f5f7] text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 print:bg-white print:text-black">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 print:max-w-none print:px-0 print:py-0">
        <article className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900 print:rounded-none print:border-0 print:shadow-none">
          {/* Header */}
          <header className="border-b border-neutral-200 dark:border-neutral-800 px-6 py-8 sm:px-10 print:px-8 print:py-6">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-5">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-700 print:h-16 print:w-16">
                  <Image
                    src="https://cdn.danielcabrera.es/img/Profile_Portrait.png"
                    alt={cv.headline}
                    fill
                    className="object-cover"
                    sizes="80px"
                    priority
                  />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white print:text-2xl">
                    {cv.headline}
                  </h1>
                  <p className="mt-1 text-lg font-medium text-[#0A84FF]">{cv.subheadline}</p>
                  <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{cv.location}</p>
                </div>
              </div>
              <div className="flex flex-col items-start gap-3 sm:items-end">
                <CvPrintButton label={cv.sections.print} />
                <div className="text-sm space-y-1 sm:text-right">
                  <p>
                    <a href={`mailto:${CV_EMAIL}`} className="text-[#0A84FF] hover:underline">
                      {CV_EMAIL}
                    </a>
                  </p>
                  <p>
                    <a href={CV_LINKS.portfolio} className="hover:underline">
                      {CV_LINKS.portfolio.replace('https://', '')}
                    </a>
                  </p>
                  <p>
                    <a href={CV_LINKS.github} className="hover:underline">
                      github.com/danikeinox
                    </a>
                    {' · '}
                    <a href={CV_LINKS.linkedin} className="hover:underline">
                      LinkedIn
                    </a>
                  </p>
                </div>
              </div>
            </div>
            <p className="mt-6 text-base leading-relaxed text-neutral-700 dark:text-neutral-300 max-w-3xl">
              {cv.summary}
            </p>
            <p className="mt-4 print:hidden">
              <Link href="/" className="text-sm text-[#0A84FF] hover:underline">
                ← {cv.sections.openPortfolio}
              </Link>
            </p>
          </header>

          <div className="grid lg:grid-cols-[280px_1fr] print:grid-cols-[220px_1fr]">
            {/* Sidebar */}
            <aside className="border-b lg:border-b-0 lg:border-r border-neutral-200 dark:border-neutral-800 px-6 py-8 sm:px-8 space-y-8 print:px-6 print:py-6 print:space-y-6">
              <section>
                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3">
                  {cv.sections.skills}
                </h2>
                <div className="space-y-4">
                  {cv.skillGroups.map((group) => (
                    <div key={group.label}>
                      <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                        {group.label}
                      </h3>
                      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400 leading-snug">
                        {group.items.join(' · ')}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3">
                  {cv.sections.languages}
                </h2>
                <ul className="space-y-2 text-sm">
                  {cv.languages.map((lang) => (
                    <li key={lang.name} className="flex justify-between gap-2">
                      <span className="font-medium">{lang.name}</span>
                      <span className="text-neutral-500 dark:text-neutral-400">{lang.level}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3">
                  {cv.sections.certifications}
                </h2>
                <ul className="space-y-3 text-sm">
                  {cv.certifications.map((cert) => (
                    <li key={cert.name}>
                      <p className="font-medium leading-snug">{cert.name}</p>
                      <p className="text-neutral-500 dark:text-neutral-400 text-xs mt-0.5">
                        {cert.issuer} · {cert.period}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>

              {cv.other.length > 0 && (
                <section>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3">
                    {cv.sections.other}
                  </h2>
                  <ul className="space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
                    {cv.other.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
              )}
            </aside>

            {/* Main */}
            <div className="px-6 py-8 sm:px-10 space-y-10 print:px-8 print:py-6 print:space-y-8">
              <section>
                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-4">
                  {cv.sections.experience}
                </h2>
                <div className="space-y-8">
                  <div>
                    <div className="space-y-6">{renderJobs(itJobs)}</div>
                  </div>
                  {parallelJobs.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-4">{cv.sections.experienceParallel}</h3>
                      <div className="space-y-6">{renderJobs(parallelJobs)}</div>
                    </div>
                  )}
                </div>
              </section>

              <section>
                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-4">
                  {cv.sections.education}
                </h2>
                <div className="space-y-5">
                  {cv.education.map((edu) => (
                    <div key={`${edu.degree}-${edu.period}`}>
                      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                        <h3 className="text-base font-semibold">{edu.degree}</h3>
                        <span className="text-sm text-neutral-500 dark:text-neutral-400">{edu.period}</span>
                      </div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {edu.institution} · {edu.location}
                      </p>
                      {edu.details && (
                        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{edu.details}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-4">
                  {cv.sections.projects}
                </h2>
                <div className="space-y-4">
                  {cv.projects.map((project) => (
                    <div
                      key={project.title}
                      className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 print:p-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                        <h3 className="font-semibold">{project.title}</h3>
                        {project.url && (
                          <a
                            href={project.url}
                            className="text-sm text-[#0A84FF] hover:underline break-all"
                          >
                            {project.url.replace(/^https?:\/\//, '')}
                          </a>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                        {project.description}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>

          <footer className="border-t border-neutral-200 dark:border-neutral-800 px-6 py-5 sm:px-10 flex flex-wrap gap-4 text-sm text-neutral-500 print:px-8">
            <Link href="/app/contact" className="text-[#0A84FF] hover:underline print:hidden">
              {cv.sections.contact}
            </Link>
            <Link href="/app/portfolio" className="text-[#0A84FF] hover:underline print:hidden">
              {cv.sections.allProjects}
            </Link>
            <span className="text-neutral-400">
              {siteUrl}/cv
            </span>
          </footer>
        </article>

        {/* Alternate language summary for SEO / bilingual recruiters */}
        <section
          lang={altLocale}
          className="sr-only"
          aria-hidden="true"
        >
          <h2>{CV_CONTENT[altLocale].headline}</h2>
          <p>{CV_CONTENT[altLocale].summary}</p>
        </section>
      </div>
    </main>
  );
}
