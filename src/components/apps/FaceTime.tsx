'use client';
import { useState, useRef, useEffect } from 'react';
import { Video, Mic, UserPlus, Link as LinkIcon, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/hooks/use-i18n';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Image from 'next/image';

const mockContacts = [
    { name: 'John Doe', avatar: 'https://picsum.photos/seed/contact1/100/100', aiHint: 'male portrait' },
    { name: 'Jane Smith', avatar: 'https://picsum.photos/seed/contact2/100/100', aiHint: 'female portrait' },
];

const FaceTime = () => {
    const { t } = useI18n();
    const { toast } = useToast();
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    
    useEffect(() => {
        const getCameraPermission = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
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
        };

        getCameraPermission();

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [toast, t]);

    return (
        <div className="w-full h-full bg-black text-white flex flex-col">
            <header className="p-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold">{t('app.facetime')}</h1>
            </header>
            
            <div className="flex-1 flex flex-col p-4 gap-6">
                <div className="relative w-full aspect-[4/3] bg-neutral-900 rounded-2xl overflow-hidden flex items-center justify-center">
                     <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                     {hasCameraPermission === false && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-black/50 text-center">
                            <AlertTriangle className="w-10 h-10 text-yellow-400 mb-2"/>
                            <p className="font-semibold">{t('camera.permissionRequired')}</p>
                            <p className="text-xs text-neutral-400">{t('camera.permissionRequiredDesc')}</p>
                        </div>
                    )}
                </div>

                <div className="flex justify-center gap-4">
                    <Button className="bg-neutral-800 hover:bg-neutral-700 rounded-full h-12">
                        <LinkIcon className="mr-2" /> {t('facetime.createLink')}
                    </Button>
                    <Button className="bg-green-600 hover:bg-green-500 rounded-full h-12">
                        <Video className="mr-2" /> {t('facetime.newFaceTime')}
                    </Button>
                </div>

                <div>
                    <h2 className="text-xl font-bold mb-2 text-neutral-300">{t('facetime.suggested')}</h2>
                    <div className="space-y-3">
                        {mockContacts.map(contact => (
                            <div key={contact.name} className="flex items-center gap-4 p-2 rounded-lg hover:bg-neutral-800 transition-colors">
                                <Image src={contact.avatar} alt={contact.name} width={48} height={48} className="rounded-full" data-ai-hint={contact.aiHint} />
                                <span className="font-semibold flex-1">{contact.name}</span>
                                <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white"><Mic size={20}/></Button>
                                <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white"><Video size={20}/></Button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FaceTime;
