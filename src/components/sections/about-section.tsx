import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AgeCalculator from "@/components/age-calculator";
import { Briefcase, User } from "lucide-react";

const AboutSection = () => {
  const birthDate = "1995-10-20";

  return (
    <section id="about" className="py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-center font-headline mb-12">About Me</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          <Card className="lg:col-span-2 bg-card/60 backdrop-blur-lg border border-white/20 shadow-lg">
            <CardContent className="p-8">
              <p className="text-lg text-foreground/80 leading-relaxed">
                I am a passionate <strong>Full-Stack programmer</strong> with a solid background in both <strong>cybersecurity and software development</strong>. My professional journey is driven by a commitment to continuous learning and the ability to adapt to new challenges and technologies. I thrive on building elegant, efficient, and secure web experiences.
              </p>
            </CardContent>
          </Card>
          <div className="grid grid-cols-2 gap-6">
            <Card className="text-center bg-card/60 backdrop-blur-lg border border-white/20 shadow-lg p-4">
              <CardHeader className="p-2">
                <CardTitle className="flex flex-col items-center gap-2 text-lg font-medium">
                  <User className="h-8 w-8 text-primary" />
                  Age
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <p className="text-5xl font-bold">
                  <AgeCalculator birthDate={birthDate} />
                </p>
              </CardContent>
            </Card>
            <Card className="text-center bg-card/60 backdrop-blur-lg border border-white/20 shadow-lg p-4">
              <CardHeader className="p-2">
                <CardTitle className="flex flex-col items-center gap-2 text-lg font-medium">
                  <Briefcase className="h-8 w-8 text-primary" />
                  Experience
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <p className="text-5xl font-bold">3+</p>
                <p className="text-sm text-muted-foreground">Years</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
