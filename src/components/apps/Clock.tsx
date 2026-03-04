'use client';
import { useI18n } from '@/hooks/use-i18n';
import { Globe, AlarmClock, Timer, Hourglass } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import WorldClockTab from './clock/WorldClockTab';
import AlarmsTab from './clock/AlarmsTab';
import StopwatchTab from './clock/StopwatchTab';
import TimerTab from './clock/TimerTab';

const Clock = () => {
    const { t } = useI18n();

    const tabs = [
        { value: 'world-clock', label: t('clock.worldClock.title'), icon: Globe },
        { value: 'alarms', label: t('clock.alarms.title'), icon: AlarmClock },
        { value: 'stopwatch', label: t('clock.stopwatch.title'), icon: Hourglass },
        { value: 'timer', label: t('clock.timer.title'), icon: Timer },
    ];
    
    return (
        <Tabs defaultValue="alarms" className="w-full h-full flex flex-col bg-black text-white">
            <TabsContent value="world-clock" className="flex-1 h-full mt-0">
                <WorldClockTab />
            </TabsContent>
            <TabsContent value="alarms" className="flex-1 h-full mt-0">
                <AlarmsTab />
            </TabsContent>
             <TabsContent value="stopwatch" className="flex-1 h-full mt-0">
                <StopwatchTab />
            </TabsContent>
             <TabsContent value="timer" className="flex-1 h-full mt-0">
                 <TimerTab />
            </TabsContent>
            
            <TabsList className="h-20 w-full rounded-none bg-neutral-900/80 backdrop-blur-md border-t border-neutral-800 flex justify-around p-0 pt-1 pb-[env(safe-area-inset-bottom)]">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <TabsTrigger key={tab.value} value={tab.value} className="flex flex-col items-center gap-1 text-neutral-500 data-[state=active]:text-orange-500 h-full w-full rounded-none text-xs p-0 data-[state=active]:bg-transparent focus-visible:bg-neutral-800">
                            <Icon size={24} />
                            {tab.label}
                        </TabsTrigger>
                    );
                })}
            </TabsList>
        </Tabs>
    );
};

export default Clock;
