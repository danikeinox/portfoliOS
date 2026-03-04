import { generateTestimonials, type GenerateTestimonialsOutput } from "@/ai/flows/generate-testimonials";
import TestimonialsCarousel from "@/components/testimonials-carousel";
import { SKILLS } from "@/lib/data";

const TestimonialsSection = async () => {
    let testimonialsData: GenerateTestimonialsOutput | null = null;
    try {
        testimonialsData = await generateTestimonials({
            count: 5,
            developerName: "Daniel Cabrera",
            developerSkills: SKILLS.map(s => s.name),
        });
    } catch (error) {
        console.error("Failed to generate testimonials:", error);
    }
    
    if (!testimonialsData || testimonialsData.testimonials.length === 0) {
        return null;
    }

    return (
        <section id="testimonials" className="py-16 md:py-24 bg-primary/5">
            <div className="container mx-auto px-4 md:px-6">
                <h2 className="text-3xl md:text-4xl font-bold text-center font-headline mb-12">What Others Say</h2>
                <TestimonialsCarousel testimonials={testimonialsData.testimonials} />
            </div>
        </section>
    );
};

export default TestimonialsSection;
