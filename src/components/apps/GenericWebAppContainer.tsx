'use client';

import { useEffect, useMemo, useState } from 'react';

type GenericWebAppContainerProps = {
    appName: string;
    externalUrl: string;
};

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

    const normalizedUrl = useMemo(() => externalUrl.trim(), [externalUrl]);
    const canRenderIframe = isHttpUrl(normalizedUrl);

    useEffect(() => {
        if (!canRenderIframe) {
            setHasError(true);
            return;
        }

        setIsLoaded(false);
        setHasError(false);

        const timeoutId = window.setTimeout(() => {
            setHasError(true);
        }, IFRAME_TIMEOUT_MS);

        return () => {
            window.clearTimeout(timeoutId);
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
                    setIsLoaded(true);
                    setHasError(false);
                }}
                onError={() => {
                    setHasError(true);
                }}
            />
        </div>
    );
};

export default GenericWebAppContainer;
