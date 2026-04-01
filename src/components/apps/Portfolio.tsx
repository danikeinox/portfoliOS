
'use client';
import { useMemo, useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import projectsData from "@/lib/projects.json";
import { Github, ExternalLink, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/hooks/use-i18n";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

const projects = projectsData.projects;

const FILTER_COLOR_MAP: Record<string, string> = {
    'proyecto personal': 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30',
    'intento de startup': 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30',
    'juegos': 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30',
    'trabajos': 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30',
};

const FALLBACK_FILTER_COLORS = [
    'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30',
    'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/30',
    'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30',
    'bg-lime-100 text-lime-700 border-lime-200 dark:bg-lime-500/20 dark:text-lime-300 dark:border-lime-500/30',
];

const getFilterTagColorClass = (tag: string) => {
    if (FILTER_COLOR_MAP[tag]) return FILTER_COLOR_MAP[tag];
    const hash = Array.from(tag).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return FALLBACK_FILTER_COLORS[hash % FALLBACK_FILTER_COLORS.length];
};

const Portfolio = () => {
    const { t } = useI18n();
    const [selectedProject, setSelectedProject] = useState<(typeof projects[0]) | null>(null);
    const [activeFilterTags, setActiveFilterTags] = useState<string[]>([]);

    const availableFilterTags = useMemo(
        () => Array.from(new Set(projects.flatMap((project) => project.filterTags || []))),
        []
    );

    const filteredProjects = useMemo(() => {
        if (activeFilterTags.length === 0) return projects;
        return projects.filter((project) =>
            (project.filterTags || []).some((tag) => activeFilterTags.includes(tag))
        );
    }, [activeFilterTags]);

    const toggleFilterTag = (tag: string) => {
        setActiveFilterTags((prev) =>
            prev.includes(tag) ? prev.filter((currentTag) => currentTag !== tag) : [...prev, tag]
        );
    };

    const allImages = selectedProject ? [selectedProject.mainImage, ...selectedProject.gallery].filter(img => img && typeof img === 'object' && 'imageUrl' in img && !!img.imageUrl) as { imageUrl: string; imageHint: string }[] : []; // TypeScript fix

    return (
        <div className="w-full min-h-full bg-[#F2F2F7] dark:bg-black text-black dark:text-white pb-12">
            <div className="max-w-6xl mx-auto py-4 px-4">
                <div className="mb-5 space-y-3">
                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            size="sm"
                            variant={activeFilterTags.length === 0 ? "default" : "outline"}
                            className={activeFilterTags.length === 0 ? "bg-system-blue hover:bg-system-blue/90" : "border-neutral-300 dark:border-[#38383A]"}
                            onClick={() => setActiveFilterTags([])}
                        >
                            Todos
                        </Button>
                        {availableFilterTags.map((filterTag) => {
                            const isActive = activeFilterTags.includes(filterTag);
                            return (
                                <button
                                    key={filterTag}
                                    type="button"
                                    onClick={() => toggleFilterTag(filterTag)}
                                    className={cn(
                                        'px-3 py-1.5 rounded-full border text-xs font-semibold capitalize transition-all',
                                        getFilterTagColorClass(filterTag),
                                        isActive ? 'ring-2 ring-offset-2 ring-system-blue dark:ring-offset-black' : 'opacity-85 hover:opacity-100'
                                    )}
                                >
                                    {filterTag}
                                </button>
                            );
                        })}
                    </div>
                    {activeFilterTags.length > 0 && (
                        <p className="text-xs text-[#8A8A8E] dark:text-[#8E8E93]">
                            Mostrando {filteredProjects.length} proyecto(s) para: {activeFilterTags.join(', ')}
                        </p>
                    )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredProjects.map((project) => (
                        <Card
                            key={project.id}
                            onClick={() => setSelectedProject(project)}
                            className="bg-white dark:bg-[#1C1C1E] rounded-xl border-neutral-200 dark:border-[#38383A] overflow-hidden h-full flex flex-col cursor-pointer hover:border-[#0A84FF]/50 transition-colors group"
                        >
                            {project.mainImage && (
                                <div className="aspect-video overflow-hidden">
                                    <Image
                                        src={project.mainImage.imageUrl}
                                        alt={t(project.descriptionShortKey)}
                                        width={600}
                                        height={400}
                                        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                                        data-ai-hint={project.mainImage.imageHint}
                                    />
                                </div>
                            )}
                            <CardHeader>
                                <CardTitle className="text-black dark:text-white">{t(project.titleKey)}</CardTitle>
                                {(project.filterTags || []).length > 0 && (
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {project.filterTags.map((filterTag) => (
                                            <Badge
                                                key={`${project.id}-${filterTag}`}
                                                variant="outline"
                                                className={cn('border capitalize', getFilterTagColorClass(filterTag))}
                                            >
                                                {filterTag}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <CardDescription className="text-[#8A8A8E] dark:text-[#8E8E93] line-clamp-3">{t(project.descriptionShortKey)}</CardDescription>
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {project.tags.map(tag => <Badge key={tag} variant="secondary" className="bg-[#F2F2F7] dark:bg-[#2C2C2E] text-black dark:text-white">{tag}</Badge>)}
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-wrap justify-start gap-2 bg-[#F2F2F7]/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl p-4 mt-auto border-t border-neutral-200 dark:border-[#38383A]">
                                {project.githubUrl && (
                                    <Button variant="outline" asChild className="border-neutral-300 dark:border-[#38383A] hover:bg-neutral-100 dark:hover:bg-[#2C2C2E]">
                                        <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                                            <Github className="mr-2 h-4 w-4" /> {t('portfolio.github')}
                                        </a>
                                    </Button>
                                )}
                                {project.liveUrl && project.liveUrl !== "#" && (
                                    <Button asChild className="bg-system-blue hover:bg-system-blue/90">
                                        <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                                            <ExternalLink className="mr-2 h-4 w-4" /> {t('portfolio.liveDemo')}
                                        </a>
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    ))}
                </div>
                {filteredProjects.length === 0 && (
                    <div className="mt-6 rounded-xl border border-neutral-200 dark:border-[#38383A] bg-white dark:bg-[#1C1C1E] p-6 text-center text-[#8A8A8E] dark:text-[#8E8E93]">
                        No hay proyectos con esos filtros.
                    </div>
                )}
            </div>

            <Dialog open={!!selectedProject} onOpenChange={(isOpen) => !isOpen && setSelectedProject(null)}>
                <DialogContent className="bg-[#F2F2F7]/80 dark:bg-[#1C1C1E]/80 text-black dark:text-white backdrop-blur-xl border-neutral-300 dark:border-[#38383A] max-w-2xl p-0">
                    {selectedProject && (
                        <>
                            <DialogHeader className="p-6 pb-0">
                                <DialogTitle className="text-2xl">{t(selectedProject.titleKey)}</DialogTitle>
                                <DialogClose className="absolute right-4 top-4 rounded-full bg-black/20 p-1 opacity-70 hover:opacity-100 z-10">
                                    <X className="h-4 w-4" />
                                </DialogClose>
                            </DialogHeader>
                            <div className="p-6 pt-2 max-h-[80vh] overflow-y-auto">
                                {allImages.length > 0 && (
                                    <div className="mb-4 rounded-lg overflow-hidden">
                                        {allImages.length > 1 ? (
                                            <Carousel className="w-full">
                                                <CarouselContent>
                                                    {allImages.map((img, index) => (
                                                        <CarouselItem key={index}>
                                                            <Image
                                                                src={img.imageUrl}
                                                                alt={`${t(selectedProject.titleKey)} - image ${index + 1}`}
                                                                width={800}
                                                                height={450}
                                                                className="object-cover w-full aspect-video"
                                                                data-ai-hint={img.imageHint}
                                                            />
                                                        </CarouselItem>
                                                    ))}
                                                </CarouselContent>
                                                <CarouselPrevious className="left-2 text-white" />
                                                <CarouselNext className="right-2 text-white" />
                                            </Carousel>
                                        ) : (
                                            <Image
                                                src={selectedProject.mainImage.imageUrl}
                                                alt={t(selectedProject.titleKey)}
                                                width={800}
                                                height={450}
                                                className="object-cover w-full aspect-video"
                                                data-ai-hint={selectedProject.mainImage.imageHint}
                                            />
                                        )}
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-2 my-4">
                                    {(selectedProject.filterTags || []).map((filterTag) => (
                                        <Badge key={`${selectedProject.id}-filter-${filterTag}`} variant="outline" className={cn('border capitalize', getFilterTagColorClass(filterTag))}>
                                            {filterTag}
                                        </Badge>
                                    ))}
                                    {selectedProject.tags.map(tag => <Badge key={tag} variant="secondary" className="bg-white dark:bg-[#2C2C2E] text-black dark:text-white">{tag}</Badge>)}
                                </div>

                                <p className="text-[#8A8A8E] dark:text-[#8E8E93] leading-relaxed whitespace-pre-line">
                                    {t(selectedProject.descriptionLongKey)}
                                </p>
                            </div>

                            {(selectedProject.githubUrl || (selectedProject.liveUrl && selectedProject.liveUrl !== "#")) && (
                                <div className="flex justify-start gap-4 bg-[#F2F2F7]/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl p-6 pt-4 border-t border-neutral-300 dark:border-[#38383A]">
                                    {selectedProject.githubUrl && (
                                        <Button variant="outline" asChild className="border-neutral-300 dark:border-[#38383A] hover:bg-neutral-100 dark:hover:bg-[#2C2C2E]">
                                            <a href={selectedProject.githubUrl} target="_blank" rel="noopener noreferrer">
                                                <Github className="mr-2 h-4 w-4" /> {t('portfolio.github')}
                                            </a>
                                        </Button>
                                    )}
                                    {selectedProject.liveUrl && selectedProject.liveUrl !== "#" && (
                                        <Button asChild className="bg-system-blue hover:bg-system-blue/90">
                                            <a href={selectedProject.liveUrl} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="mr-2 h-4 w-4" /> {t('portfolio.liveDemo')}
                                            </a>
                                        </Button>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Portfolio;
