'use client';
import { Code, Smartphone, Cloud, Shield, Bot, type LucideIcon } from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Service {
    icon: LucideIcon;
    iconBg: string;
    titleKey: string;
    descKey: string;
}

const services: Service[] = [
    { icon: Code, iconBg: 'bg-blue-500', titleKey: 'services.webDev.title', descKey: 'services.webDev.desc' },
    { icon: Smartphone, iconBg: 'bg-green-500', titleKey: 'services.mobileDev.title', descKey: 'services.mobileDev.desc' },
    { icon: Cloud, iconBg: 'bg-purple-500', titleKey: 'services.cloud.title', descKey: 'services.cloud.desc' },
    { icon: Shield, iconBg: 'bg-red-500', titleKey: 'services.cybersecurity.title', descKey: 'services.cybersecurity.desc' },
    { icon: Bot, iconBg: 'bg-yellow-500', titleKey: 'services.ai.title', descKey: 'services.ai.desc' },
];

const Services = () => {
    const { t } = useI18n();

    return (
        <ScrollArea className="h-full w-full bg-[#F2F2F7] dark:bg-black text-black dark:text-white">
            <div className="max-w-xl mx-auto py-4">
                <div className="px-4 mb-4">
                    <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">{t('app.services')}</h1>
                    <p className="text-[#8A8A8E] dark:text-[#8E8E93] mt-1">{t('services.subtitle')}</p>
                </div>

                <div className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden mx-4 my-4">
                    {services.map((service) => (
                        <div key={service.titleKey} className="border-b border-neutral-200 dark:border-[#38383A] last:border-none ml-4">
                            <div className="flex items-center gap-4 py-4 pr-4">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${service.iconBg}`}>
                                    <service.icon className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-black dark:text-white">{t(service.titleKey)}</h3>
                                    <p className="text-[#8A8A8E] dark:text-[#8E8E93] text-sm">{t(service.descKey)}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </ScrollArea>
    );
};

export default Services;
