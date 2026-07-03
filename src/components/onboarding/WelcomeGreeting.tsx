'use client';

import { useEffect, useState } from 'react';
import { STARTUP_GREETINGS } from '@/lib/startup-greetings';
import { cn } from '@/lib/utils';

const FADE_MS = 900;
const HOLD_MS = 2200;

function pickRandomIndex(exclude?: number): number {
  if (STARTUP_GREETINGS.length <= 1) return 0;

  let next = Math.floor(Math.random() * STARTUP_GREETINGS.length);
  while (next === exclude) {
    next = Math.floor(Math.random() * STARTUP_GREETINGS.length);
  }
  return next;
}

export default function WelcomeGreeting() {
  const [index, setIndex] = useState(() => pickRandomIndex());
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    const schedule = (fn: () => void, ms: number) => {
      timeouts.push(
        setTimeout(() => {
          if (!cancelled) fn();
        }, ms)
      );
    };

    const runCycle = () => {
      schedule(() => {
        setVisible(false);
        schedule(() => {
          setIndex((current) => pickRandomIndex(current));
          setVisible(true);
          schedule(runCycle, HOLD_MS);
        }, FADE_MS);
      }, HOLD_MS);
    };

    schedule(runCycle, HOLD_MS);

    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
    };
  }, []);

  return (
    <p
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        'mt-20 text-center text-6xl font-semibold lowercase tracking-tight text-white drop-shadow-sm',
        'will-change-[opacity]',
        visible ? 'opacity-100' : 'opacity-0'
      )}
      style={{
        transition: `opacity ${FADE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
      }}
    >
      {STARTUP_GREETINGS[index]}
    </p>
  );
}
