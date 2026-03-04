import { SKILLS } from "@/lib/data";
import { Card, CardContent } from "@/components/ui/card";
import { Code, AppWindow, FileCode, Paintbrush, Wind, Server, Database, ShieldCheck, type LucideIcon } from "lucide-react";
import type { FC } from "react";

const iconMap: Record<string, LucideIcon> = {
    "React": Code,
    "Next.js": AppWindow,
    "JavaScript": FileCode,
    "TypeScript": FileCode,
    "HTML5": FileCode,
    "CSS3": Paintbrush,
    "Tailwind CSS": Wind,
    "Node.js": Server,
    "Firebase": Database,
    "Cybersecurity": ShieldCheck,
};

const SkillsSection = () => {
  return (
    <section id="skills" className="py-16 md:py-24 bg-primary/5">
      <div className="container mx-auto px-4 md:px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-center font-headline mb-12">My Skills</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {SKILLS.map((skill) => {
            const Icon = iconMap[skill.name] || Code;
            return (
              <Card key={skill.name} className="bg-card/60 backdrop-blur-lg border border-white/20 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <CardContent className="p-6 flex flex-col items-center justify-center gap-4 text-center h-full">
                  <Icon className="h-12 w-12 text-primary" />
                  <h3 className="font-semibold text-lg">{skill.name}</h3>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  );
};

export default SkillsSection;
