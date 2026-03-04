'use client';
import { useState, useEffect, useRef } from 'react';
import { useI18n } from '@/hooks/use-i18n';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60000);
    const seconds = Math.floor((time % 60000) / 1000);
    const milliseconds = Math.floor((time % 1000) / 10);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(2, '0')}`;
};

const StopwatchTab = () => {
    const { t } = useI18n();
    const [time, setTime] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [laps, setLaps] = useState<number[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const lastLapTimeRef = useRef(0);

    useEffect(() => {
        if (isRunning) {
            const startTime = Date.now() - time;
            timerRef.current = setInterval(() => {
                setTime(Date.now() - startTime);
            }, 10);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isRunning]);

    const handleStartStop = () => {
        setIsRunning(!isRunning);
    };

    const handleLapReset = () => {
        if (isRunning) {
            const lapTime = time - lastLapTimeRef.current;
            setLaps(prev => [lapTime, ...prev]);
            lastLapTimeRef.current = time;
        } else {
            setTime(0);
            setLaps([]);
            lastLapTimeRef.current = 0;
        }
    };

    const getLapStats = () => {
        if (laps.length < 2) return { fastest: null, slowest: null };
        const sortedLaps = [...laps].sort((a, b) => a - b);
        return { fastest: sortedLaps[0], slowest: sortedLaps[sortedLaps.length - 1] };
    };
    
    const { fastest, slowest } = getLapStats();
    const currentLapTime = isRunning || time > 0 ? time - lastLapTimeRef.current : 0;

    return (
        <div className="h-full w-full flex flex-col items-center">
            <div className="w-full flex-grow flex flex-col items-center justify-center">
                <p className="text-8xl font-thin tracking-tighter">{formatTime(time)}</p>
            </div>
            <div className="w-full flex justify-around items-center p-4 mb-4">
                <Button onClick={handleLapReset} className="w-20 h-20 rounded-full bg-neutral-800 text-white text-lg active:bg-neutral-700 disabled:opacity-50 disabled:bg-neutral-800" disabled={!isRunning && time === 0}>{isRunning ? t('clock.stopwatch.lap') : t('clock.stopwatch.reset')}</Button>
                <Button onClick={handleStartStop} className={cn("w-20 h-20 rounded-full text-lg", isRunning ? 'bg-red-900/50 text-red-400 active:bg-red-900/60' : 'bg-green-900/50 text-green-400 active:bg-green-900/60')}>{isRunning ? t('clock.stopwatch.stop') : t('clock.stopwatch.start')}</Button>
            </div>
             <ScrollArea className="w-full h-48 border-t border-neutral-800">
                <div className="px-4 text-lg">
                    {laps.length > 0 && (
                        <div className="flex justify-between py-2 border-b border-neutral-800">
                            <span>{t('clock.stopwatch.lap')} {laps.length + 1}</span>
                            <span>{formatTime(currentLapTime)}</span>
                        </div>
                    )}
                    {laps.map((lap, index) => (
                        <div key={index} className={cn("flex justify-between py-2 border-b border-neutral-800", lap === fastest && "text-green-500", lap === slowest && "text-red-500")}>
                            <span>{t('clock.stopwatch.lap')} {laps.length - index}</span>
                            <span>{formatTime(lap)}</span>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}

export default StopwatchTab;
