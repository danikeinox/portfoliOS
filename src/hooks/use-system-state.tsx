'use client';

import React, { createContext, useState, useContext, ReactNode, Dispatch, SetStateAction, useEffect, useMemo, useCallback } from 'react';

type HourFormat = '12h' | '24h';

interface SystemStateContextType {
  wifiEnabled: boolean;
  setWifiEnabled: Dispatch<SetStateAction<boolean>>;
  bluetoothEnabled: boolean;
  setBluetoothEnabled: Dispatch<SetStateAction<boolean>>;
  mobileDataEnabled: boolean;
  setMobileDataEnabled: Dispatch<SetStateAction<boolean>>;
  brightness: number;
  setBrightness: Dispatch<SetStateAction<number>>;
  volume: number;
  setVolume: Dispatch<SetStateAction<number>>;
  hourFormat: HourFormat;
  setHourFormat: Dispatch<SetStateAction<HourFormat>>;
}

const SystemStateContext = createContext<SystemStateContextType | undefined>(undefined);

export const SystemStateProvider = ({ children }: { children: ReactNode }) => {
  const [wifiEnabled, setWifiEnabled] = useState(true);
  const [bluetoothEnabled, setBluetoothEnabled] = useState(true);
  const [mobileDataEnabled, setMobileDataEnabled] = useState(true);
  const [brightness, setBrightness] = useState(80);
  const [volume, setVolume] = useState(50);
  const [hourFormat, setHourFormat] = useState<HourFormat>('24h');

  useEffect(() => {
    const savedFormat = localStorage.getItem('hourFormat') as HourFormat;
    if (savedFormat) {
      setHourFormat(savedFormat);
    }
  }, []);

  const handleSetHourFormat = useCallback((format: SetStateAction<HourFormat>) => {
    setHourFormat(prevFormat => {
      const newFormat = typeof format === 'function' ? format(prevFormat) : format;
      localStorage.setItem('hourFormat', newFormat);
      return newFormat;
    });
  }, []);

  const value = useMemo(() => ({
    wifiEnabled, setWifiEnabled,
    bluetoothEnabled, setBluetoothEnabled,
    mobileDataEnabled, setMobileDataEnabled,
    brightness, setBrightness,
    volume, setVolume,
    hourFormat,
    setHourFormat: handleSetHourFormat
  }), [
    wifiEnabled,
    bluetoothEnabled,
    mobileDataEnabled,
    brightness,
    volume,
    hourFormat,
    handleSetHourFormat,
  ]);

  return (
    <SystemStateContext.Provider value={value}>
      {children}
    </SystemStateContext.Provider>
  );
};

export const useSystemState = () => {
  const context = useContext(SystemStateContext);
  if (context === undefined) {
    throw new Error('useSystemState must be used within a SystemStateProvider');
  }
  return context;
};
