import ProfileWidget from '@/components/ios/widgets/ProfileWidget';
import CalendarWidget from '@/components/ios/widgets/CalendarWidget';
import WeatherWidget from '@/components/ios/widgets/WeatherWidget';
import ClockWidget from '@/components/ios/widgets/ClockWidget';
import type { WidgetSize } from '@/hooks/use-home-screen';

export interface WidgetConfig {
    type: string;
    component: React.ComponentType<{ size?: WidgetSize }>;
    nameKey: string;
    supportedSizes: WidgetSize[];
    defaultSize: WidgetSize;
}

export const WIDGETS: { [key: string]: WidgetConfig } = {
  profile: { type: 'profile', component: ProfileWidget, nameKey: 'widget.profile.title', supportedSizes: ['2x2'], defaultSize: '2x2' },
  calendar: { type: 'calendar', component: CalendarWidget, nameKey: 'widget.calendar.title', supportedSizes: ['2x2', '2x4'], defaultSize: '2x2' },
  weather: { type: 'weather', component: WeatherWidget, nameKey: 'widget.weather.title', supportedSizes: ['2x2'], defaultSize: '2x2' },
  clock: { type: 'clock', component: ClockWidget, nameKey: 'widget.clock.title', supportedSizes: ['2x2', '4x4'], defaultSize: '2x2' },
};

export const findWidget = (widgetType: string): WidgetConfig | undefined => {
    return WIDGETS[widgetType];
}
