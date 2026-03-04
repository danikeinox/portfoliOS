'use client';

import { useEffect, useState } from 'react';
import { Wifi, BatteryFull, Signal, SignalZero, WifiOff, Zap, BatteryCharging } from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';
import { useSystemState } from '@/hooks/use-system-state';

interface StatusBarProps {
    onToggleControlCenter: () => void;
    onToggleNotificationCenter: () => void;
}

const StatusBar = ({ onToggleControlCenter, onToggleNotificationCenter }: StatusBarProps) => {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  const { locale } = useI18n();
  const { wifiEnabled, mobileDataEnabled, hourFormat } = useSystemState();
  
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [isCharging, setIsCharging] = useState(false);
  const [connectionType, setConnectionType] = useState<string | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const checkStandalone = () => {
        return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    };
    setIsStandalone(checkStandalone());
  }, []);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit', hour12: hourFormat === '12h' }).replace(' ', ''));
      setDate(now.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short'}));
    };

    updateClock();
    const timerId = setInterval(updateClock, 1000);

    return () => {
        clearInterval(timerId);
    }
  }, [locale, hourFormat]);

  useEffect(() => {
    let batteryManager: any = null;

    const updateBatteryStatus = (battery: any) => {
        const level = Math.round(battery.level * 100);
        const charging = battery.charging;
        
        setBatteryLevel(level);
        setIsCharging(charging);
    };

    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        batteryManager = battery;
        
        if (battery.level === 1 && battery.charging) {
            setBatteryLevel(100);
            setIsCharging(false); 
        } else {
             updateBatteryStatus(battery);
        }

        const handleChange = () => updateBatteryStatus(batteryManager);

        batteryManager.addEventListener('levelchange', handleChange);
        batteryManager.addEventListener('chargingchange', handleChange);
      }).catch((e: any) => {
        console.warn("Battery Status API not supported or failed.", e);
        setBatteryLevel(100);
        setIsCharging(false);
      });
    }

    let connectionManager: any = null;

    const updateConnectionStatus = () => {
        const conn = (navigator as any).connection;
        if (conn && conn.type) { 
            setConnectionType(conn.type);
        } else {
            setConnectionType(null); 
        }
    };

    if ('connection' in navigator) {
        connectionManager = (navigator as any).connection;
        updateConnectionStatus(); 
        
        if(connectionManager) {
           connectionManager.addEventListener('change', updateConnectionStatus);
        }
    }
    
    return () => {
      if (batteryManager) {
        const handleChange = () => updateBatteryStatus(batteryManager); 
        batteryManager.removeEventListener('levelchange', handleChange);
        batteryManager.removeEventListener('chargingchange', handleChange);
      }
      if (connectionManager) {
        connectionManager.removeEventListener('change', updateConnectionStatus);
      }
    };
  }, []);

  const renderNetworkIcons = () => {
    if (connectionType) {
        switch (connectionType) {
            case 'wifi':
                return <Wifi size={18} />;
            case 'cellular':
                return <Signal size={18} />;
            default: 
                return null;
        }
    }
    
    return (
        <>
            {mobileDataEnabled ? <Signal size={18} /> : <SignalZero size={18} />}
            {wifiEnabled ? <Wifi size={18} /> : <WifiOff size={18} />}
        </>
    );
  }

  if (isStandalone) {
    return (
        <div className="w-full h-[env(safe-area-inset-top,2.5rem)] flex absolute top-0 left-0 z-50">
            <div className="flex-1 h-full cursor-pointer" onClick={onToggleNotificationCenter} />
            <div className="flex-1 h-full cursor-pointer" onClick={onToggleControlCenter} />
        </div>
    );
  }

  return (
    <div className="w-full h-10 px-6 flex justify-between items-center text-sm font-semibold text-white drop-shadow-md z-20 relative pt-[env(safe-area-inset-top,0px)]">
      <div className="flex-1 text-left font-bold relative">
        <div className="absolute -inset-y-2 -left-6 w-24 cursor-pointer" onClick={onToggleNotificationCenter} />
        <span>{time}</span>
      </div>
      <div className="hidden md:block">
        <span>{date.replace('.', '')}</span>
      </div>
      <div className="flex-1 flex justify-end items-center gap-2 relative">
         <div className="absolute -inset-y-2 -right-6 w-32 cursor-pointer" onClick={onToggleControlCenter} />
        {renderNetworkIcons()}
        <span className='flex items-center gap-1'>
            {isCharging && <Zap size={12} className="text-yellow-400" />}
            {batteryLevel}%
        </span>
        {isCharging ? <BatteryCharging size={20} /> : <BatteryFull size={20} />}
      </div>
    </div>
  );
};

export default StatusBar;
