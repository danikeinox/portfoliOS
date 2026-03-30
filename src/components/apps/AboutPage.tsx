'use client';
import Image from 'next/image';
import { useI18n } from '@/hooks/use-i18n';
import aboutData from '@/lib/about.json';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Code, AppWindow, FileCode, Server, Database, Wind, ShieldCheck, User, Briefcase, MapPin, ArrowRight, Rss, MessagesSquare } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '../ui/button';
import Link from 'next/link';

const iconMap: { [key: string]: LucideIcon } = {
    Code,
    AppWindow,
    FileCode,
    Server,
    Database,
    Wind,
    ShieldCheck,
    User,
    Briefcase,
    MapPin
};

const AboutPage = () => {
    const { t } = useI18n();

    const renderSkill = (skill: { name: string; icon: string }) => {
        const Icon = iconMap[skill.icon] || Code;
        return (
            <div key={skill.name} className="flex items-center gap-4 rounded-2xl border border-neutral-200/80 bg-neutral-100/80 p-4 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/70">
                <div className="w-10 h-10 rounded-xl bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-neutral-600 dark:text-neutral-300" />
                </div>
                <h3 className="font-semibold text-neutral-800 dark:text-neutral-100 text-base">{skill.name}</h3>
            </div>
        )
    };

    return (
        <div className="w-full pb-24 bg-white text-black dark:bg-black dark:text-white transition-colors">
            <div className="p-4 md:p-6 space-y-10">
                {/* Header Section */}
                <section className="flex flex-col items-center text-center pt-8">
                    <div className="w-32 h-32 relative">
                        <Image
                            src={aboutData.profileImage.url}
                            alt={aboutData.name}
                            fill
                            className="rounded-full border-4 border-neutral-200 dark:border-neutral-700 shadow-md"
                            data-ai-hint={aboutData.profileImage.aiHint}
                            unoptimized={true}
                        />
                    </div>
                    <h1 className="text-4xl font-bold mt-4 tracking-tight text-neutral-900 dark:text-neutral-50">{aboutData.name}</h1>
                    <p className="text-xl text-neutral-500 dark:text-neutral-400 mt-1">{t(aboutData.titleKey)}</p>
                    <div className="mt-4 flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                        <MapPin className="w-4 h-4" />
                        <span>{t(aboutData.locationKey)}</span>
                    </div>
                </section>

                {/* Bio Section */}
                <section>
                    <p className="text-neutral-700 dark:text-neutral-300 text-base md:text-lg text-center max-w-2xl mx-auto leading-relaxed">{t(aboutData.bioKey)}</p>
                </section>

                {/* Explore my work section */}
                <section>
                    <h2 className="text-2xl font-bold text-center mb-6">{t('about.page.exploreTitle', { name: 'Daniel' })}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                        <Link href="/app/portfolio">
                            <Card className="h-full rounded-2xl border border-neutral-200/80 bg-neutral-100/80 backdrop-blur-sm transition-colors hover:bg-neutral-200/80 dark:border-neutral-800 dark:bg-neutral-900/70 dark:hover:bg-neutral-800/70">
                                <CardHeader>
                                    <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-800 rounded-xl flex items-center justify-center mb-2">
                                        <AppWindow className="w-7 h-7 text-neutral-700 dark:text-neutral-200" />
                                    </div>
                                    <CardTitle className="text-lg">{t('app.portfolio')}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-300 flex items-center">{t('about.page.explorePortfolio')} <ArrowRight className="w-4 h-4 ml-1" /></p>
                                </CardContent>
                            </Card>
                        </Link>
                        <Link href="/app/blog">
                            <Card className="h-full rounded-2xl border border-neutral-200/80 bg-neutral-100/80 backdrop-blur-sm transition-colors hover:bg-neutral-200/80 dark:border-neutral-800 dark:bg-neutral-900/70 dark:hover:bg-neutral-800/70">
                                <CardHeader>
                                    <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center mb-2">
                                        <Rss className="w-7 h-7 text-yellow-600 dark:text-yellow-400" />
                                    </div>
                                    <CardTitle className="text-lg">{t('app.blog')}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-300 flex items-center">{t('about.page.exploreBlog')} <ArrowRight className="w-4 h-4 ml-1" /></p>
                                </CardContent>
                            </Card>
                        </Link>
                        <Link href="/app/testimonials">
                            <Card className="h-full rounded-2xl border border-neutral-200/80 bg-neutral-100/80 backdrop-blur-sm transition-colors hover:bg-neutral-200/80 dark:border-neutral-800 dark:bg-neutral-900/70 dark:hover:bg-neutral-800/70">
                                <CardHeader>
                                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-2">
                                        <MessagesSquare className="w-7 h-7 text-green-600 dark:text-green-400" />
                                    </div>
                                    <CardTitle className="text-lg">{t('app.testimonials')}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-300 flex items-center">{t('about.page.exploreTestimonials')} <ArrowRight className="w-4 h-4 ml-1" /></p>
                                </CardContent>
                            </Card>
                        </Link>
                    </div>
                </section>

                {/* Skills Section */}
                <section>
                    <h2 className="text-2xl font-bold text-center mb-6">{t(aboutData.skillsTitleKey)}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                        {aboutData.skills.map(renderSkill)}
                    </div>
                </section>

                {/* Contact Section */}
                <section className="text-center">
                    <h2 className="text-2xl font-bold mb-4">{t('about.page.contactTitle')}</h2>
                    <p className="text-neutral-600 dark:text-neutral-300 max-w-lg mx-auto mb-6">{t('about.page.contactDesc')}</p>
                    <Button asChild size="lg">
                        <Link href="/app/contact">
                            {t('app.contact')} <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                    </Button>
                </section>
            </div>
        </div>
    );
};

export default AboutPage;
