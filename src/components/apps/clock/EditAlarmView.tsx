'use client';
import { useState } from 'react';
import { useI18n } from '@/hooks/use-i18n';
import type { Alarm } from './AlarmsTab';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronRight } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface EditAlarmViewProps {
    alarm: Alarm | null;
    onSave: (alarm: Alarm) => void;
    onCancel: () => void;
    onDelete: (id: string) => void;
}

const EditAlarmView = ({ alarm, onSave, onCancel, onDelete }: EditAlarmViewProps) => {
    const { t } = useI18n();
    const [time, setTime] = useState(alarm?.time || '07:00');
    const [label, setLabel] = useState(alarm?.label || 'Alarma');
    const [snooze, setSnooze] = useState(alarm?.snooze ?? true);
    
    const handleSave = () => {
        onSave({
            id: alarm?.id || Date.now().toString(),
            time,
            label,
            repeat: alarm?.repeat || [],
            sound: alarm?.sound || 'default',
            snooze,
            enabled: alarm?.enabled ?? true,
        });
    };

    return (
        <div className="w-full h-full flex flex-col bg-neutral-900">
             <header className="flex justify-between items-center p-4">
                <Button variant="ghost" onClick={onCancel} className="text-orange-500 hover:text-orange-500">{t('cancel')}</Button>
                <h2 className="font-bold text-lg">{alarm ? t('clock.alarms.edit') : t('clock.alarms.add')} {t('clock.alarms.title')}</h2>
                <Button variant="ghost" onClick={handleSave} className="text-orange-500 hover:text-orange-500 font-bold">{t('clock.alarms.save')}</Button>
            </header>

            <div className="flex-1 overflow-y-auto px-4">
                <div className="bg-neutral-800 rounded-lg p-4 flex justify-center">
                    <input 
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="bg-transparent text-white text-6xl font-thin text-center border-none focus:outline-none"
                    />
                </div>

                 <div className="mt-8 bg-neutral-800 rounded-lg">
                    <div className="flex justify-between items-center p-4 border-b border-neutral-700">
                        <span className="text-lg">{t('clock.alarms.repeat')}</span>
                        <button className="flex items-center text-neutral-400">
                            {t('clock.days.never')} <ChevronRight size={20} />
                        </button>
                    </div>
                     <div className="flex justify-between items-center p-4 border-b border-neutral-700">
                        <label htmlFor="alarm-label" className="text-lg">{t('clock.alarms.label')}</label>
                        <Input
                            id="alarm-label"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            className="bg-transparent border-none text-right text-lg text-neutral-400 focus:ring-0 w-1/2"
                        />
                    </div>
                     <div className="flex justify-between items-center p-4 border-b border-neutral-700">
                        <span className="text-lg">{t('clock.alarms.sound')}</span>
                        <button className="flex items-center text-neutral-400">
                            Radar <ChevronRight size={20} />
                        </button>
                    </div>
                     <div className="flex justify-between items-center p-4">
                        <label htmlFor="snooze-switch" className="text-lg cursor-pointer">{t('clock.alarms.snooze')}</label>
                        <Switch id="snooze-switch" checked={snooze} onCheckedChange={setSnooze} />
                    </div>
                </div>
                
                {alarm && (
                    <div className="mt-8">
                        <Button variant="destructive" onClick={() => onDelete(alarm.id)} className="w-full bg-red-600/20 text-red-500 hover:bg-red-600/30">
                            {t('delete')} {t('clock.alarms.title')}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EditAlarmView;
