'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type GenericWebAppContainerProps = {
    appName: string;
    externalUrl: string;
};

type ErrorReason = 'invalid-url' | 'load-timeout' | 'iframe-error' | 'unknown';

const IFRAME_TIMEOUT_MS = 12000;

function isHttpUrl(value: string): boolean {
    try {
        const parsed = new URL(value);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

const GenericWebAppContainer = ({ appName, externalUrl }: GenericWebAppContainerProps) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [errorReason, setErrorReason] = useState<ErrorReason>('unknown');
    const [isReporting, setIsReporting] = useState(false);
    const [reportStatus, setReportStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [reportId, setReportId] = useState<string | null>(null);
    const timeoutRef = useRef<number | null>(null);

    const normalizedUrl = useMemo(() => externalUrl.trim(), [externalUrl]);
    const canRenderIframe = isHttpUrl(normalizedUrl);

    const clearLoadTimeout = () => {
        if (timeoutRef.current !== null) {
            window.clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    };

    useEffect(() => {
        if (!canRenderIframe) {
            setErrorReason('invalid-url');
            setHasError(true);
            return;
        }

        setIsLoaded(false);
        setHasError(false);
        setErrorReason('unknown');
        setReportStatus('idle');
        setReportId(null);

        timeoutRef.current = window.setTimeout(() => {
            setErrorReason('load-timeout');
            setHasError(true);
        }, IFRAME_TIMEOUT_MS);

        return () => {
            clearLoadTimeout();
        };
    }, [normalizedUrl, canRenderIframe]);

    const goHome = () => {
        window.location.assign('/');
    };

    const closeApp = () => {
        if (window.history.length > 1) {
            window.history.back();
            return;
        }

        window.location.assign('/');
    };

    const reportCrash = async () => {
        if (isReporting) {
            return;
        }

        setIsReporting(true);
        setReportStatus('idle');
        setReportId(null);

        try {
            const response = await fetch('/api/report-app-crash', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    appName,
                    externalUrl: normalizedUrl,
                    reason: errorReason,
                    currentPath: window.location.pathname,
                    userAgent: navigator.userAgent,
                    language: navigator.language,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    online: navigator.onLine,
                    timestamp: new Date().toISOString(),
                }),
            });

            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }

            const json = (await response.json()) as { reportId?: string };
            if (json.reportId) {
                setReportId(json.reportId);
            }
            setReportStatus('success');
        } catch {
            setReportStatus('error');
        } finally {
            setIsReporting(false);
        }
    };

    if (hasError) {
        return (
            <div className="h-full w-full bg-[#F2F2F7] dark:bg-black text-black dark:text-white flex items-center justify-center p-6">
                <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#1C1C1E] border border-neutral-200 dark:border-[#38383A] p-6 text-center shadow-xl">
                    <p className="text-lg font-semibold">La aplicación ha dejado de funcionar</p>
                    <p className="text-sm text-[#8A8A8E] dark:text-[#8E8E93] mt-2">
                        {appName} no responde o no pudo cargarse correctamente.
                    </p>
                    <div className="mt-5 grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={goHome}
                            className="h-11 rounded-full bg-[#0A84FF] text-white font-semibold"
                        >
                            Inicio
                        </button>
                        <button
                            type="button"
                            onClick={closeApp}
                            className="h-11 rounded-full bg-[#EFEFF4] dark:bg-[#2C2C2E] font-semibold"
                        >
                            Cerrar
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={reportCrash}
                        disabled={isReporting || reportStatus === 'success'}
                        className="mt-2 h-11 w-full rounded-full bg-[#34C759] text-white font-semibold disabled:opacity-60"
                    >
                        {isReporting
                            ? 'Enviando informe...'
                            : reportStatus === 'success'
                                ? 'Informe enviado'
                                : 'Enviar informe de error'}
                    </button>
                    {reportStatus === 'error' && (
                        <p className="text-xs text-[#FF3B30] mt-2">No se pudo enviar el informe. Intenta de nuevo.</p>
                    )}
                    {reportStatus === 'success' && reportId && (
                        <p className="text-xs text-[#34C759] mt-2">Codigo de reporte: {reportId}</p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full relative bg-white dark:bg-black">
            {!isLoaded && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#F2F2F7] dark:bg-black text-[#8A8A8E] dark:text-[#8E8E93] text-sm">
                    Cargando aplicación...
                </div>
            )}
            <iframe
                title={appName}
                src={normalizedUrl}
                className="h-full w-full border-0"
                sandbox="allow-scripts allow-same-origin allow-forms"
                referrerPolicy="strict-origin-when-cross-origin"
                onLoad={() => {
                    clearLoadTimeout();
                    setIsLoaded(true);
                    setHasError(false);
                    setErrorReason('unknown');
                }}
                onError={() => {
                    clearLoadTimeout();
                    setErrorReason('iframe-error');
                    setHasError(true);
                }}
            />
        </div>
    );
};

export default GenericWebAppContainer;
