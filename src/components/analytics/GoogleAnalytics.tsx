'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

declare global {
    interface Window {
        gtag?: (...args: unknown[]) => void;
    }
}

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

export default function GoogleAnalytics() {
    const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    const [consent, setConsent] = useState<ConsentState | null>(null);

    useEffect(() => {
        setConsent(readConsent());

        const onConsentUpdated = () => {
            setConsent(readConsent());
        };

        window.addEventListener(CONSENT_EVENT, onConsentUpdated);
        return () => window.removeEventListener(CONSENT_EVENT, onConsentUpdated);
    }, []);

    const canTrack = Boolean(consent?.analytics && consent?.termsAccepted);

    useEffect(() => {
        if (!measurementId || typeof window === 'undefined' || typeof window.gtag !== 'function') {
            return;
        }

        window.gtag('consent', 'update', {
            analytics_storage: canTrack ? 'granted' : 'denied',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
        });
    }, [measurementId, canTrack]);

    if (!measurementId) {
        return null;
    }

    return (
        <>
            <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
                strategy="beforeInteractive"
            />
            <Script id="ga-init" strategy="beforeInteractive">
                {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
                    gtag('consent', 'default', {
                        analytics_storage: 'denied',
                        ad_storage: 'denied',
                        ad_user_data: 'denied',
                        ad_personalization: 'denied'
                    });
          gtag('config', '${measurementId}', {
            anonymize_ip: true,
                        send_page_view: true,
                        allow_google_signals: false
          });
        `}
            </Script>
        </>
    );
}
