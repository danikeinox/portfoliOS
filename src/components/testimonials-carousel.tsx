"use client";

import { CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import type { GenerateTestimonialsOutput } from "@/ai/flows/generate-testimonials";
import { Quote } from "lucide-react";

type Testimonial = GenerateTestimonialsOutput["testimonials"][0];

const TestimonialsCarousel = ({ testimonials }: { testimonials: Testimonial[] }) => {
  return (
    <Carousel
        opts={{
            align: "start",
            loop: true,
        }}
        className="w-full max-w-4xl mx-auto"
    >
      <CarouselContent>
        {testimonials.map((testimonial, index) => (
          <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
            <div className="p-1 h-full">
              <div className="bg-card/60 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg h-full">
                <CardContent className="flex flex-col h-full justify-between p-6">
                  <Quote className="w-8 h-8 text-primary mb-4" />
                  <p className="text-foreground/80 italic mb-6 flex-grow">"{testimonial.message}"</p>
                  <div>
                    <p className="font-bold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}, {testimonial.company}</p>
                  </div>
                </CardContent>
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="hidden md:inline-flex"/>
      <CarouselNext className="hidden md:inline-flex"/>
    </Carousel>
  );
};

export default TestimonialsCarousel;
