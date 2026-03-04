'use server';
import { google } from 'googleapis';

let auth: any;
let calendar: any;

function getGoogleCalendarClient() {
  const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID;
  const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const PRIVATE_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');

  const missingVars: string[] = [];
  if (!CALENDAR_ID) missingVars.push("GOOGLE_CALENDAR_ID");
  if (!SERVICE_ACCOUNT_EMAIL) missingVars.push("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  if (!PRIVATE_KEY) missingVars.push("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY");

  if (missingVars.length > 0) {
    const errorMsg = `Server configuration error: The following environment variables are missing or empty: ${missingVars.join(', ')}. Please check your .env file and restart the server.`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  if (!auth) {
    // Use JWT directly for Domain-Wide Delegation
    auth = new google.auth.JWT({
      email: SERVICE_ACCOUNT_EMAIL,
      key: PRIVATE_KEY,
      scopes: ['https://www.googleapis.com/auth/calendar'],
      subject: CALENDAR_ID, // Act as this user
    });
  }

  if (!calendar) {
    calendar = google.calendar({ version: 'v3', auth });
  }

  return { calendar, CALENDAR_ID };
}

export { getGoogleCalendarClient };
