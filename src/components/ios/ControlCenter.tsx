'use client';

import { useRef } from 'react';
import { useClickAway } from 'react-use';
import { cn } from '@/lib/utils';
import { Wifi, Bluetooth, Battery, Sun, Volume2, Moon, Signal } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { useSystemState } from '@/hooks/use-system-state';
import { useI18n } from '@/hooks/use-i18n';

interface ControlCenterProps {
  isVisible: boolean;
  onClose: () => void;
}

const ControlCenter = ({ isVisible, onClose }: ControlCenterProps) => {
  const ref = useRef(null);
  const { t } = useI18n();
  const {
    wifiEnabled, setWifiEnabled,
    bluetoothEnabled, setBluetoothEnabled,
    mobileDataEnabled, setMobileDataEnabled,
    brightness, setBrightness,
    volume, setVolume,
  } = useSystemState();

  useClickAway(ref, () => {
    if (isVisible) onClose();
  });

  return (
    <div
      className={cn(
        'fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300',
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
      onClick={onClose}
    >
      <div
        ref={ref}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'absolute top-4 right-4 w-80 max-w-[90vw] p-3 space-y-3 bg-neutral-800/60 backdrop-blur-2xl rounded-3xl text-white transition-all duration-300 origin-top-right',
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        )}
      >
        <div className="grid grid-cols-2 gap-3">
          {/* Network Controls */}
          <div className="bg-black/30 p-3 rounded-2xl flex flex-col gap-2 justify-around">
            <button onClick={() => setMobileDataEnabled(p => !p)} className="flex items-center gap-3">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-colors", mobileDataEnabled ? 'bg-green-500' : 'bg-neutral-500')}>
                <Signal size={18} />
              </div>
              <div>
                <p className="font-semibold text-sm text-left">{t('controlCenter.mobileData')}</p>
              </div>
            </button>
             <button onClick={() => setWifiEnabled(p => !p)} className="flex items-center gap-3">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-colors", wifiEnabled ? 'bg-blue-500' : 'bg-neutral-500')}>
                <Wifi size={18} />
              </div>
              <div>
                <p className="font-semibold text-sm text-left">{t('controlCenter.wifi')}</p>
                <p className="text-xs text-neutral-300 text-left">{wifiEnabled ? 'HomeNetwork' : t('controlCenter.off')}</p>
              </div>
            </button>
             <button onClick={() => setBluetoothEnabled(p => !p)} className="flex items-center gap-3">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-colors", bluetoothEnabled ? 'bg-blue-500' : 'bg-neutral-500')}>
                <Bluetooth size={18} />
              </div>
              <div>
                 <p className="font-semibold text-sm text-left">{t('controlCenter.bluetooth')}</p>
                 <p className="text-xs text-neutral-300 text-left">{bluetoothEnabled ? t('controlCenter.on') : t('controlCenter.off')}</p>
              </div>
            </button>
          </div>
          {/* Music Controls (Placeholder) */}
          <div className="bg-black/30 p-3 rounded-2xl flex flex-col justify-between aspect-square">
             <p className="font-semibold text-sm">{t('controlCenter.music')}</p>
             <p className="text-sm text-neutral-300 text-center">{t('controlCenter.notPlaying')}</p>
             <div/>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
            <div className="bg-black/30 col-span-1 aspect-square rounded-2xl flex items-center justify-center"><Moon/></div>
            <div className="bg-black/30 col-span-1 aspect-square rounded-2xl flex items-center justify-center"><Battery/></div>
        </div>

        <div className="bg-black/30 p-3 rounded-2xl flex items-center gap-3">
            <Sun size={20} className="opacity-80"/>
            <Slider value={[brightness]} onValueChange={(v) => setBrightness(v[0])} max={100} step={1} className="w-full" />
        </div>
         <div className="bg-black/30 p-3 rounded-2xl flex items-center gap-3">
            <Volume2 size={20} className="opacity-80"/>
            <Slider value={[volume]} onValueChange={(v) => setVolume(v[0])} max={100} step={1} className="w-full" />
        </div>
      </div>
    </div>
  );
};

export default ControlCenter;
