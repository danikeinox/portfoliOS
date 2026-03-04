import { Github, Linkedin, Mail } from "lucide-react";
import type { IconType } from "react-icons";
import type { ComponentType } from "react";

// A more generic type for icons to accommodate multiple libraries
type GenericIcon = ComponentType<any> | IconType;

export const NAV_LINKS: { name: string; href: string }[] = [
  { name: "Home", href: "#home" },
  { name: "About", href: "#about" },
  { name: "Skills", href: "#skills" },
  { name: "Projects", href: "#projects" },
  { name: "Testimonials", href: "#testimonials" },
  { name: "Contact", href: "#contact" },
];

export const SOCIAL_LINKS: { name: string; href: string; icon: GenericIcon }[] = [
  { name: "Email", href: "mailto:daniel@danielcabrera.es", icon: Mail },
  { name: "GitHub", href: "https://github.com/danikeinox", icon: Github },
  { name: "LinkedIn", href: "https://linkedin.com/in/dcabreraa/", icon: Linkedin },
];

export const SKILLS: { name: string }[] = [
  { name: "React" },
  { name: "Next.js" },
  { name: "JavaScript" },
  { name: "TypeScript" },
  { name: "HTML5" },
  { name: "CSS3" },
  { name: "Tailwind CSS" },
  { name: "Node.js" },
  { name: "Firebase" },
  { name: "Cybersecurity" },
];

export const PROJECTS = [
    {
        "title": "Portfolio Website",
        "description": "The new version of my personal portfolio, designed with a modern, iOS-inspired aesthetic and built with Next.js and Tailwind CSS.",
        "image": {
            "imageUrl": "https://picsum.photos/seed/project1/600/400",
            "imageHint": "website design"
        },
        "githubUrl": "https://github.com/danikeinox",
        "liveUrl": "#",
        "tags": ["Next.js", "React", "Tailwind CSS", "TypeScript"]
    },
    {
        "title": "E-commerce Platform",
        "description": "A full-featured e-commerce site with a custom CMS, payment gateway integration, and a user-friendly interface for both customers and administrators.",
         "image": {
            "imageUrl": "https://picsum.photos/seed/project2/600/400",
            "imageHint": "online store"
        },
        "githubUrl": "https://github.com/danikeinox",
        "liveUrl": "#",
        "tags": ["Node.js", "Express", "MongoDB", "React"]
    },
    {
        "title": "Cybersecurity Dashboard",
        "description": "A real-time dashboard for monitoring network threats, visualizing security alerts, and generating incident reports.",
         "image": {
            "imageUrl": "https://picsum.photos/seed/project3/600/400",
            "imageHint": "data dashboard"
        },
        "githubUrl": "https://github.com/danikeinox",
        "liveUrl": "#",
        "tags": ["Python", "Flask", "D3.js", "WebSockets"]
    }
];
