'use client';

import { useEffect, useMemo, useState } from 'react';
import Script from 'next/script';

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

    const canTrack = useMemo(() => {
        if (!measurementId || !consent) {
            return false;
        }

        return consent.analytics && consent.termsAccepted;
    }, [measurementId, consent]);

    if (!canTrack || !measurementId) {
        return null;
    }

    return (
        <>
            <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
                strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
                {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${measurementId}', {
            anonymize_ip: true,
            send_page_view: true
          });
        `}
            </Script>
        </>
    );
}
