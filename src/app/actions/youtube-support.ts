'use server';
import { Resend } from 'resend';
import { z } from 'zod';

const supportSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  problem: z.string().min(1, 'Problem description is required'),
});

export async function sendYoutubeSupport(formData: FormData) {
    if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY not set.');
        return { success: false, error: 'Email service is not configured.' };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const parsed = supportSchema.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
        problem: formData.get('problem'),
    });

    if (!parsed.success) {
        return { success: false, error: 'Invalid form data' };
    }

    const { name, email, problem } = parsed.data;

    try {
        const data = await resend.emails.send({
            from: 'YouTube Support <youtube@danielcabrera.es>', // Depending on Resend configuration, maybe keep this
            to: 'daniel@danielcabrera.es',
            cc: email,
            subject: `Soporte Técnico YouTube (Portfolio) - ${name}`,
            reply_to: email,
            html: `<p><strong>Nombre y apellidos:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Problema:</strong></p><p>${problem}</p>`,
        });

        if (data.error) {
           return { success: false, error: data.error.message };
        }

        return { success: true, error: null };
    } catch (error) {
        console.error('sendYoutubeSupport action failed:', error);
        return { success: false, error: 'Failed to send email.' };
    }
}
