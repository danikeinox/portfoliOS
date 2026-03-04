'use client';
import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Plus, AlertTriangle, Loader2 } from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useGoogleCalendar, type CalendarEvent } from '@/hooks/use-google-calendar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const Calendar = () => {
    const { t, locale } = useI18n();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const { toast } = useToast();
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);

    const eventFormSchema = z.object({
        summary: z.string().min(1, { message: t('form.validation.nameRequired') }),
        description: z.string().optional(),
        guestEmail: z.string().email({ message: t('form.validation.email') }),
        time: z.string({ required_error: t('form.validation.message') }),
    });

    type EventFormValues = z.infer<typeof eventFormSchema>;

    const {
        isLoading,
        events,
        error,
        fetchEvents,
    } = useGoogleCalendar();

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);
    
    const getAvailableSlots = useCallback((date: Date, existingEvents: CalendarEvent[]) => {
        const workingHours = { start: 9.5, end: 16.5 }; // 9:30 to 16:30
        const slotDuration = 30; // minutes
        const slots: string[] = [];
        const today = new Date();
        const isToday = date.getFullYear() === today.getFullYear() &&
                      date.getMonth() === today.getMonth() &&
                      date.getDate() === today.getDate();

        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) return []; // No weekends

        const eventsOnDate = existingEvents.filter(event => {
            const eventStart = new Date(event.start.dateTime || event.start.date);
            const eventEnd = new Date(event.end.dateTime || event.end.date);
            
            if (event.start.date) {
                const [s_year, s_month, s_day] = event.start.date.split('-').map(Number);
                eventStart.setFullYear(s_year, s_month - 1, s_day);
                eventStart.setHours(0, 0, 0, 0);

                if (event.end.date) {
                    const [e_year, e_month, e_day] = event.end.date.split('-').map(Number);
                    eventEnd.setFullYear(e_year, e_month - 1, e_day);
                    eventEnd.setHours(0,0,0,0);
                    // For all-day events, the end date is exclusive, so we don't subtract 1
                } else {
                    // if no end date, it's a single all-day event
                     eventEnd.setTime(eventStart.getTime() + 24 * 60 * 60 * 1000 -1);
                }
            }
            
            const selectedDayStart = new Date(date);
            selectedDayStart.setHours(0, 0, 0, 0);

            const selectedDayEnd = new Date(date);
            selectedDayEnd.setHours(23, 59, 59, 999);

            return eventStart < selectedDayEnd && eventEnd > selectedDayStart;
        });
        
        const hasAllDayEvent = eventsOnDate.some(event => event.start.date);
        if (hasAllDayEvent) {
            return [];
        }

        const busyIntervals = eventsOnDate.map(event => ({
            start: new Date(event.start.dateTime!).getTime(),
            end: new Date(event.end.dateTime!).getTime(),
        }));

        for (let hour = workingHours.start; hour < workingHours.end; hour += slotDuration / 60) {
            const currentSlotStart = new Date(date);
            currentSlotStart.setHours(Math.floor(hour), (hour % 1) * 60, 0, 0);

            // Don't show past slots for today
            if (isToday && currentSlotStart.getTime() < today.getTime()) {
                continue;
            }

            const currentSlotEnd = new Date(currentSlotStart.getTime() + slotDuration * 60 * 1000);

            const isOverlapping = busyIntervals.some(interval =>
                currentSlotStart.getTime() < interval.end && currentSlotEnd.getTime() > interval.start
            );

            if (!isOverlapping) {
                slots.push(`${String(currentSlotStart.getHours()).padStart(2, '0')}:${String(currentSlotStart.getMinutes()).padStart(2, '0')}`);
            }
        }
        return slots;
    }, []);

    const form = useForm<EventFormValues>({
        resolver: zodResolver(eventFormSchema),
        defaultValues: {
          summary: '',
          description: '',
          guestEmail: '',
          time: '',
        },
    });

    useEffect(() => {
        if (!isLoading) {
            const slots = getAvailableSlots(selectedDate, events);
            setAvailableSlots(slots);
            if (form.getValues('time') && !slots.includes(form.getValues('time'))) {
                 form.resetField('time');
            }
        }
    }, [selectedDate, events, isLoading, getAvailableSlots, form]);


    const handleCreateEvent = async (values: EventFormValues) => {
        const { time, ...rest } = values;
        
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const startDateTime = new Date(`${year}-${month}-${day}T${time}:00`);

        try {
          const response = await fetch('/api/create-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...rest,
              startDateTime: startDateTime.toISOString(),
            }),
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.details || result.error || 'Failed to create event');
          }

          toast({
            title: t('calendar.eventCreated.title'),
            description: t('calendar.eventCreated.description'),
            duration: 10000,
            action: (
              <ToastAction altText={t('calendar.eventCreated.action')} asChild>
                <a href={result.event.htmlLink} target="_blank" rel="noopener noreferrer">
                  {t('calendar.eventCreated.action')}
                </a>
              </ToastAction>
            ),
          });

          setCreateModalOpen(false);
          form.reset();
          fetchEvents(true);
        } catch (err: any) {
          toast({
            variant: 'destructive',
            title: t('form.error'),
            description: err.message,
          });
        }
    };
    
    const monthName = currentDate.toLocaleString(locale, { month: 'long' });
    const year = currentDate.getFullYear();

    const changeMonth = (amount: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + amount);
            return newDate;
        });
    };

    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();

    let startDayOfWeek = firstDayOfMonth.getDay();
    if (locale.startsWith('es')) {
        startDayOfWeek = (startDayOfWeek === 0) ? 6 : startDayOfWeek - 1;
    }

    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const emptyDays = Array.from({ length: startDayOfWeek });

    const isSameDay = (d1: Date, d2: Date) =>
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();

    const today = new Date();

    const getEventsForDate = (date: Date) => {
        return events.filter(event => {
            const eventStart = new Date(event.start.dateTime || event.start.date);
            const eventEnd = new Date(event.end.dateTime || event.end.date);
            
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

            const selectedDayStart = new Date(date);
            selectedDayStart.setHours(0, 0, 0, 0);

            const selectedDayEnd = new Date(date);
            selectedDayEnd.setHours(23, 59, 59, 999);

            return eventStart <= selectedDayEnd && eventEnd >= selectedDayStart;
        });
    };

    const selectedDayEvents = getEventsForDate(selectedDate);
    
    const weekDays = locale.startsWith('es')
      ? ['L', 'M', 'X', 'J', 'V', 'S', 'D']
      : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    const formatEventTime = (event: CalendarEvent) => {
        if (event.start.dateTime && event.end.dateTime) {
            const start = new Date(event.start.dateTime).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
            const end = new Date(event.end.dateTime).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
            return `${start} - ${end}`;
        }
        return t('calendar.allDay');
    };

    if (isLoading && events.length === 0) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-white text-black">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-500" />
                <p className="mt-2 text-neutral-600">{t('calendar.loading')}</p>
            </div>
        );
    }
    
    return (
        <div className="w-full h-full flex flex-col bg-white text-black">
            {/* Header */}
            <div className="flex justify-between items-center px-4 pt-2 pb-4">
                <div className="flex items-center gap-1 text-neutral-800">
                    <h1 className="text-3xl font-bold tracking-tight">{monthName}</h1>
                    <span className="text-3xl font-light text-neutral-400">{year}</span>
                </div>
                <div className="flex items-center text-red-500">
                    <Button variant="ghost" size="icon" onClick={() => changeMonth(-1)} className="text-red-500 hover:text-red-500"><ChevronLeft size={28} /></Button>
                    <Button variant="ghost" size="icon" onClick={() => changeMonth(1)} className="text-red-500 hover:text-red-500"><ChevronRight size={28} /></Button>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-500" onClick={() => setCreateModalOpen(true)}><Plus size={28} /></Button>
                </div>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 text-center text-xs text-neutral-500 pb-2 px-2 border-b border-neutral-200">
                {weekDays.map((day, index) => <div key={`${day}-${index}`}>{day}</div>)}
            </div>
            
            {/* Calendar Grid & Events */}
            <div className="flex-1 flex flex-col min-h-0">
                <div className="px-2 pt-2">
                    <div className="grid grid-cols-7 text-center text-sm">
                        {emptyDays.map((_, i) => <div key={`empty-${i}`}></div>)}
                        {days.map(day => {
                            const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                            const isToday = isSameDay(dayDate, today);
                            const isSelected = isSameDay(dayDate, selectedDate);
                            const hasEvents = getEventsForDate(dayDate).length > 0;
                            return (
                                <div key={day} className="py-2 flex justify-center items-center relative">
                                    <button 
                                        onClick={() => setSelectedDate(dayDate)}
                                        className={cn(
                                        'w-8 h-8 rounded-full flex items-center justify-center transition-colors font-medium',
                                        isSelected ? 'bg-red-500 text-white' : 'hover:bg-neutral-100',
                                        isToday && !isSelected && 'bg-red-100 text-red-600',
                                        !isToday && !isSelected && 'text-neutral-700'
                                    )}>
                                        {day}
                                    </button>
                                     {hasEvents && !isSelected && <div className="absolute bottom-1 w-1 h-1 bg-red-500 rounded-full" />}
                                </div>
                            );
                        })}
                    </div>
                </div>
                
                 {/* Events List */}
                <div className="flex-1 overflow-y-auto mt-4 border-t border-neutral-200">
                    <div className="p-4">
                        <h2 className="font-semibold text-neutral-800 mb-2">{selectedDate.toLocaleDateString(locale, { weekday: 'long', day: 'numeric' })}</h2>
                        {isLoading && <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />}
                        {error && !isLoading && (
                            <Alert variant="destructive">
                                <AlertTriangle />
                                <AlertTitle>{t('calendar.error.title')}</AlertTitle>
                                <AlertDescription>{t(error.message)}</AlertDescription>
                            </Alert>
                        )}
                        {!isLoading && !error && selectedDayEvents.length > 0 ? (
                            <div className="space-y-3">
                                {selectedDayEvents.map((event) => (
                                    <div key={event.id} className="flex items-start gap-3">
                                        <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-blue-500" />
                                        <div className="flex flex-col">
                                            <p className="font-semibold leading-tight text-sm">{event.summary}</p>
                                            <p className="text-xs text-neutral-500">{formatEventTime(event)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                           !isLoading && !error && <p className="text-neutral-500 text-sm">{t('calendar.noEvents')}</p>
                        )}
                    </div>
                </div>

                <div className="flex-shrink-0 border-t border-neutral-200 p-2 flex justify-center items-center">
                     <Button variant="ghost" onClick={() => setSelectedDate(today)} className="text-red-500 hover:text-red-500 font-semibold text-base">
                        {t('calendar.today')}
                    </Button>
                </div>
            </div>
            <Dialog open={isCreateModalOpen} onOpenChange={setCreateModalOpen}>
                <DialogContent className="bg-white text-black max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{t('calendar.createEvent.title')}</DialogTitle>
                        <DialogDescription>{t('calendar.createEvent.description')}</DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleCreateEvent)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="summary"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('calendar.createEvent.summaryPlaceholder')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t('calendar.createEvent.summaryPlaceholder')} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="guestEmail"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('form.email')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t('form.emailPlaceholder')} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('calendar.createEvent.descriptionPlaceholder')}</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder={t('calendar.createEvent.descriptionPlaceholder')} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                           <FormField
                                control={form.control}
                                name="time"
                                render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <FormLabel>{t('calendar.createEvent.time')} - {selectedDate.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}</FormLabel>
                                    <FormControl>
                                        <RadioGroup
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            className="grid grid-cols-4 gap-2"
                                        >
                                            <ScrollArea className="h-40 col-span-4">
                                                {availableSlots.length > 0 ? availableSlots.map(slot => (
                                                    <FormItem key={slot} className="flex items-center space-x-3 space-y-0 mb-2">
                                                        <FormControl>
                                                            <RadioGroupItem value={slot} />
                                                        </FormControl>
                                                        <FormLabel className="font-normal">{slot}</FormLabel>
                                                    </FormItem>
                                                )) : <p className="text-sm text-neutral-500">{t('calendar.noSlots')}</p>}
                                            </ScrollArea>
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="button" variant="ghost" onClick={() => setCreateModalOpen(false)}>{t('cancel')}</Button>
                                <Button type="submit" disabled={form.formState.isSubmitting}>
                                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {t('calendar.createEvent.submit')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Calendar;
