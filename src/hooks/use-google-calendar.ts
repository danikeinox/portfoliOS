'use client';
import React, { useState, useEffect, createContext, useContext, ReactNode, useCallback, useRef } from 'react';
import { useI18n } from '@/hooks/use-i18n';

// Define the shape of a calendar event
export interface CalendarEvent {
    id: string;
    summary: string;
    start: {
        dateTime?: string;
        date?: string;
    };
    end: {
        dateTime?: string;
        date?: string;
    };
    hangoutLink?: string;
    htmlLink: string;
}

// Define the context type
interface GoogleCalendarContextType {
    isLoading: boolean;
    events: CalendarEvent[];
    error: Error | null;
    fetchEvents: (forceRefresh?: boolean) => Promise<void>;
}

const GoogleCalendarContext = createContext<GoogleCalendarContextType | undefined>(undefined);

export const GoogleCalendarProvider = ({ children }: { children: ReactNode }) => {
    const { t } = useI18n();
    const [isLoading, setIsLoading] = useState(false);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [error, setError] = useState<Error | null>(null);
    
    const isFetchingRef = useRef(false);
    const hasEventsRef = useRef(false);

    const fetchEvents = useCallback(async (forceRefresh = false) => {
        if (isFetchingRef.current) return;
        if (!forceRefresh && hasEventsRef.current) return;

        isFetchingRef.current = true;
        setIsLoading(true);
        
        try {
            const response = await fetch('/api/get-events');
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.details || errorData.error || 'Failed to fetch calendar events');
            }
            
            const data = await response.json();
            const fetchedEvents = data.events || [];
            
            setEvents(fetchedEvents);
            hasEventsRef.current = fetchedEvents.length > 0;
            setError(null);
        } catch (err: any) {
            console.error("Error fetching calendar events from API:", err);
            setError(err);
        } finally {
            isFetchingRef.current = false;
            setIsLoading(false);
        }
    }, []);
    
    const value = {
        isLoading,
        events,
        error,
        fetchEvents,
    };

    return React.createElement(GoogleCalendarContext.Provider, { value }, children);
};

export const useGoogleCalendar = () => {
    const context = useContext(GoogleCalendarContext);
    if (context === undefined) {
        throw new Error('useGoogleCalendar must be used within a GoogleCalendarProvider');
    }
    return context;
};
