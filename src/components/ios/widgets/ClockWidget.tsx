'use client';
import { useState, useEffect } from 'react';
import type { WidgetSize } from '@/hooks/use-home-screen';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const ClockWidget = ({ size = '2x2' }: { size?: WidgetSize }) => {
  // Add milliseconds to state for smooth hand movement
  const [time, setTime] = useState({ hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime({
        hours: now.getHours(),
        minutes: now.getMinutes(),
        seconds: now.getSeconds(),
        milliseconds: now.getMilliseconds(),
      });
    };
    updateClock();
    // Update frequently for smooth animation, respecting the setInterval constraint.
    const timerId = setInterval(updateClock, 50);
    return () => clearInterval(timerId);
  }, []);

  // Calculate smooth rotation for all hands
  const secondDeg = (time.seconds + time.milliseconds / 1000) * 6;
  const minuteDeg = (time.minutes + time.seconds / 60) * 6;
  const hourDeg = ((time.hours % 12) + time.minutes / 60) * 30;

  const isLarge = size === '4x4';

  // Define hand dimensions based on size to avoid repetition
  const handDimensions = {
      hour: isLarge ? 'w-1 h-[25%]' : 'w-0.5 h-[22%]',
      minute: isLarge ? 'w-1 h-[35%]' : 'w-0.5 h-[32%]',
      second: isLarge ? 'w-0.5 h-[38%]' : 'w-px h-[35%]'
  };

  return (
    <Link href="/app/clock" className="w-full h-full block">
      <div className="w-full h-full bg-white/90 dark:bg-neutral-800/90 backdrop-blur-xl rounded-2xl md:rounded-3xl p-3 flex items-center justify-center hover:bg-white/100 dark:hover:bg-neutral-800/100 transition-colors">
        <div className="relative w-full h-full rounded-full bg-gray-50 dark:bg-neutral-900 shadow-inner">
          {/* Markings */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-full h-full"
              style={{ transform: `rotate(${i * 30}deg)` }}
            >
              <div
                className={cn(
                  'absolute left-1/2 -translate-x-1/2',
                  isLarge ? 'h-4 w-1 top-2' : 'h-2 w-0.5 top-1',
                  i % 3 === 0 ? 'bg-black dark:bg-white' : 'bg-gray-400 dark:bg-gray-600'
                )}
              />
            </div>
          ))}

          {/* Hour Hand */}
          <div
            className="absolute top-0 left-0 w-full h-full"
            style={{ transform: `rotate(${hourDeg}deg)` }}
          >
            <div className={cn("absolute bottom-1/2 left-1/2 -translate-x-1/2 bg-black dark:bg-white rounded-t-full", handDimensions.hour)} />
          </div>
          
          {/* Minute Hand */}
          <div
            className="absolute top-0 left-0 w-full h-full"
            style={{ transform: `rotate(${minuteDeg}deg)` }}
          >
            <div className={cn("absolute bottom-1/2 left-1/2 -translate-x-1/2 bg-black dark:bg-white rounded-t-full", handDimensions.minute)} />
          </div>
          
          {/* Second Hand */}
          <div
            className="absolute top-0 left-0 w-full h-full"
            style={{ transform: `rotate(${secondDeg}deg)` }}
          >
            <div className={cn("absolute bottom-1/2 left-1/2 -translate-x-1/2 bg-red-500", handDimensions.second)} />
          </div>

          {/* Center Dot */}
          <div className={cn("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black dark:bg-white", isLarge ? "w-2 h-2" : "w-1.5 h-1.5")} />
          <div className={cn("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500", isLarge ? "w-1 h-1" : "w-0.5 h-0.5")} />
        </div>
      </div>
    </Link>
  );
};

export default ClockWidget;
