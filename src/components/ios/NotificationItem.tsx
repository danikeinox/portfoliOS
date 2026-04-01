'use client';
import { useState } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';
import { findApp } from '@/lib/apps';
import type { Notification } from '@/hooks/use-notifications';
import { useI18n } from '@/hooks/use-i18n';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ComponentType } from 'react';
import type { IconType } from 'react-icons';
import { SiAppstore, SiSpotify } from 'react-icons/si';

import { 
    Phone, Video, StickyNote, ImageIcon, Camera, Settings, Map, Tv, Podcast, 
    Newspaper, MessageCircle, Music, Compass, Linkedin, Github, User, FolderOpen, Youtube, Wrench, MessagesSquare, Mail, Rss, CalendarDays
} from 'lucide-react';

// Duplicated from AppIcon.tsx to avoid modifying a forbidden file.
type GenericIcon = ComponentType<any> | IconType;
const systemIconMapping: { [key: string]: { icon: GenericIcon, bgColor?: string, color?: string } } = {
  notes: { icon: StickyNote, bgColor: '#fff', color: '#1c1c1e' },
  photos: { icon: ImageIcon, bgColor: '#fff', color: '#1c1c1e' },
  camera: { icon: Camera, bgColor: '#f0f0f0', color: '#1c1c1e' },
  settings: { icon: Settings, bgColor: '#8e8e93', color: 'white' },
  maps: { icon: Map, bgColor: '#fff', color: '#1c1c1e' },
  tv: { icon: Tv, bgColor: '#1c1c1e', color: 'white' },
  podcasts: { icon: Podcast, bgColor: '#af52de', color: 'white' },
  appstore: { icon: SiAppstore, bgColor: '#007aff', color: 'white' },
  news: { icon: Newspaper, bgColor: '#ff3b30', color: 'white' },
  facetime: { icon: Video, bgColor: '#34c759', color: 'white' },
  phone: { icon: Phone, bgColor: '#34c759', color: 'white' },
  safari: { icon: Compass, bgColor: '#007aff', color: 'white' },
  messages: { icon: MessageCircle, bgColor: '#34c759', color: 'white' },
  music: { icon: Music, bgColor: '#ff2d55', color: 'white' },
  linkedin: { icon: Linkedin, bgColor: '#0a66c2', color: 'white' },
  github: { icon: Github, bgColor: '#1c1c1e', color: 'white' },
  about: { icon: User, bgColor: '#007aff', color: 'white' },
  portfolio: { icon: FolderOpen, bgColor: '#8e8e93', color: 'white' },
  youtube: { icon: Youtube, bgColor: '#ff3b30', color: 'white' },
  services: { icon: Wrench, bgColor: '#ff9500', color: 'white' },
  testimonials: { icon: MessagesSquare, bgColor: '#34c759', color: 'white' },
  contact: { icon: Mail, bgColor: '#5ac8fa', color: 'white' },
  blog: { icon: Rss, bgColor: '#ffcc00', color: 'white' },
  calendar: { icon: CalendarDays, bgColor: 'white', color: '#1c1c1e' },
  spotify: { icon: SiSpotify, bgColor: '#1DB954', color: 'black' }
};

type NotificationGroup = {
    id: string;
    appId: string;
    isGroup: true;
    notifications: Notification[];
};

type RenderableNotification = (Notification & { isGroup: false }) | NotificationGroup;

interface NotificationItemProps {
    item: RenderableNotification;
    onRemove: (id: string) => void;
}

const NotificationItem = ({ item, onRemove }: NotificationItemProps) => {
    const { t } = useI18n();
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Swipe-to-dismiss gesture
    const [{ x }, api] = useSpring(() => ({ x: 0 }));
    const bind = useDrag(({ down, movement: [mx], cancel }) => {
        if (mx < -window.innerWidth / 2) {
            cancel();
            api.start({
                x: -window.innerWidth,
                opacity: 0,
                onRest: () => onRemove(item.id),
            });
        } else {
            api.start({ x: down ? mx : 0, immediate: down });
        }
    }, {
        axis: 'x',
        bounds: { left: -window.innerWidth, right: 0 },
        rubberband: true
    });
    
    const appDetails = findApp(item.appId);
    if (!appDetails) return null;

    const systemStyle = systemIconMapping[appDetails.id] || {};
    const Icon = systemStyle.icon || appDetails.icon;
    const bgColor = systemStyle.bgColor || '#1c1c1e';
    const color = systemStyle.color || 'white';

    const SingleNotificationCard = ({ notification, isChild }: { notification: Notification, isChild?: boolean }) => (
        <div className={cn(
            "w-full bg-neutral-800/60 backdrop-blur-xl rounded-2xl p-3 border border-white/10 shadow-md",
            isChild && "bg-neutral-900/70"
        )}>
            <div className="flex items-center justify-between text-xs opacity-80 mb-2">
                <div className="flex items-center gap-2 font-semibold">
                    <div className="w-5 h-5 rounded-md overflow-hidden flex items-center justify-center" style={{ backgroundColor: bgColor }}>
                       <Icon className="w-3/5 h-3/5" style={{ color: color }} />
                    </div>
                    <span>{t(notification.appName)}</span>
                </div>
                <span className="text-white/60">{t('notification.item.now')}</span>
            </div>
            <div className="pl-[28px] -mt-1">
                <p className="font-semibold text-white/95">{notification.title}</p>
                <p className="text-sm text-white/80">{notification.message}</p>
            </div>
        </div>
    );

    const content = item.isGroup ? (
        <div className="space-y-1">
            <div onClick={() => setIsExpanded(!isExpanded)} className="cursor-pointer">
                <SingleNotificationCard notification={item.notifications[0]} />
            </div>
            {isExpanded && (
                 <div className="ml-3 pl-2 border-l-2 border-neutral-700 space-y-1 animate-in fade-in-50">
                    {item.notifications.slice(1).map(notif => (
                        <SingleNotificationCard key={notif.id} notification={notif} isChild />
                    ))}
                </div>
            )}
             <div className="flex justify-center -mt-2">
                <button onClick={() => setIsExpanded(!isExpanded)} className="text-white/60 hover:text-white transition-colors">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
             </div>
        </div>
    ) : (
        <SingleNotificationCard notification={item} />
    );

    return (
        <animated.div {...bind()} style={{ x, touchAction: 'pan-y' }}>
            {content}
        </animated.div>
    );
};

export default NotificationItem;
