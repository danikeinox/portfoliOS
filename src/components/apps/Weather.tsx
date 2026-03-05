'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, MapPin, Loader2, CloudSun, Sun, Cloud, CloudRain, CloudSnow, CloudFog, CloudLightning } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  DEFAULT_WEATHER_LOCATION,
  type WeatherLocation,
  getStoredWeatherLocation,
  setStoredWeatherLocation,
  WEATHER_LOCATION_EVENT,
} from '@/lib/weather-location';

type WeatherResponse = {
  location: WeatherLocation;
  current?: {
    temperature_2m: number;
    weather_code: number;
    is_day: number;
    apparent_temperature: number;
    wind_speed_10m: number;
  };
  hourly?: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
  };
  daily?: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  };
};

const getWeatherMeta = (code: number, isDay = true) => {
  if (code === 0) return { label: 'Despejado', Icon: isDay ? Sun : CloudSun };
  if ([1, 2].includes(code)) return { label: 'Parcialmente nublado', Icon: CloudSun };
  if (code === 3) return { label: 'Nublado', Icon: Cloud };
  if ([45, 48].includes(code)) return { label: 'Niebla', Icon: CloudFog };
  if ([51, 53, 55, 56, 57, 61, 63, 65, 80, 81, 82].includes(code)) return { label: 'Lluvia', Icon: CloudRain };
  if ([66, 67, 71, 73, 75, 77, 85, 86].includes(code)) return { label: 'Nieve', Icon: CloudSnow };
  if ([95, 96, 99].includes(code)) return { label: 'Tormenta', Icon: CloudLightning };
  return { label: 'Variable', Icon: CloudSun };
};

const formatHour = (iso: string) => {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, '0')}:00`;
};

const formatDay = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '');
};

const Weather = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<WeatherLocation[]>([]);
  const [location, setLocation] = useState<WeatherLocation>(DEFAULT_WEATHER_LOCATION);
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async (target: WeatherLocation) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        action: 'forecast',
        lat: String(target.latitude),
        lon: String(target.longitude),
        timezone: target.timezone ?? 'auto',
        name: target.name,
        country: target.country ?? '',
        admin1: target.admin1 ?? '',
      });
      const response = await fetch(`/api/weather?${params.toString()}`);
      if (!response.ok) throw new Error('No se pudo cargar el clima.');
      const data = await response.json();
      setWeather(data);
    } catch (fetchError: any) {
      setError(fetchError.message ?? 'Error al obtener el clima.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const initial = getStoredWeatherLocation();
    setLocation(initial);
    fetchWeather(initial);

    const handleLocationChange = (event: Event) => {
      const detail = (event as CustomEvent<WeatherLocation>).detail;
      if (!detail) return;
      setLocation(detail);
      fetchWeather(detail);
    };

    window.addEventListener(WEATHER_LOCATION_EVENT, handleLocationChange as EventListener);
    return () => window.removeEventListener(WEATHER_LOCATION_EVENT, handleLocationChange as EventListener);
  }, [fetchWeather]);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ action: 'search', q: query.trim(), lang: 'es' });
        const response = await fetch(`/api/weather?${params.toString()}`);
        if (!response.ok) throw new Error('Error de búsqueda');
        const data = await response.json();
        setResults(Array.isArray(data.results) ? data.results : []);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  const currentMeta = useMemo(() => {
    const code = weather?.current?.weather_code ?? 1;
    const isDay = (weather?.current?.is_day ?? 1) === 1;
    return getWeatherMeta(code, isDay);
  }, [weather]);

  const pickLocation = (selected: WeatherLocation) => {
    setLocation(selected);
    setStoredWeatherLocation(selected);
    setQuery('');
    setResults([]);
    fetchWeather(selected);
  };

  return (
    <div className="w-full h-full bg-[#f2f4f8] text-black dark:bg-black dark:text-white flex flex-col transition-colors">
      <div className="px-4 pt-3 pb-3 border-b border-black/10 dark:border-white/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black/50 dark:text-white/60" size={18} />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar ciudad, provincia o país"
            className="pl-10 bg-white border-black/10 text-black placeholder:text-black/50 dark:bg-white/10 dark:border-white/10 dark:text-white dark:placeholder:text-white/60"
          />
        </div>

        {(isSearching || results.length > 0) && (
          <div className="mt-2 rounded-xl bg-white border border-black/10 dark:bg-neutral-900 dark:border-white/10 overflow-hidden max-h-48 overflow-y-auto">
            {isSearching ? (
              <div className="p-3 flex items-center gap-2 text-black/70 dark:text-white/70 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> Buscando...
              </div>
            ) : (
              results.map((item, index) => (
                <button
                  key={`${item.name}-${item.latitude}-${item.longitude}-${index}`}
                  onClick={() => pickLocation(item)}
                  className="w-full text-left px-3 py-2 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-black/60 dark:text-white/70">{[item.admin1, item.country].filter(Boolean).join(', ')}</p>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {isLoading && (
            <div className="h-56 rounded-3xl bg-gradient-to-b from-blue-300/60 to-blue-500/70 dark:from-blue-500/40 dark:to-blue-900/50 border border-black/10 dark:border-white/10 flex items-center justify-center">
              <Loader2 className="w-7 h-7 animate-spin text-black/70 dark:text-white/80" />
            </div>
          )}

          {!isLoading && error && (
            <div className="rounded-3xl bg-red-500/10 dark:bg-red-500/15 border border-red-400/40 p-4 text-sm text-red-700 dark:text-red-100">
              {error}
            </div>
          )}

          {!isLoading && !error && weather && (
            <>
              <div className="rounded-3xl bg-gradient-to-b from-blue-300/80 via-blue-500/70 to-blue-700/80 dark:from-blue-500/50 dark:via-blue-700/50 dark:to-blue-950/80 p-5 border border-black/10 dark:border-white/10">
                <p className="text-2xl font-semibold leading-tight">{weather.location.name}</p>
                <p className="text-sm text-black/70 dark:text-white/80">{[weather.location.admin1, weather.location.country].filter(Boolean).join(', ')}</p>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-7xl font-thin leading-none">{Math.round(weather.current?.temperature_2m ?? 0)}°</p>
                    <p className="text-sm text-black/70 dark:text-white/85 mt-1">Sensación de {Math.round(weather.current?.apparent_temperature ?? 0)}°</p>
                  </div>
                  <div className="text-right">
                    <currentMeta.Icon className="w-10 h-10 ml-auto" />
                    <p className="text-sm mt-2">{currentMeta.label}</p>
                    <p className="text-xs text-black/70 dark:text-white/80 mt-1">Viento {Math.round(weather.current?.wind_speed_10m ?? 0)} km/h</p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-white/75 dark:bg-white/10 border border-black/10 dark:border-white/10 p-3 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-wide text-black/60 dark:text-white/70 mb-3">Próximas horas</p>
                <div className="grid grid-cols-4 gap-2">
                  {weather.hourly?.time?.slice(0, 8).map((time, index) => {
                    const weatherCode = weather.hourly?.weather_code?.[index] ?? 1;
                    const hourlyMeta = getWeatherMeta(weatherCode, true);
                    return (
                      <div key={`${time}-${index}`} className="rounded-xl bg-black/5 dark:bg-white/10 p-2 text-center">
                        <p className="text-[11px] text-black/70 dark:text-white/80">{formatHour(time)}</p>
                        <hourlyMeta.Icon className="w-4 h-4 mx-auto my-1" />
                        <p className="text-sm font-medium">{Math.round(weather.hourly?.temperature_2m?.[index] ?? 0)}°</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-3xl bg-white/75 dark:bg-white/10 border border-black/10 dark:border-white/10 p-3 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-wide text-black/60 dark:text-white/70 mb-2">Próximos días</p>
                <div className="space-y-2">
                  {weather.daily?.time?.slice(0, 5).map((day, index) => {
                    const weatherCode = weather.daily?.weather_code?.[index] ?? 1;
                    const dailyMeta = getWeatherMeta(weatherCode, true);
                    return (
                      <div key={day} className={cn('flex items-center justify-between rounded-xl px-3 py-2', index === 0 ? 'bg-black/10 dark:bg-white/15' : 'bg-black/5 dark:bg-white/5')}>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-black/60 dark:text-white/70" />
                          <span className="font-medium text-sm uppercase">{formatDay(day)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-black/90 dark:text-white/90">
                          <dailyMeta.Icon className="w-4 h-4" />
                          <span className="text-sm">{Math.round(weather.daily?.temperature_2m_max?.[index] ?? 0)}°</span>
                          <span className="text-xs text-black/60 dark:text-white/60">{Math.round(weather.daily?.temperature_2m_min?.[index] ?? 0)}°</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default Weather;
