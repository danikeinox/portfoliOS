import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FaSun, FaCloudSun, FaCloud, FaCloudRain, FaSnowflake } from 'react-icons/fa';
import { cn } from '@/lib/utils';
import type { WidgetSize } from '@/hooks/use-home-screen';
import {
    DEFAULT_WEATHER_LOCATION,
    type WeatherLocation,
    getStoredWeatherLocation,
    WEATHER_LOCATION_EVENT,
} from '@/lib/weather-location';

type ForecastResponse = {
    location: WeatherLocation;
    current?: {
        temperature_2m: number;
        weather_code: number;
        is_day: number;
    };
    daily?: {
        temperature_2m_max: number[];
        temperature_2m_min: number[];
    };
    hourly?: {
        time: string[];
        temperature_2m: number[];
        weather_code: number[];
    };
};

const getWidgetIcon = (code: number) => {
    if (code === 0) return FaSun;
    if ([1, 2].includes(code)) return FaCloudSun;
    if (code === 3) return FaCloud;
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return FaCloudRain;
    if ([71, 73, 75, 85, 86].includes(code)) return FaSnowflake;
    return FaCloudSun;
};

const WeatherWidget = ({ size = '2x2' }: { size?: WidgetSize }) => {
    const [location, setLocation] = useState<WeatherLocation>(DEFAULT_WEATHER_LOCATION);
    const [data, setData] = useState<ForecastResponse | null>(null);

    useEffect(() => {
        const loadWeather = async (target: WeatherLocation) => {
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
            if (!response.ok) return;
            const result = await response.json();
            setData(result);
        };

        const initialLocation = getStoredWeatherLocation();
        setLocation(initialLocation);
        loadWeather(initialLocation);

        const refreshInterval = setInterval(() => loadWeather(getStoredWeatherLocation()), 10 * 60 * 1000);

        const handleLocationChange = (event: Event) => {
            const detail = (event as CustomEvent<WeatherLocation>).detail;
            if (!detail) return;
            setLocation(detail);
            loadWeather(detail);
        };

        window.addEventListener(WEATHER_LOCATION_EVENT, handleLocationChange as EventListener);
        return () => {
            window.removeEventListener(WEATHER_LOCATION_EVENT, handleLocationChange as EventListener);
            clearInterval(refreshInterval);
        };
    }, []);

    const weatherCode = data?.current?.weather_code ?? 1;
    const CurrentIcon = getWidgetIcon(weatherCode);

    const forecast = (data?.hourly?.time ?? []).slice(0, 6).map((time, index) => {
        const icon = getWidgetIcon(data?.hourly?.weather_code?.[index] ?? 1);
        return {
            hour: `${String(new Date(time).getHours()).padStart(2, '0')}`,
            temp: Math.round(data?.hourly?.temperature_2m?.[index] ?? 0),
            icon,
        };
    });

    return (
        <Link href="/app/weather" className="block w-full h-full">
            <div className="w-full h-full bg-white/25 backdrop-blur-xl rounded-2xl md:rounded-3xl p-2.5 text-gray-800 flex flex-col justify-between">
                <div>
                    <h3 className="font-bold text-black text-xs line-clamp-1">{location.name}</h3>
                    <div className="flex items-center justify-between">
                        <p className="text-2xl font-thin text-black -ml-1">{Math.round(data?.current?.temperature_2m ?? 20)}°</p>
                        <CurrentIcon className="text-yellow-500 text-base" />
                    </div>
                </div>
                <div className="text-[10px]">
                    <p className="font-semibold text-black">{weatherCode === 0 ? 'Soleado' : 'Variable'}</p>
                    <p className="text-gray-600 font-medium">Máx. {Math.round(data?.daily?.temperature_2m_max?.[0] ?? 22)}° Mín. {Math.round(data?.daily?.temperature_2m_min?.[0] ?? 12)}°</p>
                </div>
                <div className="border-t border-gray-400/50 mt-1 pt-1">
                    <div className="grid grid-cols-6 gap-0.5 text-center text-[10px]">
                        {forecast.map(f => (
                            <div key={`${f.hour}-${f.temp}`} className="flex flex-col items-center font-semibold">
                                <span className="text-[9px] text-gray-600">{f.hour}</span>
                                <f.icon className="text-yellow-500 my-0.5 text-sm" />
                                <span className="text-black">{f.temp}°</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default WeatherWidget;
