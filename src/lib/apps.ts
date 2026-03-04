'use client';
import type { ComponentType } from 'react';
import type { IconType } from 'react-icons';
import { SiAppstore, SiSpotify } from 'react-icons/si';

import { 
    User, FolderOpen, Youtube, Wrench, MessagesSquare, Mail, Rss, Github, Linkedin, 
    Phone, Video, StickyNote, Image as ImageIcon, Camera, Settings, Map, Tv, Podcast, 
    Newspaper, MessageCircle, Music, Compass, CalendarDays, Clock, CloudSun
} from 'lucide-react';

// A more generic type for icons to accommodate multiple libraries
type GenericIcon = ComponentType<any> | IconType;

export type AppCategory = 'Social' | 'Productivity' | 'Entertainment' | 'Creativity' | 'Information & Reading' | 'Utilities' | 'Development' | 'Business';

export interface App {
  id: string;
  title: string;
  icon: GenericIcon;
  color?: string;
  bgColor?: string;
  notifications?: number;
  href?: string;
  isSystem?: boolean;
  category?: AppCategory;
}

export const HOME_SCREEN_APPS: App[] = [
  { id: 'about', title: 'app.about', icon: User, bgColor: '#007aff', color: 'white', category: 'Productivity', href: '/app/about' },
  { id: 'portfolio', title: 'app.portfolio', icon: FolderOpen, bgColor: '#8e8e93', color: 'white', category: 'Productivity', href: '/app/portfolio' },
  { id: 'youtube', title: 'app.youtube', icon: Youtube, bgColor: '#ff3b30', color: 'white', href: '/app/youtube', category: 'Entertainment' },
  { id: 'services', title: 'app.services', icon: Wrench, bgColor: '#ff9500', color: 'white', category: 'Business', href: '/app/services' },
  { id: 'testimonials', title: 'app.testimonials', icon: MessagesSquare, bgColor: '#34c759', color: 'white', category: 'Social', href: '/app/testimonials' },
  { id: 'contact', title: 'app.contact', icon: Mail, bgColor: '#5ac8fa', color: 'white', category: 'Social', href: '/app/contact' },
  { id: 'blog', title: 'app.blog', icon: Rss, bgColor: '#ffcc00', color: 'white', category: 'Information & Reading', href: '/app/blog' },
  { id: 'facetime', title: 'app.facetime', icon: Video, isSystem: true, category: 'Social', href: '/app/facetime' },
  { id: 'calendar', title: 'app.calendar', icon: CalendarDays, isSystem: true, category: 'Productivity', href: '/app/calendar' },
  { id: 'clock', title: 'app.clock', icon: Clock, isSystem: true, category: 'Utilities', href: '/app/clock' },
  { id: 'weather', title: 'app.weather', icon: CloudSun, isSystem: true, category: 'Utilities', href: '/app/weather' },
  { id: 'notes', title: 'app.notes', icon: StickyNote, isSystem: true, category: 'Productivity', href: '/app/notes' },
  { id: 'photos', title: 'app.photos', icon: ImageIcon, isSystem: true, category: 'Creativity', href: '/app/photos' },
  { id: 'camera', title: 'app.camera', icon: Camera, isSystem: true, category: 'Creativity', href: '/app/camera' },
  { id: 'github', title: 'app.github', icon: Github, bgColor: '#1c1c1e', color: 'white', href: 'https://github.com/danikeinox', category: 'Development' },
  { id: 'linkedin', title: 'app.linkedin', icon: Linkedin, bgColor: '#0a66c2', color: 'white', href: 'https://linkedin.com/in/dcabreraa/', category: 'Social' },
  { id: 'settings', title: 'app.settings', icon: Settings, isSystem: true, category: 'Utilities', href: '/app/settings' },
  { id: 'maps', title: 'app.maps', icon: Map, isSystem: true, category: 'Utilities', href: '/app/maps' },
  { id: 'tv', title: 'app.tv', icon: Tv, isSystem: true, category: 'Entertainment', href: '/app/tv' },
  { id: 'podcasts', title: 'app.podcasts', icon: Podcast, isSystem: true, category: 'Entertainment', href: '/app/podcasts' },
  { id: 'appstore', title: 'app.appstore', icon: SiAppstore, isSystem: true, category: 'Utilities', href: '/app/appstore' },
  { id: 'news', title: 'app.news', icon: Newspaper, isSystem: true, category: 'Information & Reading', href: '/app/news' },
];

export const DOCK_APPS: App[] = [
    { id: 'phone', title: 'app.phone', icon: Phone, isSystem: true, href: '/app/phone' },
    { id: 'safari', title: 'app.safari', icon: Compass, isSystem: true, href: '/app/safari' },
    { id: 'messages', title: 'app.messages', icon: MessageCircle, isSystem: true, href: '/app/messages' },
    { id: 'spotify', title: 'app.spotify', icon: SiSpotify, bgColor: '#1DB954', color: 'black', href: '/app/spotify' },
]

export const findApp = (appId: string): App | undefined => {
    return [...HOME_SCREEN_APPS, ...DOCK_APPS].find(app => app.id === appId);
}
