'use client';
import { Wrench } from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';

interface UnderDevelopmentProps {
    appTitle?: string;
}

const UnderDevelopment = ({ appTitle = "App" }: UnderDevelopmentProps) => {
    const { t } = useI18n();
    return (
        <div className="w-full h-full flex flex-col items-center justify-center text-center text-black dark:text-white bg-white dark:bg-black">
            <Wrench className="w-16 h-16 text-neutral-400 dark:text-neutral-500 mb-4" />
            <h1 className="text-2xl font-bold">{appTitle}</h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-2">{t('underDev.subtitle')}</p>
            <p className="text-sm text-neutral-500 mt-1">{t('underDev.cta')}</p>
        </div>
    );
};

export default UnderDevelopment;
