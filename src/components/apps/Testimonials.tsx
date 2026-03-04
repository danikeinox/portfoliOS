'use client';
import { useMemo } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy, addDoc, serverTimestamp, type DocumentData } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MessageSquare, Quote } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useI18n } from '@/hooks/use-i18n';


const Testimonials = () => {
    const firestore = useFirestore();
    const { toast } = useToast();
    const { t } = useI18n();

    const testimonialSchema = z.object({
      name: z.string().min(2, { message: t('form.validation.nameRequired')}),
      message: z.string().min(10, { message: t('form.validation.testimonialMessage')}),
    });
    
    type TestimonialFormValues = z.infer<typeof testimonialSchema>;

    const testimonialsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'testimonials'), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const { data: testimonials, loading } = useCollection(testimonialsQuery);
    
    const form = useForm<TestimonialFormValues>({
        resolver: zodResolver(testimonialSchema),
        defaultValues: { name: '', message: '' },
    });

    const onSubmit = async (data: TestimonialFormValues) => {
        if (!firestore) return;

        try {
            await addDoc(collection(firestore, 'testimonials'), {
                ...data,
                createdAt: serverTimestamp(),
            });
            toast({ title: t('testimonials.thankYou'), description: t('testimonials.submitted') });
            form.reset();
        } catch (error) {
            toast({ variant: 'destructive', title: t('form.error'), description: t('testimonials.error') });
        }
    };

    return (
        <div className="w-full min-h-full bg-[#F2F2F7] dark:bg-black text-black dark:text-white pb-12">
            <div className="max-w-xl mx-auto py-4">
            <div className="px-4">
                <h1 className="text-3xl font-bold mb-2">{t('testimonials.title')}</h1>
                <p className="text-[#8A8A8E] dark:text-[#8E8E93] mb-8">{t('testimonials.subtitle')}</p>
            </div>

            <div className="mb-12 space-y-4">
                 <h2 className="text-xl font-bold text-black dark:text-white px-4">{t('testimonials.leave')}</h2>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden mx-4 my-4">
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input placeholder={t('testimonials.formNamePlaceholder')} {...field} className="bg-transparent border-none text-base h-auto p-3 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-b-none border-b border-neutral-200 dark:border-[#38383A] text-black dark:text-white"/>
                                    </FormControl>
                                    <FormMessage className="pt-1 px-3 pb-2"/>
                                </FormItem>
                            )}/>
                             <FormField control={form.control} name="message" render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Textarea placeholder={t('testimonials.formMessagePlaceholder')} {...field} className="bg-transparent border-none text-base h-auto p-3 focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[80px] rounded-t-none text-black dark:text-white"/>
                                    </FormControl>
                                    <FormMessage className="pt-1 px-3 pb-2"/>
                                </FormItem>
                            )}/>
                        </div>
                        <div className="px-4">
                        <Button type="submit" size="lg" className="w-full bg-[#0A84FF] hover:bg-[#0A84FF]/90 text-base font-semibold" disabled={form.formState.isSubmitting}>
                             {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('testimonials.submit')}
                        </Button>
                        </div>
                    </form>
                </Form>
            </div>
            
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-black dark:text-white px-4">{t('testimonials.whatTheySay')}</h2>
                {loading && (
                     <div className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden mx-4 my-4 p-4 space-y-4">
                        <Skeleton className="h-16 w-full" />
                        <div className="h-px bg-neutral-200 dark:bg-[#38383A]" />
                        <Skeleton className="h-16 w-full" />
                    </div>
                )}
                {testimonials && testimonials.length > 0 && (
                     <div className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden mx-4 my-4">
                        {testimonials.map((testimonial: DocumentData, index: number) => (
                            <div key={testimonial.id}>
                                <div className="p-4">
                                    <div className="flex gap-3">
                                        <Quote className="w-5 h-5 text-[#8A8A8E] dark:text-[#8E8E93] shrink-0 mt-1" />
                                        <div>
                                            <p className="text-black dark:text-white mb-2">"{testimonial.message}"</p>
                                            <p className="font-semibold text-sm text-[#8A8A8E] dark:text-[#8E8E93]">&ndash; {testimonial.name}</p>
                                        </div>
                                    </div>
                                </div>
                                {index < testimonials.length - 1 && (
                                    <div className="h-px bg-neutral-200 dark:bg-[#38383A] ml-4" />
                                )}
                            </div>
                        ))}
                    </div>
                )}
                 {!loading && (!testimonials || testimonials.length === 0) && (
                    <div className="text-center text-[#8A8A8E] dark:text-[#8E8E93] py-16 bg-white dark:bg-[#1C1C1E] rounded-xl mx-4 my-4">
                        <MessageSquare className="mx-auto w-12 h-12 text-[#8A8A8E] dark:text-[#8E8E93] mb-4"/>
                        <p className="font-semibold text-black dark:text-white">{t('testimonials.noTestimonials')}</p>
                        <p className="text-sm mt-1">{t('testimonials.noTestimonialsHint')}</p>
                    </div>
                )}
            </div>
            </div>
        </div>
    );
};

export default Testimonials;
