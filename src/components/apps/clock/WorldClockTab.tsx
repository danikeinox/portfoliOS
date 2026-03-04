'use client';
import { useI18n } from '@/hooks/use-i18n';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useSystemState } from '@/hooks/use-system-state';

interface City {
    name: string;
    timezone: string;
}

const cities: City[] = [
    { name: 'Cupertino', timezone: 'America/Los_Angeles' },
    { name: 'New York', timezone: 'America/New_York' },
    { name: 'London', timezone: 'Europe/London' },
    { name: 'Tokyo', timezone: 'Asia/Tokyo' },
];

const WorldClockTab = () => {
    const { t } = useI18n();
    const { hourFormat } = useSystemState();

    const getCityTime = (timezone: string) => {
        return new Date().toLocaleTimeString('en-US', { timeZone: timezone, hour: 'numeric', minute: 'numeric', hour12: hourFormat === '12h' });
    };

    const getCityDateInfo = (timezone: string) => {
        const now = new Date();
        const cityDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
        const localDate = new Date(now.toLocaleString('en-US', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }));
        
        const dayDiff = cityDate.getDate() - localDate.getDate();
        const hourDiff = (cityDate.getTime() - localDate.getTime()) / (1000 * 60 * 60);

        if (dayDiff === 0) return t('clock.worldClock.today');
        if (dayDiff > 0) return t('clock.worldClock.tomorrow', {hours: Math.round(hourDiff)});
        return t('clock.worldClock.yesterday', {hours: Math.round(hourDiff)});
    };
    
    return (
        <div className="h-full w-full flex flex-col">
            <header className="flex justify-between items-center p-4 pb-2">
                <Button variant="ghost" className="text-orange-500 hover:text-orange-500 text-base">{t('clock.alarms.edit')}</Button>
                <h1 className="text-3xl font-bold">{t('clock.worldClock.title')}</h1>
                <Button variant="ghost" size="icon" className="text-orange-500 hover:text-orange-500"><Plus size={28} /></Button>
            </header>
            <div className="flex-1 overflow-y-auto px-4">
                 <div className="divide-y divide-neutral-800">
                    {cities.map(city => (
                        <div key={city.name} className="flex justify-between items-center py-4">
                            <div>
                                <p className="text-sm text-neutral-400">{getCityDateInfo(city.timezone)}</p>
                                <p className="text-3xl">{city.name}</p>
                            </div>
                            <p className="text-5xl font-light">{getCityTime(city.timezone)}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default WorldClockTab;
