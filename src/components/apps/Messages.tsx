'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { sendEmail } from '@/app/actions/send-email';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowUp, PlusCircle } from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

const Messages = () => {
  const { toast } = useToast();
  const { t } = useI18n();
  const searchParams = useSearchParams();

  const contactFormSchema = z.object({
    name: z.string().min(2, { message: t('form.validation.name') }),
    email: z.string().email({ message: t('form.validation.email') }),
    message: z.string().min(1, { message: t('form.validation.message') }),
  });

  type ContactFormValues = z.infer<typeof contactFormSchema>;

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { name: '', email: '', message: '' },
  });

  useEffect(() => {
    const prefilledMessage = searchParams.get('message')?.trim();
    if (!prefilledMessage) {
      return;
    }

    form.setValue('message', prefilledMessage, {
      shouldDirty: true,
      shouldTouch: true,
    });
  }, [searchParams, form]);

  const onSubmit = async (data: ContactFormValues) => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('email', data.email);
    formData.append('message', data.message);

    const result = await sendEmail(formData);

    if (result.success) {
      toast({
        title: t('form.messageSent'),
        description: t('form.messageSentDesc'),
      });
      form.reset();
    } else {
      const errorMessage = typeof result.error === 'string' ? result.error : t('form.errorDesc');
      toast({
        variant: 'destructive',
        title: t('form.error'),
        description: errorMessage,
      });
    }
  };

  const isMessageEmpty = !form.watch('message');

  return (
    <div className="w-full min-h-full bg-[#F2F2F7] dark:bg-black text-black dark:text-white flex flex-col">
      <div className="flex-shrink-0 px-4 pt-4">
        <h1 className="text-3xl font-bold mb-2">{t('messages.title')}</h1>
        <p className="text-[#8A8A8E] dark:text-[#8E8E93] mb-8">{t('messages.subtitle')}</p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 justify-end px-4 pb-4">
            <div className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden mb-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                    <FormItem className="p-3 border-b border-neutral-200 dark:border-[#38383A]">
                        <FormControl>
                            <Input placeholder={t('form.namePlaceholder')} {...field} className="bg-transparent border-none text-base h-auto p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-black dark:text-white" />
                        </FormControl>
                        <FormMessage className="pt-1"/>
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                    <FormItem className="p-3">
                        <FormControl>
                      <Input placeholder={t('form.emailPlaceholder')} {...field} className="bg-transparent border-none text-base h-auto p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-black dark:text-white" />
                        </FormControl>
                         <FormMessage className="pt-1"/>
                    </FormItem>
                    )}
                />
            </div>
            
                <div className="mt-auto flex items-end gap-2 p-2 bg-[#F2F2F7]/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl border border-neutral-200 dark:border-[#38383A] rounded-3xl">
                <Button type="button" variant="ghost" size="icon" className="text-neutral-400 hover:text-system-blue flex-shrink-0">
                    <PlusCircle size={28}/>
                </Button>
                <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                    <FormItem className="flex-1">
                        <FormControl>
                        <Textarea
                            placeholder={t('messages.messagePlaceholder')}
                          className="bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 resize-none text-base p-1.5 min-h-[20px] max-h-[100px] text-black dark:text-white"
                            rows={1}
                            onInput={(e) => {
                                const target = e.currentTarget;
                                target.style.height = 'auto';
                                target.style.height = `${target.scrollHeight}px`;
                            }}
                            {...field}
                        />
                        </FormControl>
                    </FormItem>
                    )}
                />
                <Button type="submit" size="icon" className="w-8 h-8 rounded-full bg-system-blue hover:bg-system-blue/90 flex-shrink-0 disabled:bg-neutral-200 dark:disabled:bg-neutral-800" disabled={isMessageEmpty || form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <ArrowUp className="h-5 w-5" />
                )}
                </Button>
            </div>
             <FormMessage className="pt-1 pl-2 text-center text-red-500">{form.formState.errors.message?.message}</FormMessage>
        </form>
      </Form>
    </div>
  );
};

export default Messages;
