import { Button } from "@/components/ui/button";
import { SOCIAL_LINKS } from "@/lib/data";
import { Mail } from "lucide-react";

const ContactSection = () => {
    const emailLink = SOCIAL_LINKS.find(link => link.name === "Email");

    return (
        <section id="contact" className="py-16 md:py-24 text-center">
            <div className="container mx-auto px-4 md:px-6">
                <h2 className="text-3xl md:text-4xl font-bold font-headline mb-4">Get In Touch</h2>
                <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-8">
                    I'm always open to discussing new projects, creative ideas, or opportunities to be part of an amazing team. Feel free to reach out.
                </p>
                {emailLink && (
                    <Button size="lg" asChild>
                        <a href={emailLink.href}>
                            <Mail className="mr-2 h-5 w-5" /> Say Hello
                        </a>
                    </Button>
                )}
                <div className="flex justify-center gap-4 mt-8">
                    {SOCIAL_LINKS.filter(link => link.name !== "Email").map((link) => (
                        <Button key={link.href} variant="ghost" size="icon" asChild>
                            <a href={link.href} target="_blank" rel="noopener noreferrer" aria-label={link.name}>
                                <link.icon className="h-6 w-6" />
                            </a>
                        </Button>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ContactSection;
