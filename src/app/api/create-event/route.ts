import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getGoogleCalendarClient } from '@/lib/google';

const createEventSchema = z.object({
  summary: z.string().min(1, 'Title is required').max(140, 'Title too long'),
  description: z.string().max(2000, 'Description too long').optional(),
  startDateTime: z.string().datetime(),
  guestEmail: z.string().email('A valid guest email is required.'),
});


export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 415 });
    }

    const { calendar, CALENDAR_ID } = getGoogleCalendarClient();
    const body = await request.json();
    const validation = createEventSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten() }, { status: 400 });
    }

    const { summary, description, startDateTime, guestEmail } = validation.data;
    
    const startDate = new Date(startDateTime);
    const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);

    const event = {
      summary,
      description,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: 'Europe/Madrid',
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'Europe/Madrid',
      },
      attendees: [
        { email: guestEmail }
      ],
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', 'minutes': 24 * 60 },
          { method: 'popup', 'minutes': 10 },
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody: event,
      conferenceDataVersion: 1,
      sendUpdates: 'all',
    });

    return NextResponse.json({ success: true, event: response.data });

  } catch (error: any) {
    console.error('Error creating calendar event:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
