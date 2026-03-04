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

    const renderSkill = (skill: {name: string; icon: string}) => {
        const Icon = iconMap[skill.icon] || Code;
        return (
             <div key={skill.name} className="flex items-center gap-4 bg-neutral-100 rounded-xl p-4">
                <div className="w-10 h-10 bg-neutral-200 rounded-lg flex items-center justify-center">
                    <Icon className="h-6 w-6 text-neutral-600" />
                </div>
                <h3 className="font-semibold text-neutral-800 text-base">{skill.name}</h3>
            </div>
        )
    };

    return (
        <div className="bg-white text-black w-full pb-24">
            <div className="p-4 md:p-6 space-y-10">
                {/* Header Section */}
                <section className="flex flex-col items-center text-center pt-8">
                    <Image 
                        src={aboutData.profileImage.url} 
                        alt={aboutData.name}
                        width={120} 
                        height={120} 
                        className="rounded-full border-4 border-neutral-200 shadow-md"
                        data-ai-hint={aboutData.profileImage.aiHint}
                    />
                    <h1 className="text-4xl font-bold mt-4 tracking-tight">{aboutData.name}</h1>
                    <p className="text-xl text-neutral-500 mt-1">{t(aboutData.titleKey)}</p>
                     <div className="mt-4 flex items-center gap-2 text-sm text-neutral-500">
                        <MapPin className="w-4 h-4" />
                        <span>{t(aboutData.locationKey)}</span>
                    </div>
                </section>
                
                {/* Bio Section */}
                <section>
                    <p className="text-neutral-700 text-base md:text-lg text-center max-w-2xl mx-auto leading-relaxed">{t(aboutData.bioKey)}</p>
                </section>
                
                {/* Explore my work section */}
                <section>
                    <h2 className="text-2xl font-bold text-center mb-6">{t('about.page.exploreTitle', {name: 'Daniel'})}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                        <Link href="/app/portfolio">
                            <Card className="bg-neutral-100 hover:bg-neutral-200 transition-colors h-full">
                                <CardHeader>
                                    <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center mb-2">
                                        <AppWindow className="w-7 h-7 text-gray-700"/>
                                    </div>
                                    <CardTitle className="text-lg">{t('app.portfolio')}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-neutral-600 flex items-center">{t('about.page.explorePortfolio')} <ArrowRight className="w-4 h-4 ml-1"/></p>
                                </CardContent>
                            </Card>
                        </Link>
                         <Link href="/app/blog">
                            <Card className="bg-neutral-100 hover:bg-neutral-200 transition-colors h-full">
                                <CardHeader>
                                    <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-2">
                                        <Rss className="w-7 h-7 text-yellow-600"/>
                                    </div>
                                    <CardTitle className="text-lg">{t('app.blog')}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-neutral-600 flex items-center">{t('about.page.exploreBlog')} <ArrowRight className="w-4 h-4 ml-1"/></p>
                                </CardContent>
                            </Card>
                         </Link>
                         <Link href="/app/testimonials">
                            <Card className="bg-neutral-100 hover:bg-neutral-200 transition-colors h-full">
                                <CardHeader>
                                     <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-2">
                                        <MessagesSquare className="w-7 h-7 text-green-600"/>
                                    </div>
                                    <CardTitle className="text-lg">{t('app.testimonials')}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-neutral-600 flex items-center">{t('about.page.exploreTestimonials')} <ArrowRight className="w-4 h-4 ml-1"/></p>
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
                    <p className="text-neutral-600 max-w-lg mx-auto mb-6">{t('about.page.contactDesc')}</p>
                    <Button asChild size="lg">
                        <Link href="/app/contact">
                           {t('app.contact')} <ArrowRight className="w-4 h-4 ml-2"/>
                        </Link>
                    </Button>
                </section>
            </div>
        </div>
    );
};

export default AboutPage;
