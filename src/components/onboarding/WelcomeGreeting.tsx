'use client';

import { useEffect, useState } from 'react';
import { STARTUP_GREETINGS } from '@/lib/startup-greetings';
import { cn } from '@/lib/utils';

const FADE_MS = 220;
const HOLD_MS = 780;

export default function WelcomeGreeting() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let fadeTimeout: ReturnType<typeof setTimeout> | undefined;
    const interval = setInterval(() => {
      setVisible(false);
      fadeTimeout = setTimeout(() => {
        setIndex((current) => (current + 1) % STARTUP_GREETINGS.length);
        setVisible(true);
      }, FADE_MS);
    }, HOLD_MS + FADE_MS);

    return () => {
      clearInterval(interval);
      if (fadeTimeout) clearTimeout(fadeTimeout);
    };
  }, []);

  return (
    <p
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        'text-6xl font-semibold lowercase tracking-tight text-white drop-shadow-sm text-center mt-20',
        'transition-opacity duration-200 ease-in-out',
        visible ? 'opacity-100' : 'opacity-0'
      )}
    >
      {STARTUP_GREETINGS[index]}
    </p>
  );
}
