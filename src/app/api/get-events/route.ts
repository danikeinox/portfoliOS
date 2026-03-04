import { NextResponse } from 'next/server';
import { getGoogleCalendarClient } from '@/lib/google';

export async function GET(request: Request) {
  try {
    const { calendar, CALENDAR_ID } = getGoogleCalendarClient();

    const response = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin: new Date().toISOString(),
      maxResults: 50,
      singleEvents: true,
      orderBy: 'startTime',
    });
    
    const events = response.data.items?.map(event => ({
        id: event.id,
        summary: event.summary,
        description: event.description,
        start: event.start,
        end: event.end,
        hangoutLink: event.hangoutLink,
        htmlLink: event.htmlLink,
    }));

    return NextResponse.json({ events });

  } catch (error: any) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json({ error: 'Failed to fetch events from Google Calendar.' }, { status: 500 });
  }
}
