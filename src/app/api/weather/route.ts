import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { applyRateLimit, enforceSameOrigin } from "@/lib/api/security";

type GeocodingResult = {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
  timezone?: string;
};

const weatherQuerySchema = z
  .object({
    action: z.enum(["forecast", "search"]).default("forecast"),
    q: z.string().trim().min(2).max(100).optional(),
    lang: z.enum(["es", "en"]).default("en"),
    lat: z.coerce.number().min(-90).max(90).default(40.4168),
    lon: z.coerce.number().min(-180).max(180).default(-3.7038),
    timezone: z.string().trim().min(1).max(80).default("auto"),
    name: z.string().trim().min(1).max(80).default("Madrid"),
    country: z.string().trim().max(80).default("Spain"),
    admin1: z.string().trim().max(80).default("Madrid"),
  })
  .superRefine((value, ctx) => {
    if (value.action === "search" && !value.q) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["q"],
        message: "Query is required for search action",
      });
    }
  });

export async function GET(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, {
    key: "weather:get",
    windowMs: 60 * 1000,
    maxRequests: 100,
  });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const sameOriginResponse = enforceSameOrigin(request);
  if (sameOriginResponse) {
    return sameOriginResponse;
  }

  const queryResult = weatherQuerySchema.safeParse({
    action: request.nextUrl.searchParams.get("action") ?? undefined,
    q: request.nextUrl.searchParams.get("q") ?? undefined,
    lang: request.nextUrl.searchParams.get("lang") ?? undefined,
    lat: request.nextUrl.searchParams.get("lat") ?? undefined,
    lon: request.nextUrl.searchParams.get("lon") ?? undefined,
    timezone: request.nextUrl.searchParams.get("timezone") ?? undefined,
    name: request.nextUrl.searchParams.get("name") ?? undefined,
    country: request.nextUrl.searchParams.get("country") ?? undefined,
    admin1: request.nextUrl.searchParams.get("admin1") ?? undefined,
  });

  if (!queryResult.success) {
    return NextResponse.json(
      {
        code: "INVALID_WEATHER_QUERY",
        error: "Invalid weather query params",
        details: queryResult.error.flatten(),
      },
      { status: 400 },
    );
  }

  const { action } = queryResult.data;

  try {
    if (action === "search") {
      const query = queryResult.data.q!;
      const language = queryResult.data.lang;

      const geocodingUrl = new URL(
        "https://geocoding-api.open-meteo.com/v1/search",
      );
      geocodingUrl.searchParams.set("name", query);
      geocodingUrl.searchParams.set("count", "10");
      geocodingUrl.searchParams.set("language", language);
      geocodingUrl.searchParams.set("format", "json");

      const response = await fetch(geocodingUrl.toString(), {
        cache: "no-store",
      });
      if (!response.ok) {
        return NextResponse.json(
          { error: "Unable to search locations" },
          { status: 502 },
        );
      }

      const data = await response.json();
      const results: GeocodingResult[] = Array.isArray(data?.results)
        ? data.results.map((item: any) => ({
            name: item.name,
            latitude: item.latitude,
            longitude: item.longitude,
            country: item.country,
            admin1: item.admin1,
            timezone: item.timezone,
          }))
        : [];

      return NextResponse.json({ results });
    }

    const { lat, lon, timezone, name, country, admin1 } = queryResult.data;

    const forecastUrl = new URL("https://api.open-meteo.com/v1/forecast");
    forecastUrl.searchParams.set("latitude", String(lat));
    forecastUrl.searchParams.set("longitude", String(lon));
    forecastUrl.searchParams.set(
      "current",
      "temperature_2m,weather_code,is_day,apparent_temperature,wind_speed_10m",
    );
    forecastUrl.searchParams.set("hourly", "temperature_2m,weather_code");
    forecastUrl.searchParams.set(
      "daily",
      "weather_code,temperature_2m_max,temperature_2m_min",
    );
    forecastUrl.searchParams.set("timezone", timezone);
    forecastUrl.searchParams.set("forecast_days", "5");

    const response = await fetch(forecastUrl.toString(), { cache: "no-store" });
    if (!response.ok) {
      return NextResponse.json(
        { error: "Unable to fetch forecast" },
        { status: 502 },
      );
    }

    const data = await response.json();

    return NextResponse.json({
      location: {
        name,
        country,
        admin1,
        latitude: lat,
        longitude: lon,
        timezone: data?.timezone ?? timezone,
      },
      current: data?.current,
      hourly: data?.hourly,
      daily: data?.daily,
    });
  } catch (error) {
    console.error("Weather API error:", error);
    return NextResponse.json(
      { code: "WEATHER_ROUTE_ERROR", error: "Unexpected weather error" },
      { status: 500 },
    );
  }
}
