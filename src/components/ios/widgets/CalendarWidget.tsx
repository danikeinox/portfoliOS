'use client';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useI18n } from '@/hooks/use-i18n';
import type { WidgetSize } from '@/hooks/use-home-screen';
import { useGoogleCalendar, type CalendarEvent } from '@/hooks/use-google-calendar';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

const CalendarWidget = ({ size = '2x2' }: { size?: WidgetSize }) => {
  const { t, locale } = useI18n();
  const { isLoading, events, error, fetchEvents } = useGoogleCalendar();
  const today = new Date();
  const monthName = today.toLocaleDateString(locale, { month: 'short' }).toUpperCase();
  const dayOfMonth = today.getDate();
  const dayName = today.toLocaleDateString(locale, { weekday: 'long' });

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const todayEvents = events.filter(event => {
      if (!event.start.dateTime && !event.start.date) return false;
      if (!event.end.dateTime && !event.end.date) return false;
      
      const eventStart = new Date(event.start.dateTime || event.start.date!);
      const eventEnd = new Date(event.end.dateTime || event.end.date!);
      
      if (event.start.date) {
          const [s_year, s_month, s_day] = event.start.date.split('-').map(Number);
          eventStart.setFullYear(s_year, s_month - 1, s_day);
          eventStart.setHours(0, 0, 0, 0);

          if (event.end.date) {
              const [e_year, e_month, e_day] = event.end.date.split('-').map(Number);
              eventEnd.setFullYear(e_year, e_month - 1, e_day);
              eventEnd.setHours(0,0,0,0);
              eventEnd.setTime(eventEnd.getTime() - 1);
          }
      }

      const todayStart = new Date(today);
      todayStart.setHours(0, 0, 0, 0);

      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);

      return eventStart <= todayEnd && eventEnd >= todayStart;
  });

  const formatEventTime = (event: CalendarEvent) => {
    if (event.start.dateTime && event.end.dateTime) {
        const start = new Date(event.start.dateTime).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
        const end = new Date(event.end.dateTime).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
        return `${start} - ${end}`;
    }
    return t('calendar.allDay');
  };

  const renderContent = () => {
    if (error) {
        return <p className="text-red-500 text-[10px] p-2">{t(error.message)}</p>;
    }
    if (isLoading && events.length === 0) {
        return <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />;
    }
    if (todayEvents.length === 0) {
        return <p className="text-black text-xs font-semibold p-2 text-center">{t('calendar.noEvents')}</p>;
    }

    if (size === '2x4') {
        return (
            <div className="w-full h-full p-4 text-gray-800 flex flex-col justify-between">
                <div>
                    <p className="font-semibold text-red-500 text-sm">{dayName}</p>
                    <p className="text-4xl font-bold text-black -mt-1">{dayOfMonth}</p>
                </div>
                <div className="space-y-1.5">
                    {todayEvents.slice(0, 2).map(event => (
                        <div key={event.id} className="flex items-start text-sm">
                           <div className="border-l-2 border-blue-500 h-4 mr-2" />
                            <div className="flex-1 overflow-hidden">
                                <p className="font-semibold text-black leading-tight truncate">{event.summary}</p>
                                <p className="text-xs text-gray-600 leading-tight truncate">{formatEventTime(event)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    // Default 2x2
    return (
        <div className="w-full h-full p-2.5 text-gray-800 flex">
            <div className="flex flex-col items-center justify-center pr-1.5 border-r border-gray-400/50">
                <p className="font-semibold text-red-500 text-[10px]">{monthName}</p>
                <p className="text-xl font-bold text-black">{dayOfMonth}</p>
            </div>
            <div className="pl-1.5 flex-1 flex flex-col justify-center overflow-hidden">
                {todayEvents.slice(0,2).map(event => (
                    <div key={event.id} className="flex items-start text-[9px] mb-0.5">
                        <div className="w-1 h-1 rounded-full mr-1 mt-1 bg-blue-500 shrink-0"></div>
                        <div className="truncate">
                            <p className="font-semibold text-black leading-tight truncate">{event.summary}</p>
                            <p className="text-gray-500 -mt-0.5 leading-tight truncate">{formatEventTime(event)}</p>
                        </div>
                    </div>
                ))}
                {todayEvents.length > 2 && <p className="font-semibold text-black text-[9px] mt-1">{t('widget.calendar.more')}</p>}
            </div>
        </div>
    )
  };

  return (
    <Link href="/app/calendar" className="w-full h-full block">
        <div className="w-full h-full bg-white/25 backdrop-blur-xl rounded-2xl md:rounded-3xl flex items-center justify-center hover:bg-white/40 transition-colors">
            {renderContent()}
        </div>
    </Link>
  );
};

export default CalendarWidget;
