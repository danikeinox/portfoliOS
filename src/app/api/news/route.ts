import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { applyRateLimit, enforceSameOrigin } from "@/lib/api/security";

const newsQuerySchema = z.object({
  locale: z.enum(["es", "en"]).default("en"),
});

export async function GET(request: NextRequest) {
  const rateLimitResponse = await applyRateLimit(request, {
    key: "news:get",
    windowMs: 60 * 1000,
    maxRequests: 60,
  });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const sameOriginResponse = enforceSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const apiKey = process.env.NEWS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        code: "MISSING_NEWS_API_KEY",
        error: "Missing NEWS_API_KEY environment variable",
      },
      { status: 500 },
    );
  }

  const queryResult = newsQuerySchema.safeParse({
    locale: request.nextUrl.searchParams.get("locale") ?? undefined,
  });

  if (!queryResult.success) {
    return NextResponse.json(
      {
        code: "INVALID_NEWS_QUERY",
        error: "Invalid query params",
        details: queryResult.error.flatten(),
      },
      { status: 400 },
    );
  }

  const locale = queryResult.data.locale === "es" ? "es" : "us,gb";
  const url = `https://api.thenewsapi.com/v1/news/top?api_token=${apiKey}&locale=${locale}&limit=10`;

  try {
    const response = await fetch(url, { next: { revalidate: 3600 } });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message =
        typeof payload?.meta?.message === "string"
          ? payload.meta.message
          : typeof payload?.message === "string"
            ? payload.message
            : "Failed to fetch news";

      return NextResponse.json(
        { code: "NEWS_API_ERROR", error: message },
        { status: response.status },
      );
    }

    return NextResponse.json({
      data: Array.isArray(payload?.data) ? payload.data : [],
    });
  } catch (error) {
    console.error("News API route error:", error);
    return NextResponse.json(
      { code: "NEWS_ROUTE_ERROR", error: "Unexpected news service error" },
      { status: 500 },
    );
  }
}
