
'use client';
import { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import projectsData from "@/lib/projects.json";
import { Github, ExternalLink, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/hooks/use-i18n";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

const projects = projectsData.projects;

const Portfolio = () => {
    const { t } = useI18n();
    const [selectedProject, setSelectedProject] = useState<(typeof projects[0]) | null>(null);

    const allImages = selectedProject ? [selectedProject.mainImage, ...selectedProject.gallery].filter(img => img && img.imageUrl) : [];

    return (
        <div className="w-full min-h-full bg-[#F2F2F7] dark:bg-black text-black dark:text-white pb-12">
            <div className="max-w-xl mx-auto py-4 px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((project) => (
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
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <CardDescription className="text-[#8A8A8E] dark:text-[#8E8E93] line-clamp-3">{t(project.descriptionShortKey)}</CardDescription>
                            <div className="flex flex-wrap gap-2 mt-4">
                                {project.tags.map(tag => <Badge key={tag} variant="secondary" className="bg-[#F2F2F7] dark:bg-[#2C2C2E] text-black dark:text-white">{tag}</Badge>)}
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-start gap-4 bg-[#F2F2F7]/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl p-4 mt-auto border-t border-neutral-200 dark:border-[#38383A]">
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
