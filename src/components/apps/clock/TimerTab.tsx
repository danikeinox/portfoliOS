'use client';
import { useState, useEffect, useRef } from 'react';
import { useI18n } from '@/hooks/use-i18n';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

const TimerTab = () => {
    const { t } = useI18n();
    const [timeLeft, setTimeLeft] = useState(0);
    const [duration, setDuration] = useState(300); // 5 minutes
    const [isRunning, setIsRunning] = useState(false);
    const [isPickerVisible, setPickerVisible] = useState(true);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isRunning && timeLeft > 0) {
            const endTime = Date.now() + timeLeft * 1000;
            timerRef.current = setInterval(() => {
                const newTimeLeft = Math.round((endTime - Date.now()) / 1000);
                if (newTimeLeft <= 0) {
                    setTimeLeft(0);
                    setIsRunning(false);
                    // Play sound logic here
                } else {
                    setTimeLeft(newTimeLeft);
                }
            }, 250);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isRunning, timeLeft]);

    const handleStartPause = () => {
        if (isRunning) {
            setIsRunning(false);
        } else {
            if (timeLeft === 0) {
                setTimeLeft(duration);
            }
            setIsRunning(true);
            setPickerVisible(false);
        }
    };

    const handleCancel = () => {
        setIsRunning(false);
        setTimeLeft(0);
        setPickerVisible(true);
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const TimePicker = () => (
         <div className="flex items-center justify-center text-2xl text-neutral-500 h-64">
            {/* A real implementation would use a scrollable picker */}
            <div className="flex flex-col items-center">
                <span>0</span><span>{t('clock.timer.hours')}</span>
            </div>
            <div className="flex flex-col items-center mx-4">
                <span className="text-white text-4xl">5</span><span>{t('clock.timer.minutes')}</span>
            </div>
            <div className="flex flex-col items-center">
                <span>0</span><span>{t('clock.timer.seconds')}</span>
            </div>
        </div>
    );
    
    const TimerDisplay = () => (
        <div className="flex flex-col items-center justify-center h-64">
            <p className="text-8xl font-thin tracking-tighter">{formatTime(timeLeft)}</p>
            <p className="text-2xl text-neutral-400">{formatTime(duration)}</p>
        </div>
    );

    return (
        <div className="h-full w-full flex flex-col items-center">
            <div className="w-full flex-grow flex flex-col items-center justify-center">
                {isPickerVisible ? <TimePicker /> : <TimerDisplay />}
            </div>
            <div className="w-full flex justify-around items-center p-4 mb-4">
                <Button onClick={handleCancel} className="w-20 h-20 rounded-full bg-neutral-800 text-white text-lg active:bg-neutral-700">{t('clock.timer.cancel')}</Button>
                <Button onClick={handleStartPause} className={cn("w-20 h-20 rounded-full text-lg", isRunning ? 'bg-orange-900/50 text-orange-400 active:bg-orange-900/60' : 'bg-green-900/50 text-green-400 active:bg-green-900/60')}>{isRunning ? t('clock.timer.pause') : t('clock.timer.start')}</Button>
            </div>
            <div className="w-full px-4 mb-8">
                <div className="bg-neutral-800 rounded-lg">
                    <button className="flex justify-between items-center p-4 w-full">
                        <span className="text-lg">{t('clock.timer.whenEnds')}</span>
                        <div className="flex items-center text-neutral-400">
                            Radar <ChevronRight size={20} />
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default TimerTab;
