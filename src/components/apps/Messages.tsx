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
import { Loader2, ArrowUp, PlusCircle, X, Paperclip, Camera } from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const Messages = () => {
  const { toast } = useToast();
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

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
    const attachmentSummary = attachments.length
      ? `\n\n[Adjuntos]\n${attachments.map((file) => `- ${file.name}`).join('\n')}`
      : '';

    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('email', data.email);
    formData.append('message', `${data.message}${attachmentSummary}`);

    const result = await sendEmail(formData);

    if (result.success) {
      toast({
        title: t('form.messageSent'),
        description: t('form.messageSentDesc'),
      });
      form.reset();
      setAttachments([]);
      setShowAttachmentMenu(false);
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

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    setAttachments((current) => [...current, ...Array.from(files)].slice(0, 6));
    setShowAttachmentMenu(false);
  };

  const removeAttachment = (index: number) => {
    setAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    const kb = bytes / 1024;
    if (kb < 1024) {
      return `${kb.toFixed(1)} KB`;
    }

    return `${(kb / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="w-full min-h-full bg-[#F2F2F7] dark:bg-black text-black dark:text-white flex flex-col">
      <div className="sticky top-0 z-10 border-b border-neutral-200 dark:border-[#2C2C2E] bg-white/90 dark:bg-black/80 backdrop-blur-xl px-4 py-3">
        <p className="text-center text-lg font-semibold tracking-tight">Daniel Cabrera</p>
        <p className="text-center text-xs text-[#8A8A8E] dark:text-[#8E8E93]">{t('messages.subtitle')}</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 px-4 pb-4">
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-[#0A84FF] text-white px-4 py-3 ml-auto">
                <p className="text-sm">{form.watch('message') || t('messages.placeholderBubble')}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl overflow-hidden mb-3 border border-neutral-200 dark:border-[#2C2C2E]">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                    <FormItem className="p-3 border-b border-neutral-200 dark:border-[#38383A]">
                  <FormControl>
                            <Input placeholder={t('form.namePlaceholder')} {...field} className="bg-transparent border-none text-sm h-auto p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-black dark:text-white" />
                  </FormControl>
                  <FormMessage className="pt-1" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="p-3">
                  <FormControl>
                      <Input placeholder={t('form.emailPlaceholder')} {...field} className="bg-transparent border-none text-sm h-auto p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-black dark:text-white" />
                  </FormControl>
                  <FormMessage className="pt-1" />
                </FormItem>
              )}
            />
          </div>

            {attachments.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {attachments.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-[#1C1C1E] border border-neutral-200 dark:border-[#2C2C2E] px-3 py-1.5">
                    <Paperclip className="h-3.5 w-3.5 text-[#8A8A8E]" />
                    <span className="text-xs max-w-[120px] truncate">{file.name}</span>
                    <span className="text-[10px] text-[#8A8A8E]">{formatSize(file.size)}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="text-[#8A8A8E] hover:text-[#FF3B30]"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

                <div className="relative mt-auto flex items-end gap-2 p-2 bg-white dark:bg-[#1C1C1E] border border-neutral-200 dark:border-[#38383A] rounded-3xl">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-neutral-400 hover:text-system-blue flex-shrink-0"
                  onClick={() => setShowAttachmentMenu((current) => !current)}
                >
                    <PlusCircle size={28}/>
            </Button>

                {showAttachmentMenu && (
                  <div className="absolute bottom-14 left-2 rounded-2xl border border-neutral-200 dark:border-[#2C2C2E] bg-white dark:bg-[#1C1C1E] shadow-xl p-2 w-48">
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="w-full text-left text-sm px-3 py-2 rounded-xl hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E] flex items-center gap-2"
                    >
                      <Camera className="h-4 w-4" />
                      {t('messages.addImage')}
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full text-left text-sm px-3 py-2 rounded-xl hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E] flex items-center gap-2"
                    >
                      <Paperclip className="h-4 w-4" />
                      {t('messages.addFile')}
                    </button>
                  </div>
                )}

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
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                handleFilesSelected(event.target.files);
                event.currentTarget.value = '';
              }}
            />
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(event) => {
                handleFilesSelected(event.target.files);
                event.currentTarget.value = '';
              }}
            />
          <FormMessage className="pt-1 pl-2 text-center text-red-500">{form.formState.errors.message?.message}</FormMessage>
        </form>
      </Form>
    </div>
  );
};

export default Messages;
