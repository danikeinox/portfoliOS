import { NextResponse, type NextRequest } from "next/server";
import { getGoogleCalendarClient } from "@/lib/google";
import { applyRateLimit, enforceSameOrigin } from "@/lib/api/security";

export async function GET(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, {
    key: "get-events:get",
    windowMs: 60 * 1000,
    maxRequests: 80,
  });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const sameOriginResponse = enforceSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  try {
    const { calendar, CALENDAR_ID } = getGoogleCalendarClient();

    const response = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin: new Date().toISOString(),
      maxResults: 50,
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = response.data.items?.map((event) => ({
      id: event.id,
      summary: event.summary,
      description: event.description,
      start: event.start,
      end: event.end,
      hangoutLink: event.hangoutLink,
      htmlLink: event.htmlLink,
    }));

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return NextResponse.json(
      {
        code: "GET_EVENTS_ERROR",
        error: "Failed to fetch events from Google Calendar.",
      },
      { status: 500 },
    );
  }
}
