'use server';
import { Resend } from 'resend';
import { z } from 'zod';

const emailSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  message: z.string().min(1, 'Message is required'),
});

const resend = new Resend(process.env.RESEND_API_KEY);

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

export async function sendEmail(formData: FormData) {
    if (!process.env.RESEND_API_KEY) {
        if (process.env.NODE_ENV === 'production') {
            return { success: false, error: 'Email service is not configured.' };
        }
        console.warn('RESEND_API_KEY not set. Returning mock success response in non-production environment.');
        return { success: true, error: null };
    }

    const parsed = emailSchema.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
        message: formData.get('message'),
    });

    if (!parsed.success) {
        return { success: false, error: parsed.error.flatten().fieldErrors };
    }

    const { name, email, message } = parsed.data;
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeMessage = escapeHtml(message);

    try {
        const data = await resend.emails.send({
            from: 'Portfolio Contact <onboarding@resend.dev>', // IMPORTANT: This must be a configured domain in Resend
            to: 'daniel@danielcabrera.es',
            subject: `New message from ${safeName} via portfolio`,
            reply_to: email,
            html: `<p><strong>Name:</strong> ${safeName}</p><p><strong>Email:</strong> ${safeEmail}</p><p><strong>Message:</strong></p><p>${safeMessage}</p>`,
        });

        if (data.error) {
           return { success: false, error: data.error.message };
        }

        return { success: true, error: null };
    } catch (error) {
        console.error('sendEmail action failed:', error);
        return { success: false, error: 'Failed to send email.' };
    }
}
