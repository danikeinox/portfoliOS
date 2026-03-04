export interface WeatherLocation {
  name: string;
  country?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

const WEATHER_LOCATION_KEY = 'ios.weather.location';
export const WEATHER_LOCATION_EVENT = 'weather-location-change';

export const DEFAULT_WEATHER_LOCATION: WeatherLocation = {
  name: 'Madrid',
  country: 'Spain',
  admin1: 'Madrid',
  latitude: 40.4168,
  longitude: -3.7038,
  timezone: 'Europe/Madrid',
};

export const getStoredWeatherLocation = (): WeatherLocation => {
  if (typeof window === 'undefined') return DEFAULT_WEATHER_LOCATION;

  const value = window.localStorage.getItem(WEATHER_LOCATION_KEY);
  if (!value) return DEFAULT_WEATHER_LOCATION;

  try {
    const parsed = JSON.parse(value) as WeatherLocation;
    if (typeof parsed.latitude !== 'number' || typeof parsed.longitude !== 'number' || !parsed.name) {
      return DEFAULT_WEATHER_LOCATION;
    }
    return parsed;
  } catch {
    return DEFAULT_WEATHER_LOCATION;
  }
};

export const setStoredWeatherLocation = (location: WeatherLocation) => {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(WEATHER_LOCATION_KEY, JSON.stringify(location));
  window.dispatchEvent(new CustomEvent(WEATHER_LOCATION_EVENT, { detail: location }));
};
