'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Mail, Linkedin, Github, AtSign, UserPlus } from 'lucide-react';
import aboutData from '@/lib/about.json';

const Contact = () => {
  const handleDownloadVcf = () => {
    const vcf = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      'FN:Daniel Cabrera',
      'N:Cabrera;Daniel;;;',
      'TITLE:Software Engineer',
      'EMAIL;TYPE=INTERNET;TYPE=WORK:daniel@danielcabrera.es',
      'URL:https://danielcabrera.es',
      'URL;TYPE=LinkedIn:https://www.linkedin.com/in/danielcabrera',
      'URL;TYPE=GitHub:https://github.com/K3IN0X',
      'END:VCARD',
    ].join('\n');

    const blob = new Blob([vcf], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'daniel-cabrera.vcf';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ScrollArea className="w-full min-h-full bg-[#F2F2F7] dark:bg-black text-black dark:text-white">
      <div className="max-w-xl mx-auto p-4 pb-24 space-y-5">
        <div className="pt-3 flex flex-col items-center text-center">
          <Image
            src={aboutData.profileImage.url}
            alt="Daniel Cabrera"
            width={104}
            height={104}
            className="rounded-full border-4 border-white dark:border-neutral-800 shadow-sm"
            data-ai-hint={aboutData.profileImage.aiHint}
          />
          <h1 className="text-3xl font-bold mt-3">Daniel Cabrera</h1>
          <p className="text-sm text-[#8A8A8E] dark:text-[#8E8E93]">Software Engineer</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Link href="/app/messages" className="rounded-xl bg-white dark:bg-[#1C1C1E] p-3 flex flex-col items-center gap-2 text-[#0A84FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]">
            <MessageCircle size={22} />
            <span className="text-xs font-medium">Mensaje</span>
          </Link>
          <a href="mailto:daniel@danielcabrera.es" className="rounded-xl bg-white dark:bg-[#1C1C1E] p-3 flex flex-col items-center gap-2 text-[#0A84FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]">
            <Mail size={22} />
            <span className="text-xs font-medium">Mail</span>
          </a>
          <a href="https://www.linkedin.com/in/danielcabrera" target="_blank" rel="noopener noreferrer" className="rounded-xl bg-white dark:bg-[#1C1C1E] p-3 flex flex-col items-center gap-2 text-[#0A84FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]">
            <Linkedin size={22} />
            <span className="text-xs font-medium">LinkedIn</span>
          </a>
        </div>

        <div className="rounded-xl bg-white dark:bg-[#1C1C1E] overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between border-b border-neutral-200 dark:border-[#38383A]">
            <span className="text-sm text-[#8A8A8E] dark:text-[#8E8E93]">Email</span>
            <a href="mailto:daniel@danielcabrera.es" className="text-[#0A84FF] font-medium text-sm">daniel@danielcabrera.es</a>
          </div>
        </div>

        <div className="rounded-xl bg-white dark:bg-[#1C1C1E] overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-200 dark:border-[#38383A]">
            <span className="text-sm text-[#8A8A8E] dark:text-[#8E8E93]">Redes sociales</span>
          </div>
          <a href="https://www.linkedin.com/in/danielcabrera" target="_blank" rel="noopener noreferrer" className="px-4 py-3 flex items-center justify-between border-b border-neutral-200 dark:border-[#38383A] focus-visible:outline-none focus-visible:bg-neutral-50 dark:focus-visible:bg-[#2C2C2E]">
            <span className="flex items-center gap-2"><Linkedin size={16} /> LinkedIn</span>
            <span className="text-[#8A8A8E] dark:text-[#8E8E93]">Abrir</span>
          </a>
          <a href="https://github.com/K3IN0X" target="_blank" rel="noopener noreferrer" className="px-4 py-3 flex items-center justify-between border-b border-neutral-200 dark:border-[#38383A] focus-visible:outline-none focus-visible:bg-neutral-50 dark:focus-visible:bg-[#2C2C2E]">
            <span className="flex items-center gap-2"><Github size={16} /> GitHub</span>
            <span className="text-[#8A8A8E] dark:text-[#8E8E93]">Abrir</span>
          </a>
          <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="px-4 py-3 flex items-center justify-between focus-visible:outline-none focus-visible:bg-neutral-50 dark:focus-visible:bg-[#2C2C2E]">
            <span className="flex items-center gap-2"><AtSign size={16} /> X</span>
            <span className="text-[#8A8A8E] dark:text-[#8E8E93]">Abrir</span>
          </a>
        </div>

        <div className="rounded-xl bg-white dark:bg-[#1C1C1E] p-4">
          <Button type="button" variant="outline" className="w-full rounded-xl" onClick={handleDownloadVcf}>
            <UserPlus className="mr-2 h-4 w-4" /> Añadir a contactos
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
};

export default Contact;
