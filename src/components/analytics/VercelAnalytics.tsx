'use client';

/**
 * VercelAnalytics — gated on the same `analytics` consent flag as Google Analytics.
 *
 * - @vercel/analytics: cookie-less page-view tracking (Web Vitals + visitors).
 * - @vercel/speed-insights: Core Web Vitals reporting in the Vercel dashboard.
 *
 * Neither SDK sets cookies, but we still respect the user's analytics consent
 * to stay consistent with the site's privacy policy.
 */

import { useEffect, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

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
  } catch {
    return null;
  }
}

export default function VercelAnalytics() {
  const [consent, setConsent] = useState<ConsentState | null>(null);

  useEffect(() => {
    setConsent(readConsent());

    const onConsentUpdated = () => setConsent(readConsent());
    window.addEventListener(CONSENT_EVENT, onConsentUpdated);
    return () => window.removeEventListener(CONSENT_EVENT, onConsentUpdated);
  }, []);

  const canTrack = Boolean(consent?.analytics && consent?.termsAccepted);

  if (!canTrack) return null;

  return (
    <>
      {/* Cookie-less page-view analytics in the Vercel dashboard */}
      <Analytics />
      {/* Core Web Vitals reporting (LCP, FID, CLS, etc.) */}
      <SpeedInsights />
    </>
  );
}
