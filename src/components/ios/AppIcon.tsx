'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { App } from '@/lib/apps';
import { cn } from '@/lib/utils';
import { Minus } from 'lucide-react';
import type { IconType } from 'react-icons';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import React, { ComponentType, forwardRef } from 'react';
import { useI18n } from '@/hooks/use-i18n';
import { useNotifications } from '@/hooks/use-notifications';
import { 
    Phone, Video, StickyNote, Image as ImageIcon, Camera, Settings, Map, Tv, Podcast, 
    Newspaper, MessageCircle, Music, Compass, Linkedin, Github, User, FolderOpen, Youtube, Wrench, MessagesSquare, Mail, Rss, CalendarDays, Clock
} from 'lucide-react';
import { SiAppstore, SiSpotify } from 'react-icons/si';
import CalendarIcon from './CalendarIcon';
import { useHomeScreen } from '@/hooks/use-home-screen';

export const systemIconMapping: { [key: string]: { icon: GenericIcon, bgColor?: string, color?: string } } = {
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
  clock: { icon: Clock, bgColor: '#1c1c1e', color: 'white' },
  spotify: { icon: SiSpotify, bgColor: '#1DB954', color: 'white' }
};

type GenericIcon = ComponentType<any> | IconType;

interface AppIconProps {
    app: App;
    isDock?: boolean;
    isJiggleMode: boolean;
    onRemove?: () => void;
    action?: 'navigate' | 'addToHomeScreen';
    onAddToHomeScreen?: (appId: string) => void;
    isDragging?: boolean;
    style?: React.CSSProperties;
}

const AppIcon = forwardRef<HTMLDivElement, AppIconProps>(({ 
    app, 
    isDock = false, 
    isJiggleMode, 
    onRemove, 
    action = 'navigate', 
    onAddToHomeScreen, 
    isDragging,
    style,
    ...props
}, ref) => {
  const { t } = useI18n();
  const { getNotificationCountForApp } = useNotifications();
  const { removeItem } = useHomeScreen();

  const notificationCount = getNotificationCountForApp(app.id) + (app.notifications || 0);

  const systemStyle = systemIconMapping[app.id] || {};
  const Icon = systemStyle.icon || app.icon;
  const bgColor = systemStyle.bgColor || app.bgColor || '#1c1c1e';
  const color = systemStyle.color || app.color || 'white';
  
  const iconSizeClass = isDock ? 'w-16 h-16 md:w-16 md:h-16' : 'w-16 h-16';
  const textSizeClass = isDock ? 'text-sm mt-2 hidden' : 'text-xs mt-1';
  
  const isNavigable = !isJiggleMode && action === 'navigate';
  const href = isNavigable ? (app.href || `/app/${app.id}`) : '#';
  const title = t(app.title);

  const handleIconClick = (e: React.MouseEvent) => {
    if (!isNavigable) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (action === 'addToHomeScreen') {
      e.preventDefault();
      onAddToHomeScreen?.(app.id);
    }
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    if (isJiggleMode) {
      e.stopPropagation();
    }
  };

  const handleRemove = () => {
    if (onRemove) {
        onRemove();
    }
  }

  return (
    <div 
        ref={ref} 
        style={style} 
        className={cn(
            "flex flex-col items-center relative transition-opacity", 
            isDragging && 'opacity-30'
        )} 
        draggable="false" 
        onContextMenu={(e) => e.preventDefault()} 
        onClick={handleContainerClick}
        {...props}
    >
      {isJiggleMode && onRemove && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button 
              aria-label={t('deleteApp.title', { appTitle: title })}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }}
              className="absolute -top-2 -left-5 w-5 h-5 bg-neutral-500 rounded-full flex items-center justify-center border border-black/10 z-10 animate-in fade-in zoom-in-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
                <Minus size={14} color="white" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-neutral-800/80 backdrop-blur-xl border-none rounded-2xl text-white w-[270px]">
              <AlertDialogHeader className="items-center space-y-1">
                  <AlertDialogTitle className="font-semibold">{t('deleteApp.title', {appTitle: title})}</AlertDialogTitle>
                  <AlertDialogDescription className="text-sm text-center">
                      {t('deleteApp.description')}
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex flex-col -mx-6 -mb-6 mt-4">
                  <AlertDialogAction onClick={handleRemove} className="w-full rounded-none justify-center bg-transparent text-red-500 hover:bg-neutral-700/70 border-t border-neutral-500/30 h-11 text-base font-normal">
                      {t('delete')}
                  </AlertDialogAction>
                  <AlertDialogCancel className="w-full rounded-none justify-center bg-transparent text-blue-500 hover:bg-neutral-700/70 border-t border-neutral-500/30 mt-0 h-11 text-base font-semibold">
                      {t('cancel')}
                  </AlertDialogCancel>
              </div>
          </AlertDialogContent>
        </AlertDialog>
      )}
      <Link 
        href={href} 
        className="flex flex-col items-center text-center no-underline text-white group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40 rounded-xl" 
        title={title} 
        aria-label={title}
        onClick={handleIconClick} 
        draggable="false"
      >
        <div
          className={cn(
            'relative flex items-center justify-center rounded-squircle shadow-lg transform transition-transform duration-200 ease-in-out group-hover:scale-105 overflow-hidden',
            iconSizeClass,
            isJiggleMode && !isDragging && 'jiggle'
          )}
          style={{ backgroundColor: bgColor }}
        >
          {app.id === 'calendar' ? (
             <CalendarIcon />
          ) : (
             <Icon style={{ color }} className="w-[55%] h-[55%]" />
          )}
          
          {notificationCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-black/10">
              {notificationCount}
            </div>
          )}
        </div>
        {!isDock && (
          <span className={cn('drop-shadow-md', textSizeClass)}>{title}</span>
        )}
      </Link>
    </div>
  );
});

AppIcon.displayName = "AppIcon";

export default AppIcon;
