'use client';
import { useState, useEffect } from 'react';
import { useI18n } from '@/hooks/use-i18n';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import EditAlarmView from './EditAlarmView';
import { useSystemState } from '@/hooks/use-system-state';

export interface Alarm {
    id: string;
    time: string; // HH:mm
    label: string;
    repeat: string[];
    sound: string;
    snooze: boolean;
    enabled: boolean;
}

const defaultAlarms: Alarm[] = [
    { id: '1', time: '07:00', label: 'Alarma', repeat: ['weekday'], sound: 'default', snooze: true, enabled: true },
    { id: '2', time: '08:30', label: 'Alarma', repeat: [], sound: 'default', snooze: true, enabled: false },
];

const useAlarms = () => {
    const [alarms, setAlarms] = useState<Alarm[]>([]);

    useEffect(() => {
        const savedAlarms = localStorage.getItem('alarms');
        if (savedAlarms) {
            setAlarms(JSON.parse(savedAlarms));
        } else {
            setAlarms(defaultAlarms);
        }
    }, []);

    useEffect(() => {
        if (alarms.length > 0) {
            localStorage.setItem('alarms', JSON.stringify(alarms));
        }
    }, [alarms]);

    const saveAlarm = (alarmToSave: Alarm) => {
        setAlarms(prev => {
            const existingIndex = prev.findIndex(a => a.id === alarmToSave.id);
            if (existingIndex > -1) {
                const newAlarms = [...prev];
                newAlarms[existingIndex] = alarmToSave;
                return newAlarms.sort((a, b) => a.time.localeCompare(b.time));
            }
            return [...prev, alarmToSave].sort((a, b) => a.time.localeCompare(b.time));
        });
    };

    const deleteAlarm = (alarmId: string) => {
        setAlarms(prev => prev.filter(a => a.id !== alarmId));
    };

    const toggleAlarm = (alarmId: string, enabled: boolean) => {
        setAlarms(prev => prev.map(a => a.id === alarmId ? { ...a, enabled } : a));
    };

    return { alarms, saveAlarm, deleteAlarm, toggleAlarm };
}

const AlarmsTab = () => {
    const { t, locale } = useI18n();
    const { alarms, saveAlarm, deleteAlarm, toggleAlarm } = useAlarms();
    const [editingAlarm, setEditingAlarm] = useState<Alarm | 'new' | null>(null);
    const { hourFormat } = useSystemState();

    const formatTime = (time: string) => {
        if (hourFormat === '12h') {
             return new Date(`1970-01-01T${time}`).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit', hour12: true });
        }
        return time;
    };

    if (editingAlarm) {
        return <EditAlarmView 
                    alarm={editingAlarm === 'new' ? null : editingAlarm} 
                    onSave={(alarm) => {
                        saveAlarm(alarm);
                        setEditingAlarm(null);
                    }}
                    onCancel={() => setEditingAlarm(null)}
                    onDelete={(id) => {
                        deleteAlarm(id);
                        setEditingAlarm(null);
                    }}
               />
    }

    return (
        <div className="h-full w-full flex flex-col">
            <header className="flex justify-between items-center p-4 pb-2">
                <Button variant="ghost" className="text-orange-500 hover:text-orange-500 text-base">{t('clock.alarms.edit')}</Button>
                <h1 className="text-3xl font-bold">{t('clock.alarms.title')}</h1>
                <Button variant="ghost" size="icon" className="text-orange-500 hover:text-orange-500" onClick={() => setEditingAlarm('new')}><Plus size={28} /></Button>
            </header>
            <div className="flex-1 overflow-y-auto px-4">
                {alarms.length > 0 ? (
                    <div className="divide-y divide-neutral-800">
                        {alarms.map(alarm => (
                            <div key={alarm.id} className="flex justify-between items-center py-3">
                                <button onClick={() => setEditingAlarm(alarm)} className="text-left">
                                    <p className={cn("text-5xl font-light", !alarm.enabled && "text-neutral-500")}>
                                        {formatTime(alarm.time)}
                                    </p>
                                    <p className={cn("text-base -mt-1", !alarm.enabled && "text-neutral-500")}>{alarm.label}</p>
                                </button>
                                <Switch 
                                    checked={alarm.enabled} 
                                    onCheckedChange={(checked) => toggleAlarm(alarm.id, checked)}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-neutral-500 pt-24">
                        <p className="font-semibold text-lg">{t('clock.alarms.noAlarms')}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AlarmsTab;
