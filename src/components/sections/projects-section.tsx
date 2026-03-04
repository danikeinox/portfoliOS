import Image from "next/image";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PROJECTS } from "@/lib/data";
import { Github, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ProjectsSection = () => {
    return (
        <section id="projects" className="py-16 md:py-24">
            <div className="container mx-auto px-4 md:px-6">
                <h2 className="text-3xl md:text-4xl font-bold text-center font-headline mb-12">Projects</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {PROJECTS.map((project) => (
                        <Card key={project.title} className="bg-card/60 backdrop-blur-lg border border-white/20 shadow-lg overflow-hidden h-full flex flex-col">
                            {project.image && (
                                <div className="aspect-video overflow-hidden">
                                <Image
                                    src={project.image.imageUrl}
                                    alt={project.description}
                                    width={600}
                                    height={400}
                                    className="object-cover w-full h-full transition-transform duration-300 hover:scale-110"
                                    data-ai-hint={project.image.imageHint}
                                />
                                </div>
                            )}
                            <CardHeader>
                                <CardTitle>{project.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <CardDescription>{project.description}</CardDescription>
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {project.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-start gap-4">
                                {project.githubUrl && (
                                    <Button variant="outline" asChild>
                                        <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                                            <Github className="mr-2 h-4 w-4" /> GitHub
                                        </a>
                                    </Button>
                                )}
                                {project.liveUrl && project.liveUrl !== "#" && (
                                    <Button asChild>
                                        <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="mr-2 h-4 w-4" /> Live Demo
                                        </a>
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ProjectsSection;
