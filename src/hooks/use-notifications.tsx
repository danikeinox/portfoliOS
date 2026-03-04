'use client';
import React, { createContext, useState, useContext, useCallback, useMemo, ReactNode, ComponentType } from 'react';
import type { IconType } from 'react-icons';
import { findApp } from '@/lib/apps';
import { produce } from 'immer';

type GenericIcon = ComponentType<any> | IconType;

export interface Notification {
    id: string;
    appId: string;
    appName: string;
    title: string;
    message: string;
    icon: GenericIcon;
    timestamp: number;
    color?: string;
    bgColor?: string;
}

interface NotificationsContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'appName' | 'icon' | 'color' | 'bgColor'>) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  clearNotificationsByAppId: (appId: string) => void;
  getNotificationCountForApp: (appId: string) => number;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider = ({ children }: { children: ReactNode }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'appName' | 'icon' | 'color' | 'bgColor'>) => {
        const appDetails = findApp(notification.appId);
        if (!appDetails) {
            console.warn(`App with id "${notification.appId}" not found for notification.`);
            return;
        }

        const newNotification: Notification = {
            ...notification,
            id: `${Date.now()}-${Math.random()}`,
            timestamp: Date.now(),
            appName: appDetails.title,
            icon: appDetails.icon,
            color: appDetails.color,
            bgColor: appDetails.bgColor,
        };

        setNotifications(produce(draft => {
            draft.unshift(newNotification);
        }));
    }, []);

    const removeNotification = useCallback((id: string) => {
        setNotifications(produce(draft => {
            return draft.filter(n => n.id !== id);
        }));
    }, []);
    
    const clearNotificationsByAppId = useCallback((appId: string) => {
        setNotifications(produce(draft => {
            return draft.filter(n => n.appId !== appId);
        }));
    }, []);

    const clearAllNotifications = useCallback(() => {
        setNotifications([]);
    }, []);
    
    const getNotificationCountForApp = useCallback((appId: string) => {
        return notifications.filter(n => n.appId === appId).length;
    }, [notifications]);

    const value = useMemo(() => ({
        notifications,
        addNotification,
        removeNotification,
        clearAllNotifications,
        clearNotificationsByAppId,
        getNotificationCountForApp,
    }), [
        notifications,
        addNotification,
        removeNotification,
        clearAllNotifications,
        clearNotificationsByAppId,
        getNotificationCountForApp,
    ]);

    return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
};

export const useNotifications = () => {
    const context = useContext(NotificationsContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationsProvider');
    }
    return context;
};
