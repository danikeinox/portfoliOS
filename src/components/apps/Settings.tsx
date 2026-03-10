'use client';
import Image from 'next/image';
import { useI18n } from '@/hooks/use-i18n';
import { ChevronRight, Wifi, Bluetooth, Settings as SettingsIcon, Globe, Image as ImageIcon, Check, ChevronLeft, Clock, FileText, Shield, BookOpen, Info, SlidersHorizontal } from 'lucide-react';
import { useSystemState } from '@/hooks/use-system-state';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { useState, useEffect, useCallback } from 'react';
import { useWallpaper } from '@/hooks/use-wallpaper';
import { useTheme } from '@/hooks/use-theme';

const IOS_GROUP = 'bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden mx-4 my-4';
const IOS_DIVIDER = 'border-b border-neutral-200 dark:border-[#38383A] last:border-none ml-4';

type View = 'main' | 'general' | 'language' | 'wallpaper' | 'clock' | 'legal-terms' | 'legal-cookies' | 'legal-privacy' | 'legal-tos' | 'cookie-mgmt';
const LEGAL_VIEWS: View[] = ['legal-terms', 'legal-cookies', 'legal-privacy', 'legal-tos', 'cookie-mgmt'];

type ConsentState = {
  necessary: true;
  functional: boolean;
  analytics: boolean;
  termsAccepted: boolean;
  updatedAt: string;
};
const CONSENT_KEY = 'site.consent.v1';
const CONSENT_EVENT = 'site-consent-updated';

function readConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    return raw ? (JSON.parse(raw) as ConsentState) : null;
  } catch { return null; }
}
function persistConsent(state: ConsentState) {
  const encoded = encodeURIComponent(JSON.stringify(state));
  localStorage.setItem(CONSENT_KEY, JSON.stringify(state));
  document.cookie = `site_consent=${encoded}; Max-Age=31536000; Path=/; SameSite=Lax`;
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

// Reusable row components (same as before)
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

// Legal document view
const LegalDocView = ({ lines }: { lines: string[] }) => (
  <div className="mx-4">
    <div className="bg-white dark:bg-[#1C1C1E] rounded-xl p-4 space-y-3">
      {lines.map((line, i) => (
        <p key={i} className="text-sm text-[#3C3C43] dark:text-[#EBEBF5]/70 leading-relaxed">{line}</p>
      ))}
    </div>
  </div>
);

// Cookie management view
const CookieManagementView = () => {
  const { t } = useI18n();
  const [consent, setConsent] = useState<ConsentState | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setConsent(readConsent()); }, []);

  const handleSave = () => {
    if (!consent) return;
    persistConsent({ ...consent, updatedAt: new Date().toISOString() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!consent) return (
    <div className="mx-4 bg-white dark:bg-[#1C1C1E] rounded-xl p-4">
      <p className="text-sm text-[#8A8A8E] dark:text-[#8E8E93]">{t('startup.consent.noData') ?? 'No consent data found. Please complete the onboarding first.'}</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <p className="text-xs text-[#8A8A8E] dark:text-[#8E8E93] uppercase font-semibold px-8 pt-2">{t('settings.general.cookieMgmtDesc')}</p>
      <div className={IOS_GROUP}>
        {/* Necessary */}
        <div className="py-3 px-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-black dark:text-white font-medium">{t('settings.general.necessary')}</span>
            <Switch checked={true} disabled />
          </div>
          <p className="text-xs text-[#8A8A8E] dark:text-[#8E8E93] pr-12">{t('settings.general.necessaryDesc')}</p>
        </div>
        <div className={IOS_DIVIDER} />
        {/* Functional */}
        <div className="py-3 px-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-black dark:text-white font-medium">{t('settings.general.functional')}</span>
            <Switch checked={consent.functional} onCheckedChange={(v) => setConsent(c => c ? { ...c, functional: v } : c)} />
          </div>
          <p className="text-xs text-[#8A8A8E] dark:text-[#8E8E93] pr-12">{t('settings.general.functionalDesc')}</p>
        </div>
        <div className={IOS_DIVIDER} />
        {/* Analytics */}
        <div className="py-3 px-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-black dark:text-white font-medium">{t('settings.general.analytics')}</span>
            <Switch checked={consent.analytics} onCheckedChange={(v) => setConsent(c => c ? { ...c, analytics: v } : c)} />
          </div>
          <p className="text-xs text-[#8A8A8E] dark:text-[#8E8E93] pr-12">{t('settings.general.analyticsDesc')}</p>
        </div>
      </div>
      <div className="mx-4">
        <button
          onClick={handleSave}
          className={cn(
            "w-full py-3 rounded-xl font-semibold text-white transition-colors text-base",
            saved ? "bg-green-500" : "bg-[#0A84FF] active:bg-[#0071E3]"
          )}
        >
          {saved ? t('settings.general.prefsSaved') : t('settings.general.savePrefs')}
        </button>
      </div>
    </div>
  );
};

// General settings — appearance + legal menu
const GeneralSettings = ({ navigate }: { navigate: (v: View) => void }) => {
  const { t } = useI18n();
  const { theme, setTheme } = useTheme();

  const themeOptions: { key: 'light' | 'dark' | 'system', label: string }[] = [
    { key: 'light', label: t('settings.general.light') },
    { key: 'dark', label: t('settings.general.dark') },
    { key: 'system', label: t('settings.general.system') },
  ];

  return (
    <div>
      {/* Appearance */}
      <div className={IOS_GROUP}>
        <p className="text-xs text-[#8A8A8E] dark:text-[#8E8E93] uppercase font-semibold px-4 pt-4 pb-2">{t('settings.general.appearance')}</p>
        <div className="px-2 pb-2 flex gap-2">
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
                <span className="font-semibold text-black dark:text-white text-sm">{option.label}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Legal */}
      <p className="text-xs text-[#8A8A8E] dark:text-[#8E8E93] uppercase font-semibold px-8 mb-1">{t('settings.general.legalSection')}</p>
      <div className={IOS_GROUP}>
        <SettingsRow icon={FileText} iconBgColor="bg-blue-500" title={t('settings.general.termsTitle')} onClick={() => navigate('legal-terms')} />
        <div className={IOS_DIVIDER} />
        <SettingsRow icon={Info} iconBgColor="bg-orange-500" title={t('settings.general.cookiesPolicyTitle')} onClick={() => navigate('legal-cookies')} />
        <div className={IOS_DIVIDER} />
        <SettingsRow icon={Shield} iconBgColor="bg-purple-500" title={t('settings.general.privacyTitle')} onClick={() => navigate('legal-privacy')} />
        <div className={IOS_DIVIDER} />
        <SettingsRow icon={BookOpen} iconBgColor="bg-green-600" title={t('settings.general.tosTitle')} onClick={() => navigate('legal-tos')} />
      </div>

      {/* Cookies */}
      <p className="text-xs text-[#8A8A8E] dark:text-[#8E8E93] uppercase font-semibold px-8 mb-1">{t('settings.general.cookiesSection')}</p>
      <div className={IOS_GROUP}>
        <SettingsRow icon={SlidersHorizontal} iconBgColor="bg-gray-500" title={t('settings.general.cookieMgmtTitle')} onClick={() => navigate('cookie-mgmt')} />
      </div>
    </div>
  );
};

// Main settings menu
const MainSettings = ({ navigate }: { navigate: (v: View) => void }) => {
  const { locale, useSystemLocale, t } = useI18n();
  const { wifiEnabled, setWifiEnabled, bluetoothEnabled, setBluetoothEnabled } = useSystemState();

  const languageValue = useSystemLocale
    ? `${t('settings.lang.system')}: ${locale === 'es' ? t('settings.lang.es') : t('settings.lang.en')}`
    : locale === 'es' ? t('settings.lang.es') : t('settings.lang.en');

  return (
    <div>
      <div className={cn(IOS_GROUP, 'p-4 flex items-center gap-4')}>
        <Image src="https://s6.imgcdn.dev/Yrcy4v.png" width={60} height={60} alt={t('settings.profile.name')} className="rounded-full" data-ai-hint="male portrait" />
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
        <SettingsRow icon={SettingsIcon} iconBgColor="bg-neutral-500" title={t('settings.general.title')} onClick={() => navigate('general')} />
        <div className={IOS_DIVIDER} />
        <SettingsRow icon={Globe} iconBgColor="bg-green-500" title={t('settings.language')} value={languageValue} onClick={() => navigate('language')} />
        <div className={IOS_DIVIDER} />
        <SettingsRow icon={ImageIcon} iconBgColor="bg-purple-500" title={t('settings.wallpaper')} onClick={() => navigate('wallpaper')} />
        <div className={IOS_DIVIDER} />
        <SettingsRow icon={Clock} iconBgColor="bg-orange-500" title={t('app.clock')} onClick={() => navigate('clock')} />
      </div>
    </div>
  );
};

const LanguageSettings = () => {
  const { locale, setLocale, useSystemLocale, setUseSystemLocale, systemLocale, t } = useI18n();
  return (
    <div className="space-y-4">
      <div className={IOS_GROUP}>
        <SettingsToggleRow icon={Globe} iconBgColor="bg-green-500" title={t('settings.lang.useSystem')} checked={useSystemLocale} onCheckedChange={setUseSystemLocale} />
        <div className={IOS_DIVIDER} />
        <div className="py-3 px-4 text-sm text-[#8A8A8E] dark:text-[#8E8E93]">
          {t('settings.lang.detected')}: {systemLocale === 'es' ? t('settings.lang.es') : t('settings.lang.en')}
        </div>
      </div>
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
};

// Main app component
const Settings = () => {
  const { t } = useI18n();
  const [view, setView] = useState<View>('main');

  // Read initial view from URL on mount
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get('v') as View | null;
    if (v) setView(v);
  }, []);

  // Navigate and sync URL
  const navigate = useCallback((v: View) => {
    setView(v);
    const url = new URL(window.location.href);
    if (v === 'main') url.searchParams.delete('v');
    else url.searchParams.set('v', v);
    window.history.replaceState({}, '', url.toString());
  }, []);

  const goBack = useCallback(() => {
    navigate(LEGAL_VIEWS.includes(view) ? 'general' : 'main');
  }, [view, navigate]);

  const titles: Record<View, string> = {
    main: t('settings.title'),
    general: t('settings.general.title'),
    language: t('settings.language'),
    wallpaper: t('settings.wallpaper'),
    clock: t('app.clock'),
    'legal-terms': t('settings.general.termsTitle'),
    'legal-cookies': t('settings.general.cookiesPolicyTitle'),
    'legal-privacy': t('settings.general.privacyTitle'),
    'legal-tos': t('settings.general.tosTitle'),
    'cookie-mgmt': t('settings.general.cookieMgmtTitle'),
  };

  const backLabel = LEGAL_VIEWS.includes(view) ? t('settings.general.title') : t('settings.title');

  const legalLines = (prefix: string, count: number) =>
    Array.from({ length: count }, (_, i) => t(`${prefix}Line${i + 1}`));

  return (
    <div className="w-full min-h-full bg-[#F2F2F7] dark:bg-black text-black dark:text-white pb-12">
      {/* Header */}
      <div className="sticky top-0 bg-[#F2F2F7]/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl border-b border-neutral-200 dark:border-[#38383A] z-10 px-4 pt-4 pb-2">
        {view !== 'main' && (
          <button onClick={goBack} className="text-[#0A84FF] text-lg mb-2 flex items-center -ml-2">
            <ChevronLeft size={28} /> {backLabel}
          </button>
        )}
        <h1 className="text-4xl font-bold text-black dark:text-white px-1">{titles[view]}</h1>
      </div>

      {/* Content */}
      <div className="max-w-xl mx-auto mt-4">
        {view === 'main' && <MainSettings navigate={navigate} />}
        {view === 'general' && <GeneralSettings navigate={navigate} />}
        {view === 'language' && <LanguageSettings />}
        {view === 'wallpaper' && <WallpaperSettings />}
        {view === 'clock' && <ClockSettings />}
        {view === 'legal-terms' && <LegalDocView lines={legalLines('startup.legal.terms', 5)} />}
        {view === 'legal-cookies' && <LegalDocView lines={legalLines('startup.legal.cookies', 5)} />}
        {view === 'legal-privacy' && <LegalDocView lines={legalLines('settings.general.privacy', 7)} />}
        {view === 'legal-tos' && <LegalDocView lines={legalLines('settings.general.tos', 7)} />}
        {view === 'cookie-mgmt' && <CookieManagementView />}
      </div>
    </div>
  );
};

export default Settings;
