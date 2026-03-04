'use client';
import Image from 'next/image';
import { useI18n } from '@/hooks/use-i18n';
import { ChevronRight, Wifi, Bluetooth, Settings as SettingsIcon, Globe, Image as ImageIcon, Check, ChevronLeft, Clock } from 'lucide-react';
import { useSystemState } from '@/hooks/use-system-state';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { useState } from 'react';
import { useWallpaper } from '@/hooks/use-wallpaper';
import { useTheme } from '@/hooks/use-theme';

const IOS_GROUP = 'bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden mx-4 my-4';
const IOS_DIVIDER = 'border-b border-neutral-200 dark:border-[#38383A] last:border-none ml-4';

// --- Reusable Row Components ---
const SettingsRow = ({ icon: Icon, iconBgColor, title, value, onClick }: { icon: React.ElementType, iconBgColor: string, title: string, value?: string, onClick?: () => void }) => (
    <button onClick={onClick} className="w-full flex items-center gap-4 py-3 px-4 text-black dark:text-white text-base disabled:opacity-70" disabled={!onClick}>
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", iconBgColor)}>
            <Icon className="w-5 h-5" />
        </div>
        <span className="flex-1 text-left">{title}</span>
        {value && <span className="text-[#8A8A8E] dark:text-[#8E8E93]">{value}</span>}
        {onClick && <ChevronRight size={20} className="text-[#8A8A8E] dark:text-[#8E8E93]" />}
    </button>
);

const SettingsToggleRow = ({ icon: Icon, iconBgColor, title, checked, onCheckedChange }: { icon: React.ElementType, iconBgColor: string, title: string, checked: boolean, onCheckedChange: (checked: boolean) => void }) => (
    <div className="w-full flex items-center gap-4 py-2 px-4 text-black dark:text-white text-base">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", iconBgColor)}>
            <Icon className="w-5 h-5" />
        </div>
        <label htmlFor={`switch-${title}`} className="flex-1 text-left cursor-pointer">{title}</label>
        <Switch id={`switch-${title}`} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
);


// --- Sub-Views ---
const GeneralSettings = () => {
    const { t } = useI18n();
    const { theme, setTheme } = useTheme();

    const themeOptions: { key: 'light' | 'dark' | 'system', label: string }[] = [
        { key: 'light', label: t('settings.general.light') },
        { key: 'dark', label: t('settings.general.dark') },
        { key: 'system', label: t('settings.general.system') },
    ];
    
    return (
        <div>
            <div className={IOS_GROUP}>
                <p className="text-xs text-[#8A8A8E] dark:text-[#8E8E93] uppercase font-semibold px-4 pt-4">{t('settings.general.appearance')}</p>
                <div className="p-2 flex gap-2">
                    {themeOptions.map(option => (
                        <div key={option.key} className="flex-1">
                            <button 
                                onClick={() => setTheme(option.key)}
                                className={cn(
                                    "w-full rounded-lg border-2 p-4 text-center transition-colors",
                                    theme === option.key
                                        ? "border-[#0A84FF] bg-[#0A84FF]/10"
                                        : "border-transparent bg-[#F2F2F7] dark:bg-[#2C2C2E]"
                                )}
                            >
                                <span className="font-semibold text-black dark:text-white">{option.label}</span>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const MainSettings = ({ setView }: { setView: (view: string) => void }) => {
    const { locale, t } = useI18n();
    const { wifiEnabled, setWifiEnabled, bluetoothEnabled, setBluetoothEnabled } = useSystemState();

    return (
        <div>
            <div className={cn(IOS_GROUP, 'p-4 flex items-center gap-4')}>
                <Image src="https://picsum.photos/seed/profile/80/80" width={60} height={60} alt={t('settings.profile.name')} className="rounded-full" data-ai-hint="male portrait" />
                <div>
                    <h2 className="font-semibold text-xl text-black dark:text-white">{t('settings.profile.name')}</h2>
                    <p className="text-sm text-[#8A8A8E] dark:text-[#8E8E93]">{t('settings.profile.subtitle')}</p>
                </div>
            </div>

            <div className={IOS_GROUP}>
                <SettingsToggleRow icon={Wifi} iconBgColor="bg-blue-500" title={t('settings.wifi')} checked={wifiEnabled} onCheckedChange={setWifiEnabled} />
                <div className={IOS_DIVIDER} />
                <SettingsToggleRow icon={Bluetooth} iconBgColor="bg-blue-500" title={t('settings.bluetooth')} checked={bluetoothEnabled} onCheckedChange={setBluetoothEnabled} />
            </div>

            <div className={IOS_GROUP}>
                <SettingsRow icon={SettingsIcon} iconBgColor="bg-neutral-500" title={t('settings.general.title')} onClick={() => setView('general')} />
                <div className={IOS_DIVIDER} />
                <SettingsRow icon={Globe} iconBgColor="bg-green-500" title={t('settings.language')} value={locale === 'es' ? t('settings.lang.es') : t('settings.lang.en')} onClick={() => setView('language')} />
                <div className={IOS_DIVIDER} />
                <SettingsRow icon={ImageIcon} iconBgColor="bg-purple-500" title={t('settings.wallpaper')} onClick={() => setView('wallpaper')} />
                 <div className={IOS_DIVIDER} />
                <SettingsRow icon={Clock} iconBgColor="bg-orange-500" title={t('app.clock')} onClick={() => setView('clock')} />
            </div>
        </div>
    );
};

const LanguageSettings = () => {
    const { locale, setLocale, t } = useI18n();
    return (
         <div className={IOS_GROUP}>
            <button onClick={() => setLocale('en')} className="w-full flex items-center justify-between py-3 px-4 text-black dark:text-white text-base">
                <span>{t('settings.lang.en')}</span>
                {locale === 'en' && <Check size={20} className="text-[#0A84FF]" />}
            </button>
            <div className={IOS_DIVIDER} />
             <button onClick={() => setLocale('es')} className="w-full flex items-center justify-between py-3 px-4 text-black dark:text-white text-base">
                <span>{t('settings.lang.es')}</span>
                {locale === 'es' && <Check size={20} className="text-[#0A84FF]" />}
            </button>
        </div>
    );
};

const ClockSettings = () => {
    const { t } = useI18n();
    const { hourFormat, setHourFormat } = useSystemState();
    
    return (
         <div className={IOS_GROUP}>
            <div className="p-4">
                <div className="flex items-center justify-between">
                    <label htmlFor="time-format-switch" className="text-black dark:text-white">{t('settings.clock.timeFormat24')}</label>
                    <Switch id="time-format-switch" checked={hourFormat === '24h'} onCheckedChange={(checked) => setHourFormat(checked ? '24h' : '12h')} />
                </div>
            </div>
        </div>
    );
};

const WallpaperSettings = () => {
    const { wallpapers, activeWallpaper, setActiveWallpaper } = useWallpaper();
    return (
        <div className={cn(IOS_GROUP, 'p-4')}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {wallpapers.map(url => (
                    <div key={url} className="relative aspect-[9/19.5] rounded-xl overflow-hidden cursor-pointer group ring-2 ring-transparent hover:ring-[#0A84FF] transition-all" onClick={() => setActiveWallpaper(url)}>
                        <Image src={url} alt="Wallpaper" fill sizes="(min-width: 1024px) 20vw, (min-width: 640px) 30vw, 50vw" className="object-cover" />
                        {activeWallpaper === url && (
                             <div className="absolute inset-0 bg-black/40 flex items-center justify-center ring-4 ring-inset ring-[#0A84FF] rounded-xl">
                                <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center backdrop-blur-sm">
                                    <Check size={20} className="text-[#0A84FF]" />
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- Main App Component with View Routing ---
const Settings = () => {
    const { t } = useI18n();
    const [view, setView] = useState('main'); // 'main', 'general', 'language', 'wallpaper', 'clock'

    const titles: { [key: string]: string } = {
        main: t('settings.title'),
        general: t('settings.general.title'),
        language: t('settings.language'),
        wallpaper: t('settings.wallpaper'),
        clock: t('app.clock'),
    };
    
    return (
        <div className="w-full min-h-full bg-[#F2F2F7] dark:bg-black text-black dark:text-white pb-12">
            {/* Header */}
            <div className="sticky top-0 bg-[#F2F2F7]/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl border-b border-neutral-200 dark:border-[#38383A] z-10 px-4 pt-4 pb-2">
                {view !== 'main' && (
                     <button onClick={() => setView('main')} className="text-[#0A84FF] text-lg mb-2 flex items-center -ml-2">
                        <ChevronLeft size={28} /> {t('settings.title')}
                     </button>
                )}
                <h1 className="text-4xl font-bold text-black dark:text-white px-1">{titles[view]}</h1>
            </div>
            
            {/* Content */}
             <div className="max-w-xl mx-auto mt-4">
                {view === 'main' && <MainSettings setView={setView} />}
                {view === 'general' && <GeneralSettings />}
                {view === 'language' && <LanguageSettings />}
                {view === 'wallpaper' && <WallpaperSettings />}
                {view === 'clock' && <ClockSettings />}
            </div>
        </div>
    );
};

export default Settings;
