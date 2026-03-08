import { NextResponse, type NextRequest } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import {
  applyRateLimit,
  enforceSameOrigin,
  parseJsonBody,
  requireJsonContentType,
} from "@/lib/api/security";

const reportSchema = z.object({
  appName: z.string().min(1).max(120),
  externalUrl: z.string().url().max(2048),
  reason: z.enum(["invalid-url", "load-timeout", "iframe-error", "unknown"]),
  currentPath: z.string().max(512).optional(),
  userAgent: z.string().max(2048).optional(),
  language: z.string().max(32).optional(),
  timezone: z.string().max(64).optional(),
  online: z.boolean().optional(),
  timestamp: z.string().max(64),
});

const resend = new Resend(process.env.RESEND_API_KEY);

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");

function reasonLabel(reason: z.infer<typeof reportSchema>["reason"]): string {
  switch (reason) {
    case "invalid-url":
      return "Invalid external URL";
    case "load-timeout":
      return "Iframe load timeout";
    case "iframe-error":
      return "Iframe onError event";
    default:
      return "Unknown";
  }
}

function generateReportId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `rpt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = await applyRateLimit(request, {
    key: "api:report-app-crash",
    windowMs: 60_000,
    maxRequests: 5,
  });
  if (rateLimitResponse) return rateLimitResponse;

  const originResponse = enforceSameOrigin(request);
  if (originResponse) return originResponse;

  const contentTypeResponse = requireJsonContentType(request);
  if (contentTypeResponse) return contentTypeResponse;

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      {
        code: "SERVICE_UNAVAILABLE",
        error: "Report service is not configured.",
      },
      { status: 503 },
    );
  }

  const body = await parseJsonBody<unknown>(request);
  if ("error" in body) {
    return body.error;
  }

  const parsed = reportSchema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json(
      {
        code: "INVALID_PAYLOAD",
        error: "Invalid crash report payload.",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const report = parsed.data;
  const reportId = generateReportId();
  const destination =
    process.env.APP_CRASH_REPORT_TO || "daniel@danielcabrera.es";

  const safeAppName = escapeHtml(report.appName);
  const safeExternalUrl = escapeHtml(report.externalUrl);
  const safeReason = escapeHtml(reasonLabel(report.reason));
  const safePath = escapeHtml(report.currentPath ?? "n/a");
  const safeAgent = escapeHtml(report.userAgent ?? "n/a");
  const safeLanguage = escapeHtml(report.language ?? "n/a");
  const safeTimezone = escapeHtml(report.timezone ?? "n/a");
  const safeOnline = String(report.online ?? "n/a");
  const safeTimestamp = escapeHtml(report.timestamp);

  try {
    const email = await resend.emails.send({
      from: "Portfolio Crash Reporter <onboarding@resend.dev>",
      to: destination,
      subject: `[portfoliOS] App crash report #${reportId} - ${safeAppName}`,
      html: `
        <h2>App crash report</h2>
        <p><strong>Report ID:</strong> ${reportId}</p>
        <p><strong>App:</strong> ${safeAppName}</p>
        <p><strong>Reason:</strong> ${safeReason}</p>
        <p><strong>Reason code:</strong> ${report.reason}</p>
        <p><strong>External URL:</strong> ${safeExternalUrl}</p>
        <p><strong>Path:</strong> ${safePath}</p>
        <p><strong>User agent:</strong> ${safeAgent}</p>
        <p><strong>Language:</strong> ${safeLanguage}</p>
        <p><strong>Timezone:</strong> ${safeTimezone}</p>
        <p><strong>Online:</strong> ${safeOnline}</p>
        <p><strong>Timestamp (client):</strong> ${safeTimestamp}</p>
      `,
    });

    if (email.error) {
      return NextResponse.json(
        { code: "EMAIL_SEND_FAILED", error: email.error.message },
        { status: 502 },
      );
    }
  } catch (error) {
    console.error("report-app-crash send failed:", error);
    return NextResponse.json(
      { code: "EMAIL_SEND_FAILED", error: "Failed to send crash report." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, reportId }, { status: 200 });
}
