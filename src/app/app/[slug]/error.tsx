'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AppSlugError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('Unhandled app route error:', error);
  }, [error]);

  return (
    <div className="h-full w-full bg-neutral-100 dark:bg-neutral-950 text-black dark:text-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white/90 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 shadow-xl p-5 text-center">
        <p className="text-lg font-semibold">La aplicación se cerró inesperadamente</p>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
          Ocurrió un error al abrir esta app.
        </p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="px-4 py-2 rounded-lg bg-neutral-800 text-white text-sm font-medium"
            aria-label="Reintentar apertura de la aplicación"
          >
            Reintentar
          </button>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-sm font-medium"
            aria-label="Volver a la pantalla de inicio"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}
