'use client';

import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { DEFAULT_WALLPAPERS } from '@/lib/wallpapers';
import { useToast } from './use-toast';

interface WallpaperContextType {
  wallpapers: string[];
  activeWallpaper: string;
  setActiveWallpaper: (url: string) => void;
  addWallpaper: (url: string) => void;
  deleteWallpaper: (url: string) => void;
}

const WallpaperContext = createContext<WallpaperContextType | undefined>(undefined);

const isServer = typeof window === 'undefined';

export const WallpaperProvider = ({ children }: { children: React.ReactNode }) => {
  const { toast } = useToast();
  
  const getInitialState = () => {
    if (isServer) {
      return { active: DEFAULT_WALLPAPERS[7], custom: [] };
    }
    const savedActive = localStorage.getItem('activeWallpaper');
    const savedCustom = localStorage.getItem('customWallpapers');
    return {
      active: savedActive || DEFAULT_WALLPAPERS[7],
      custom: savedCustom ? JSON.parse(savedCustom) : [],
    };
  };

  const [activeWallpaper, setActiveWallpaperState] = useState<string>(() => getInitialState().active);
  const [customWallpapers, setCustomWallpapers] = useState<string[]>(() => getInitialState().custom);

  const wallpapers = useMemo(() => [...DEFAULT_WALLPAPERS, ...customWallpapers], [customWallpapers]);

  useEffect(() => {
    if (!isServer) {
        document.body.style.backgroundImage = `url(${activeWallpaper})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center center';
        document.body.style.backgroundRepeat = 'no-repeat';
        document.body.style.backgroundAttachment = 'fixed';
    }
  }, [activeWallpaper]);

  const setActiveWallpaper = useCallback((url: string) => {
    setActiveWallpaperState(url);
    if (!isServer) {
      localStorage.setItem('activeWallpaper', url);
    }
  }, []);

  const addWallpaper = useCallback((url: string) => {
    // Basic URL format check
    if (!url.startsWith('http') && !url.startsWith('data:')) {
        toast({ variant: 'destructive', title: 'URL inválida', description: 'Por favor, introduce una URL de imagen válida.' });
        return;
    }

    // Check if it's a valid image
    const img = new Image();
    img.src = url;
    img.onload = () => {
        if (customWallpapers.includes(url)) {
            toast({ title: 'Ya existe', description: 'Este fondo de pantalla ya está en tu lista.' });
            return;
        }
        const newCustomWallpapers = [...customWallpapers, url];
        setCustomWallpapers(newCustomWallpapers);
         if (!isServer) {
            localStorage.setItem('customWallpapers', JSON.stringify(newCustomWallpapers));
        }
        toast({ title: '¡Éxito!', description: 'Fondo de pantalla añadido.' });
    };
    img.onerror = () => {
        toast({ variant: 'destructive', title: 'Error al cargar', description: 'La URL no apunta a una imagen válida.' });
    };
  }, [customWallpapers, toast]);

  const deleteWallpaper = useCallback((url: string) => {
    const newCustomWallpapers = customWallpapers.filter(w => w !== url);
    setCustomWallpapers(newCustomWallpapers);
    if (!isServer) {
        localStorage.setItem('customWallpapers', JSON.stringify(newCustomWallpapers));
    }
    if (activeWallpaper === url) {
        setActiveWallpaper(DEFAULT_WALLPAPERS[7]);
    }
    toast({ title: 'Fondo de pantalla eliminado.' });
  }, [activeWallpaper, customWallpapers, setActiveWallpaper, toast]);
  
  const value = useMemo(() => ({ wallpapers, activeWallpaper, setActiveWallpaper, addWallpaper, deleteWallpaper }), [
    wallpapers,
    activeWallpaper,
    setActiveWallpaper,
    addWallpaper,
    deleteWallpaper,
  ]);

  return <WallpaperContext.Provider value={value}>{children}</WallpaperContext.Provider>;
};

export const useWallpaper = () => {
  const context = useContext(WallpaperContext);
  if (context === undefined) {
    throw new Error('useWallpaper must be used within a WallpaperProvider');
  }
  return context;
};
