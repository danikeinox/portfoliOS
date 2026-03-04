import { NextResponse, type NextRequest } from 'next/server';

type GeocodingResult = {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
  timezone?: string;
};

export async function GET(request: NextRequest) {
  const action = request.nextUrl.searchParams.get('action') ?? 'forecast';

  try {
    if (action === 'search') {
      const query = request.nextUrl.searchParams.get('q')?.trim();
      const language = request.nextUrl.searchParams.get('lang') ?? 'en';

      if (!query || query.length < 2) {
        return NextResponse.json({ results: [] });
      }

      const geocodingUrl = new URL('https://geocoding-api.open-meteo.com/v1/search');
      geocodingUrl.searchParams.set('name', query);
      geocodingUrl.searchParams.set('count', '10');
      geocodingUrl.searchParams.set('language', language);
      geocodingUrl.searchParams.set('format', 'json');

      const response = await fetch(geocodingUrl.toString(), { cache: 'no-store' });
      if (!response.ok) {
        return NextResponse.json({ error: 'Unable to search locations' }, { status: 502 });
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

    const lat = Number(request.nextUrl.searchParams.get('lat') ?? 40.4168);
    const lon = Number(request.nextUrl.searchParams.get('lon') ?? -3.7038);
    const timezone = request.nextUrl.searchParams.get('timezone') ?? 'auto';
    const name = request.nextUrl.searchParams.get('name') ?? 'Madrid';
    const country = request.nextUrl.searchParams.get('country') ?? 'Spain';
    const admin1 = request.nextUrl.searchParams.get('admin1') ?? 'Madrid';

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
    }

    const forecastUrl = new URL('https://api.open-meteo.com/v1/forecast');
    forecastUrl.searchParams.set('latitude', String(lat));
    forecastUrl.searchParams.set('longitude', String(lon));
    forecastUrl.searchParams.set('current', 'temperature_2m,weather_code,is_day,apparent_temperature,wind_speed_10m');
    forecastUrl.searchParams.set('hourly', 'temperature_2m,weather_code');
    forecastUrl.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min');
    forecastUrl.searchParams.set('timezone', timezone);
    forecastUrl.searchParams.set('forecast_days', '5');

    const response = await fetch(forecastUrl.toString(), { cache: 'no-store' });
    if (!response.ok) {
      return NextResponse.json({ error: 'Unable to fetch forecast' }, { status: 502 });
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
  } catch (error: any) {
    console.error('Weather API error:', error);
    return NextResponse.json({ error: 'Unexpected weather error' }, { status: 500 });
  }
}
