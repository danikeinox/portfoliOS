'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/hooks/use-i18n';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';

type StartupStep = 'welcome' | 'consent' | 'legal';
type LegalDoc = 'terms' | 'cookies';

type ConsentState = {
    necessary: true;
    functional: boolean;
    analytics: boolean;
    termsAccepted: boolean;
    updatedAt: string;
};

const CONSENT_KEY = 'site.consent.v1';
const CONSENT_COOKIE = 'site_consent';
const CONSENT_EVENT = 'site-consent-updated';

function readConsent(): ConsentState | null {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const raw = localStorage.getItem(CONSENT_KEY);
        if (!raw) {
            return null;
        }

        return JSON.parse(raw) as ConsentState;
    } catch {
        return null;
    }
}

function persistConsent(state: ConsentState) {
    const encoded = encodeURIComponent(JSON.stringify(state));
    localStorage.setItem(CONSENT_KEY, JSON.stringify(state));
    document.cookie = `${CONSENT_COOKIE}=${encoded}; Max-Age=31536000; Path=/; SameSite=Lax`;
    window.dispatchEvent(new Event(CONSENT_EVENT));
}

function buildLegalText(locale: 'es' | 'en') {
    if (locale === 'es') {
        return {
            terms: {
                title: 'Terminos y Condiciones',
                content: [
                    'Al usar este portfolio aceptas un uso responsable de la plataforma y sus servicios integrados.',
                    'No esta permitido abusar de formularios, APIs o funcionalidades para causar dano, saturacion o acceso no autorizado.',
                    'El contenido publicado en el portfolio es informativo y puede cambiar sin previo aviso.',
                    'El usuario es responsable de la informacion que envía en formularios de contacto o solicitudes.',
                    'Si no aceptas estos terminos, no continúes navegando la plataforma.',
                ],
            },
            cookies: {
                title: 'Politica de Cookies',
                content: [
                    'Usamos cookies necesarias para mantener funcionamiento basico, idioma, tema y estado de sesion tecnica.',
                    'Las cookies funcionales mejoran experiencia y preferencias visuales, pero no son imprescindibles.',
                    'Las cookies analiticas (Google Analytics) solo se activan si das consentimiento explicito.',
                    'Puedes cambiar tu consentimiento borrando datos locales del navegador y reiniciando la web.',
                    'Nunca activamos cookies no necesarias sin una accion previa de aceptacion o personalizacion.',
                ],
            },
        };
    }

    return {
        terms: {
            title: 'Terms and Conditions',
            content: [
                'By using this portfolio, you agree to responsible use of the platform and integrated services.',
                'Abuse of forms, APIs, or features to cause harm, overload, or unauthorized access is prohibited.',
                'Content published in this portfolio is informational and may change without notice.',
                'Users are responsible for the information they submit in contact or request forms.',
                'If you do not agree with these terms, do not continue using the platform.',
            ],
        },
        cookies: {
            title: 'Cookie Policy',
            content: [
                'We use necessary cookies for core behavior, language, theme, and technical session state.',
                'Functional cookies improve experience and visual preferences but are not strictly required.',
                'Analytics cookies (Google Analytics) are enabled only with explicit consent.',
                'You can change consent by clearing local browser data and restarting the website.',
                'Non-essential cookies are never enabled without explicit accept/customize action.',
            ],
        },
    };
}

export default function StartupExperience({ children }: { children: React.ReactNode }) {
    const { locale } = useI18n();
    const [savedConsent, setSavedConsent] = useState<ConsentState | null>(() => readConsent());
    const [step, setStep] = useState<StartupStep>('welcome');
    const [legalDoc, setLegalDoc] = useState<LegalDoc>('terms');
    const [functional, setFunctional] = useState(true);
    const [analytics, setAnalytics] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);

    const currentLocale = locale === 'en' ? 'en' : 'es';
    const legal = useMemo(() => buildLegalText(currentLocale), [currentLocale]);

    const content = {
        es: {
            welcome: 'welcome',
            getStarted: 'Get Started',
            introTitle: 'Antes de continuar',
            introBody: 'Configura tu privacidad y acepta los terminos para acceder al portfolio.',
            required: 'Necesarias',
            requiredDesc: 'Requeridas para idioma, tema, seguridad y funciones esenciales.',
            functional: 'Funcionales',
            functionalDesc: 'Guardan personalizacion para mejorar experiencia de uso.',
            analytics: 'Analiticas',
            analyticsDesc: 'Nos ayudan a entender trafico y mejorar funcionalidades.',
            alwaysActive: 'Siempre activas',
            openTerms: 'Ver terminos y condiciones',
            openCookies: 'Ver politica de cookies',
            acceptTerms: 'Acepto terminos y condiciones y politica de cookies',
            rejectAll: 'Rechazar no esenciales',
            saveCustom: 'Guardar personalizacion',
            acceptAll: 'Aceptar todo',
            back: 'Atras',
            done: 'Listo',
        },
        en: {
            welcome: 'welcome',
            getStarted: 'Get Started',
            introTitle: 'Before you continue',
            introBody: 'Set your privacy options and accept terms to enter the portfolio.',
            required: 'Necessary',
            requiredDesc: 'Required for language, theme, security, and core features.',
            functional: 'Functional',
            functionalDesc: 'Stores personalization preferences to improve experience.',
            analytics: 'Analytics',
            analyticsDesc: 'Helps us understand traffic and improve features.',
            alwaysActive: 'Always active',
            openTerms: 'View terms and conditions',
            openCookies: 'View cookie policy',
            acceptTerms: 'I accept terms and conditions and cookie policy',
            rejectAll: 'Reject non-essential',
            saveCustom: 'Save customization',
            acceptAll: 'Accept all',
            back: 'Back',
            done: 'Done',
        },
    }[currentLocale];

    const canEnter = !!savedConsent?.termsAccepted;

    const commitConsent = (next: Omit<ConsentState, 'necessary' | 'updatedAt'>) => {
        const payload: ConsentState = {
            necessary: true,
            functional: next.functional,
            analytics: next.analytics,
            termsAccepted: next.termsAccepted,
            updatedAt: new Date().toISOString(),
        };

        persistConsent(payload);
        setSavedConsent(payload);
    };

    if (canEnter) {
        return (
            <>
                <GoogleAnalytics />
                {children}
            </>
        );
    }

    return (
        <div className="relative h-[100dvh] w-full overflow-hidden bg-[#F5F7FB] dark:bg-black text-black dark:text-white">
            <GoogleAnalytics />

            <div className="absolute inset-0">
                <div className="absolute -top-32 -left-20 h-[420px] w-[420px] rounded-full bg-[#C6F5E8] blur-2xl opacity-80" />
                <div className="absolute top-[18%] right-[-80px] h-[380px] w-[380px] rounded-full bg-[#4A86FF] blur-2xl opacity-75" />
                <div className="absolute bottom-[-120px] left-[5%] h-[420px] w-[420px] rounded-full bg-[#83D8FF] blur-2xl opacity-70" />
            </div>

            <div className="relative z-10 h-full w-full flex items-center justify-center p-4">
                <div className="w-full max-w-md h-full max-h-[860px] rounded-[36px] border border-white/50 dark:border-white/10 bg-white/55 dark:bg-[#0C0C0E]/70 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col">
                    {step === 'welcome' && (
                        <div className="h-full flex flex-col justify-between p-6">
                            <div className="pt-4">
                                <p className="text-6xl font-semibold lowercase tracking-tight text-white drop-shadow-sm text-center mt-20">
                                    {content.welcome}
                                </p>
                            </div>
                            <Button
                                className="h-14 rounded-full text-lg font-semibold bg-white/70 hover:bg-white text-black"
                                onClick={() => setStep('consent')}
                            >
                                {content.getStarted}
                            </Button>
                        </div>
                    )}

                    {step === 'consent' && (
                        <div className="h-full flex flex-col p-6 gap-4 overflow-y-auto">
                            <h2 className="text-3xl font-semibold tracking-tight">{content.introTitle}</h2>
                            <p className="text-sm text-[#3A3A3C] dark:text-[#D1D1D6]">{content.introBody}</p>

                            <div className="rounded-2xl bg-[#F2F2F7]/95 dark:bg-[#1C1C1E]/95 p-4 space-y-4 border border-black/5 dark:border-white/10">
                                <div>
                                    <p className="font-semibold">{content.required}</p>
                                    <p className="text-xs text-[#636366] dark:text-[#AEAEB2]">{content.requiredDesc}</p>
                                    <p className="text-xs mt-1 text-[#0A84FF]">{content.alwaysActive}</p>
                                </div>

                                <label className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="font-semibold">{content.functional}</p>
                                        <p className="text-xs text-[#636366] dark:text-[#AEAEB2]">{content.functionalDesc}</p>
                                    </div>
                                    <input type="checkbox" checked={functional} onChange={(e) => setFunctional(e.target.checked)} />
                                </label>

                                <label className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="font-semibold">{content.analytics}</p>
                                        <p className="text-xs text-[#636366] dark:text-[#AEAEB2]">{content.analyticsDesc}</p>
                                    </div>
                                    <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} />
                                </label>
                            </div>

                            <div className="space-y-2 text-sm">
                                <button
                                    type="button"
                                    className="text-[#0A84FF]"
                                    onClick={() => {
                                        setLegalDoc('terms');
                                        setStep('legal');
                                    }}
                                >
                                    {content.openTerms}
                                </button>
                                <button
                                    type="button"
                                    className="text-[#0A84FF] block"
                                    onClick={() => {
                                        setLegalDoc('cookies');
                                        setStep('legal');
                                    }}
                                >
                                    {content.openCookies}
                                </button>
                            </div>

                            <label className="flex items-start gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={termsAccepted}
                                    onChange={(e) => setTermsAccepted(e.target.checked)}
                                    className="mt-1"
                                />
                                <span>{content.acceptTerms}</span>
                            </label>

                            <div className="grid grid-cols-1 gap-2 mt-auto pb-2">
                                <Button
                                    variant="outline"
                                    className="h-11 rounded-full"
                                    onClick={() => commitConsent({ functional: false, analytics: false, termsAccepted })}
                                    disabled={!termsAccepted}
                                >
                                    {content.rejectAll}
                                </Button>
                                <Button
                                    variant="outline"
                                    className="h-11 rounded-full"
                                    onClick={() => commitConsent({ functional, analytics, termsAccepted })}
                                    disabled={!termsAccepted}
                                >
                                    {content.saveCustom}
                                </Button>
                                <Button
                                    className="h-12 rounded-full bg-[#0A84FF] hover:bg-[#0A84FF]/90"
                                    onClick={() => commitConsent({ functional: true, analytics: true, termsAccepted })}
                                    disabled={!termsAccepted}
                                >
                                    {content.acceptAll}
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 'legal' && (
                        <div className="h-full flex flex-col p-6 gap-4 overflow-y-auto">
                            <div className="flex items-center justify-between">
                                <button type="button" className="text-[#0A84FF]" onClick={() => setStep('consent')}>
                                    {content.back}
                                </button>
                                <button type="button" className="text-[#0A84FF]" onClick={() => setStep('consent')}>
                                    {content.done}
                                </button>
                            </div>

                            <h2 className="text-3xl font-semibold tracking-tight">
                                {legal[legalDoc].title}
                            </h2>

                            <div className="rounded-2xl bg-[#F2F2F7]/95 dark:bg-[#1C1C1E]/95 p-4 border border-black/5 dark:border-white/10 space-y-3">
                                {legal[legalDoc].content.map((line) => (
                                    <p key={line} className="text-sm text-[#3A3A3C] dark:text-[#D1D1D6] leading-relaxed">
                                        {line}
                                    </p>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    type="button"
                                    variant={legalDoc === 'terms' ? 'default' : 'outline'}
                                    className="rounded-full"
                                    onClick={() => setLegalDoc('terms')}
                                >
                                    {legal.terms.title}
                                </Button>
                                <Button
                                    type="button"
                                    variant={legalDoc === 'cookies' ? 'default' : 'outline'}
                                    className="rounded-full"
                                    onClick={() => setLegalDoc('cookies')}
                                >
                                    {legal.cookies.title}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
