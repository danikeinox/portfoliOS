'use server';
/**
 * @fileOverview A Genkit flow for generating realistic and varied testimonials for a developer's portfolio.
 *
 * - generateTestimonials - A function that generates testimonials based on given personas.
 * - GenerateTestimonialsInput - The input type for the generateTestimonials function.
 * - GenerateTestimonialsOutput - The return type for the generateTestimonials function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input Schema
const GenerateTestimonialsInputSchema = z.object({
  count: z.number().int().min(1).max(5).describe('The number of testimonials to generate (1-5).'),
  developerName: z.string().describe('The name of the developer for whom the testimonials are generated.'),
  developerSkills: z.array(z.string()).describe('A list of skills the developer possesses.'),
});
export type GenerateTestimonialsInput = z.infer<typeof GenerateTestimonialsInputSchema>;

// Output Schema for a single testimonial
const TestimonialSchema = z.object({
  name: z.string().describe('The name of the person giving the testimonial.'),
  role: z.string().describe('The role/title of the person giving the testimonial.'),
  company: z.string().describe('The company of the person giving the testimonial.'),
  message: z.string().describe('The actual testimonial message.'),
  tone: z.enum(['professional', 'enthusiastic', 'thoughtful', 'brief', 'detailed']).describe('The tone of the testimonial.'), // Add tone for variety
});

// Output Schema for the flow
const GenerateTestimonialsOutputSchema = z.object({
  testimonials: z.array(TestimonialSchema).describe('An array of generated testimonials.'),
});
export type GenerateTestimonialsOutput = z.infer<typeof GenerateTestimonialsOutputSchema>;

// Define a prompt that generates a single testimonial including persona details
const generateSingleTestimonialPrompt = ai.definePrompt({
  name: 'generateSingleTestimonial',
  input: {
    schema: GenerateTestimonialsInputSchema.omit({ count: true }), // Input for a single testimonial doesn't need 'count'
  },
  output: {
    schema: TestimonialSchema,
  },
  prompt: `You are an AI assistant tasked with generating a realistic and varied testimonial for a developer's portfolio.\nThe developer's name is "{{developerName}}".\nTheir skills include: {{#each developerSkills}}- {{this}}\n{{/each}}\n\nBased on this information, generate a testimonial that includes a fictional person's name, their role, their company, and a testimonial message.\nThe testimonial should praise {{developerName}}'s skills and contributions.\nVary the persona's role, company, and the tone of the message to ensure variety.\nExample roles: "Senior Developer", "Project Manager", "Team Lead", "Client Representative", "Mentor".\nExample companies: "Tech Solutions Inc.", "Global Innovations", "Creative Studio X", "Startup Z".\nExample tones: "professional", "enthusiastic", "thoughtful", "brief", "detailed".\n\nGenerate the testimonial as a JSON object following the TestimonialSchema.`,
});

// Define the main Genkit flow
const generateTestimonialsFlow = ai.defineFlow(
  {
    name: 'generateTestimonialsFlow',
    inputSchema: GenerateTestimonialsInputSchema,
    outputSchema: GenerateTestimonialsOutputSchema,
  },
  async (input) => {
    const testimonials: z.infer<typeof TestimonialSchema>[] = [];
    for (let i = 0; i < input.count; i++) {
      // Generate one testimonial at a time
      const { output } = await generateSingleTestimonialPrompt({
        developerName: input.developerName,
        developerSkills: input.developerSkills,
      });
      if (output) {
        testimonials.push(output);
      }
    }
    return { testimonials };
  }
);

// Wrapper function for the flow
export async function generateTestimonials(input: GenerateTestimonialsInput): Promise<GenerateTestimonialsOutput> {
  return generateTestimonialsFlow(input);
}
