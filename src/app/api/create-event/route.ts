import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getGoogleCalendarClient } from "@/lib/google";
import {
  applyRateLimit,
  enforceSameOrigin,
  parseJsonBody,
  requireJsonContentType,
} from "@/lib/api/security";

const createEventSchema = z.object({
  summary: z.string().min(1, "Title is required").max(140, "Title too long"),
  description: z.string().max(2000, "Description too long").optional(),
  startDateTime: z.string().datetime(),
  guestEmail: z.string().email("A valid guest email is required."),
});

export async function POST(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, {
    key: "create-event:post",
    windowMs: 10 * 60 * 1000,
    maxRequests: 20,
  });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const sameOriginResponse = enforceSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const contentTypeResponse = requireJsonContentType(request);
  if (contentTypeResponse) {
    return contentTypeResponse;
  }

  try {
    const parsedBody = await parseJsonBody<unknown>(request);
    if ("error" in parsedBody) {
      return parsedBody.error;
    }

    const { calendar, CALENDAR_ID } = getGoogleCalendarClient();
    const validation = createEventSchema.safeParse(parsedBody.data);

    if (!validation.success) {
      return NextResponse.json(
        {
          code: "INVALID_INPUT",
          error: "Invalid input",
          details: validation.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { summary, description, startDateTime, guestEmail } = validation.data;

    const startDate = new Date(startDateTime);
    const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);

    const event = {
      summary,
      description,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: "Europe/Madrid",
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: "Europe/Madrid",
      },
      attendees: [{ email: guestEmail }],
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: {
            type: "hangoutsMeet",
          },
        },
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 },
          { method: "popup", minutes: 10 },
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody: event,
      conferenceDataVersion: 1,
      sendUpdates: "all",
    });

    return NextResponse.json({ success: true, event: response.data });
  } catch (error) {
    console.error("Error creating calendar event:", error);
    return NextResponse.json(
      { code: "CREATE_EVENT_ERROR", error: "Failed to create event" },
      { status: 500 },
    );
  }
}
