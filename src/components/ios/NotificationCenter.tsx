'use client';

import { useRef, useMemo } from 'react';
import { useClickAway } from 'react-use';
import { animated, useTransition } from '@react-spring/web';
import { cn } from '@/lib/utils';
import { useNotifications, type Notification } from '@/hooks/use-notifications';
import NotificationItem from './NotificationItem';
import { useI18n } from '@/hooks/use-i18n';
import { X } from 'lucide-react';

interface NotificationCenterProps {
  isVisible: boolean;
  onClose: () => void;
}

type NotificationGroup = {
    id: string;
    appId: string;
    isGroup: true;
    notifications: Notification[];
};

type RenderableNotification = (Notification & { isGroup: false }) | NotificationGroup;


const NotificationCenter = ({ isVisible, onClose }: NotificationCenterProps) => {
  const { t } = useI18n();
  const ref = useRef(null);
  const { notifications, removeNotification, clearAllNotifications } = useNotifications();

  useClickAway(ref, () => {
    if (isVisible) onClose();
  });
    
  const groupedNotifications: RenderableNotification[] = useMemo(() => {
    if (notifications.length === 0) return [];
    
    const groups: RenderableNotification[] = [];
    let tempGroup: Notification[] = [];
    
    notifications.forEach((notification, index) => {
      if (index === 0) {
        tempGroup.push(notification);
      } else {
        const prevNotification = notifications[index - 1];
        if (notification.appId === prevNotification.appId) {
          tempGroup.push(notification);
        } else {
          if (tempGroup.length > 1) {
            groups.push({
              id: `group-${tempGroup[0].id}`,
              appId: tempGroup[0].appId,
              isGroup: true,
              notifications: [...tempGroup].reverse(),
            });
          } else if (tempGroup.length === 1) {
            groups.push({ ...tempGroup[0], isGroup: false });
          }
          tempGroup = [notification];
        }
      }
    });

    if (tempGroup.length > 1) {
        groups.push({
            id: `group-${tempGroup[0].id}`,
            appId: tempGroup[0].appId,
            isGroup: true,
            notifications: [...tempGroup].reverse(),
        });
    } else if (tempGroup.length === 1) {
        groups.push({ ...tempGroup[0], isGroup: false });
    }

    return groups;
  }, [notifications]);


  const transitions = useTransition(groupedNotifications, {
    from: { opacity: 0, transform: 'translateY(20px) scale(0.98)' },
    enter: { opacity: 1, transform: 'translateY(0) scale(1)' },
    leave: { opacity: 0, transform: 'translateX(-100%) scale(0.98)' },
    keys: item => item.id,
  });

  return (
    <div
      className={cn(
        'fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300',
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
      onClick={onClose}
    >
      <div
        ref={ref}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "absolute top-[calc(env(safe-area-inset-top)+0.5rem)] left-0 right-0 mx-auto w-[95%] max-w-md h-[calc(100%-env(safe-area-inset-top)-env(safe-area-inset-bottom)-2rem)] flex flex-col transition-all duration-300 origin-top",
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        )}
      >
        <div className="flex justify-between items-center px-2 mb-4">
            <h3 className="font-bold text-xl ml-2">{t('notification.centerTitle')}</h3>
            {notifications.length > 0 && (
                <button onClick={clearAllNotifications} className="w-8 h-8 rounded-full bg-neutral-800/60 backdrop-blur-xl flex items-center justify-center text-white/80 hover:text-white transition-colors">
                    <X size={18}/>
                </button>
            )}
        </div>
        <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {transitions((style, item) => (
                <animated.div style={style}>
                    <NotificationItem 
                        item={item} 
                        onRemove={removeNotification}
                    />
                </animated.div>
            ))}
            {notifications.length === 0 && (
                <div className="h-full flex items-center justify-center">
                    <div className="bg-neutral-800/50 backdrop-blur-xl rounded-2xl px-8 py-6 text-center text-white/70">
                        <p className="font-semibold text-lg">{t('notification.noNotifications')}</p>
                        <p className="text-sm">{t('notification.noNotificationsHint')}</p> 
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
