'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera as CameraIcon, Zap, SwitchCamera, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/hooks/use-i18n';
import { useNotifications } from '@/hooks/use-notifications';
import { cn } from '@/lib/utils';

const Camera = () => {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [mode, setMode] = useState('photo');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();
  const { t } = useI18n();
  const { addNotification } = useNotifications();

  const getCameraPermission = useCallback(async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
      streamRef.current = stream;
      setHasCameraPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: t('camera.permissionDenied'),
        description: t('camera.permissionDeniedDesc'),
      });
    }
  }, [facingMode, toast, t]);


  useEffect(() => {
    getCameraPermission();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [getCameraPermission]);

  const takePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) return;

    // Flip the image if it's the front camera
    if (facingMode === 'user') {
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
    }

    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg');
    
    const existingPhotos = JSON.parse(localStorage.getItem('photos') || '[]');
    existingPhotos.unshift({ id: Date.now(), url: dataUrl });
    localStorage.setItem('photos', JSON.stringify(existingPhotos));

    addNotification({
      appId: 'photos',
      title: t('app.photos'),
      message: t('camera.photoSaved'),
    })

    toast({
      title: t('camera.photoSaved'),
      description: t('camera.photoSavedDesc'),
    });
  };

  const toggleFacingMode = () => {
      setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  return (
    <div className="w-full h-full relative bg-black text-white flex flex-col">
      <video 
        ref={videoRef} 
        className={cn("w-full h-full object-cover transition-transform duration-500", facingMode === 'user' && "scale-x-[-1]")}
        autoPlay 
        muted 
        playsInline 
      />
      
      {hasCameraPermission === false && (
        <div className="absolute inset-0 flex items-center justify-center p-4 bg-black/50">
            <div className="flex flex-col items-center justify-center p-4 bg-neutral-900/80 backdrop-blur-md rounded-2xl text-center text-white">
                <AlertTriangle className="w-10 h-10 text-yellow-400 mb-2"/>
                <p className="font-semibold text-lg">{t('camera.permissionRequired')}</p>
                <p className="text-sm text-neutral-300 mt-1 max-w-xs">{t('camera.permissionRequiredDesc')}</p>
            </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 pb-6 pt-12 px-2 flex flex-col items-center justify-end bg-gradient-to-t from-black/70 via-black/50 to-transparent">
        <div className="flex items-center justify-center gap-8 text-sm font-medium mb-4">
          <button onClick={() => setMode('photo')} className={cn('transition-colors', mode === 'photo' ? 'text-yellow-400 font-bold' : 'text-white')}>{t('camera.photo')}</button>
          <button onClick={() => setMode('video')} className={cn('transition-colors', mode === 'video' ? 'text-yellow-400 font-bold' : 'text-white')}>{t('camera.video')}</button>
        </div>
        <div className="w-full flex items-center justify-around px-4">
          <button className="text-white/80 p-2 bg-white/10 rounded-full"><Zap size={24} /></button>
          <button
            onClick={takePhoto}
            disabled={!hasCameraPermission}
            className="w-16 h-16 rounded-full bg-white flex items-center justify-center disabled:opacity-50 ring-4 ring-black"
            aria-label={t('camera.takePhoto')}
          >
            {mode === 'photo' ? (
                <div className="w-14 h-14 rounded-full bg-white" />
            ): (
                <div className="w-8 h-8 rounded-full bg-red-500" />
            )}
          </button>
          <button onClick={toggleFacingMode} className="text-white/80 p-2 bg-white/10 rounded-full" aria-label={t('camera.flip')}>
            <SwitchCamera size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Camera;