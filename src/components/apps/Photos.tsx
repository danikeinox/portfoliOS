'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Library, Users, Album, Search, Trash2 } from 'lucide-react';
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
import { useI18n } from '@/hooks/use-i18n';
import { useNotifications } from '@/hooks/use-notifications';
import { Button } from '../ui/button';


interface Photo {
    id: number;
    url: string;
}

const Photos = () => {
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
    const { t } = useI18n();
    const { clearNotificationsByAppId } = useNotifications();

    useEffect(() => {
        clearNotificationsByAppId('photos');
        const savedPhotos = JSON.parse(localStorage.getItem('photos') || '[]');
        setPhotos(savedPhotos);
    }, [clearNotificationsByAppId]);

    const deletePhoto = (photoId: number) => {
        const updatedPhotos = photos.filter(p => p.id !== photoId);
        setPhotos(updatedPhotos);
        localStorage.setItem('photos', JSON.stringify(updatedPhotos));
        setSelectedPhoto(null);
    }

    if (selectedPhoto) {
        return (
            <div className="w-full h-full flex flex-col bg-white dark:bg-black">
                <div className="flex justify-between items-center p-2 flex-shrink-0">
                    <Button variant="ghost" onClick={() => setSelectedPhoto(null)} className="text-system-blue hover:text-system-blue">{t('back')}</Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-system-blue hover:text-system-blue/80">
                                <Trash2 size={20} />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-neutral-800/80 backdrop-blur-xl border-none rounded-2xl text-white w-[270px]">
                            <AlertDialogHeader className="items-center space-y-1">
                                <AlertDialogTitle className="font-semibold">{t('photos.deleteTitle')}</AlertDialogTitle>
                                <AlertDialogDescription className="text-sm text-center">
                                    {t('photos.deleteConfirm')}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="flex flex-col -mx-6 -mb-6 mt-4">
                                <AlertDialogAction onClick={() => deletePhoto(selectedPhoto.id)} className="w-full rounded-none justify-center bg-transparent text-red-500 hover:bg-neutral-700/70 border-t border-neutral-500/30 h-11 text-base font-normal">
                                    {t('delete')}
                                </AlertDialogAction>
                                <AlertDialogCancel className="w-full rounded-none justify-center bg-transparent text-system-blue hover:bg-neutral-700/70 border-t border-neutral-500/30 mt-0 h-11 text-base font-semibold">
                                    {t('cancel')}
                                </AlertDialogCancel>
                            </div>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
                <div className="relative w-full flex-1">
                    <Image src={selectedPhoto.url} alt="Selected photo" fill sizes="100vw" className="object-contain" />
                </div>
            </div>
        )
    }

    return (
        <div className="w-full h-full bg-white dark:bg-black text-black dark:text-white flex flex-col">
            <div className="flex-1 overflow-y-auto pb-24">
                <div className="p-4">
                    <h1 className="text-3xl font-bold mb-4">{t('photos.title')}</h1>
                    {photos.length > 0 ? (
                        <div className="grid grid-cols-4 gap-1">
                            {photos.map((photo) => (
                                <div key={photo.id} className="aspect-square relative cursor-pointer" onClick={() => setSelectedPhoto(photo)}>
                                    <Image src={photo.url} alt="Saved photo" fill sizes="25vw" className="rounded-sm object-cover" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-neutral-500 py-16">
                            <p>{t('photos.noPhotos')}</p>
                            <p className="text-sm mt-2">{t('photos.noPhotosHint')}</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="bottom-0 left-0 right-0 h-20 bg-neutral-100/80 dark:bg-neutral-900/80 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 flex justify-around items-center pt-1 pb-[env(safe-area-inset-bottom)]">
                <button className="flex flex-col items-center gap-1 text-blue-500 text-xs"><Library /> <span>{t('photos.library')}</span></button>
                <button className="flex flex-col items-center gap-1 text-neutral-500 dark:text-neutral-400 text-xs"><Users /> <span>{t('photos.forYou')}</span></button>
                <button className="flex flex-col items-center gap-1 text-neutral-500 dark:text-neutral-400 text-xs"><Album /> <span>{t('photos.albums')}</span></button>
                <button className="flex flex-col items-center gap-1 text-neutral-500 dark:text-neutral-400 text-xs"><Search /> <span>{t('photos.search')}</span></button>
            </div>
        </div>
    );
};

export default Photos;
