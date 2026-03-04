'use client';
import { useState } from 'react';
import { Phone as PhoneIcon, Star, Clock, User, Voicemail, Delete } from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';
import { cn } from '@/lib/utils';

const Phone = () => {
    const { t } = useI18n();
    const [number, setNumber] = useState('');

    const handleKeyPress = (key: string) => {
        setNumber(prev => prev + key);
    };

    const handleDelete = () => {
        setNumber(prev => prev.slice(0, -1));
    };

    const Key = ({ digit, letters }: { digit: string; letters?: string }) => (
        <button 
            onClick={() => handleKeyPress(digit)}
            className="flex flex-col items-center justify-center rounded-full bg-neutral-200/70 aspect-square w-20 h-20 active:bg-neutral-300 transition-colors"
        >
            <span className="text-4xl font-light">{digit}</span>
            {letters && <span className="text-xs font-bold tracking-widest -mt-1">{letters}</span>}
        </button>
    );
    
    return (
        <div className="w-full h-full flex flex-col bg-white text-black">
            <div className="flex-1 flex flex-col justify-end items-center p-4">
                <input
                    type="text"
                    readOnly
                    value={number}
                    className="bg-transparent border-none text-4xl text-center w-full mb-4 focus:outline-none"
                    placeholder={t('phone.keypad')}
                />
                <div className="grid grid-cols-3 gap-4">
                    <Key digit="1" />
                    <Key digit="2" letters="ABC" />
                    <Key digit="3" letters="DEF" />
                    <Key digit="4" letters="GHI" />
                    <Key digit="5" letters="JKL" />
                    <Key digit="6" letters="MNO" />
                    <Key digit="7" letters="PQRS" />
                    <Key digit="8" letters="TUV" />
                    <Key digit="9" letters="WXYZ" />
                    <Key digit="*" />
                    <Key digit="0" letters="+" />
                    <Key digit="#" />
                </div>
                <div className="flex justify-center items-center mt-4 w-full px-12">
                    <button className="flex flex-col items-center justify-center rounded-full bg-green-500 w-16 h-16 text-white active:bg-green-600 transition-colors">
                        <PhoneIcon size={28} />
                    </button>
                    {number.length > 0 && (
                        <button onClick={handleDelete} className="absolute right-8 text-neutral-500 p-4">
                           <Delete size={24} />
                        </button>
                    )}
                </div>
            </div>

            {/* Bottom Tab Bar */}
            <div className="flex-shrink-0 border-t border-neutral-200 bg-neutral-100/80 backdrop-blur-md">
                <div className="flex justify-around items-center h-20 pt-1 pb-[env(safe-area-inset-bottom)] text-neutral-500">
                    <button className="flex flex-col items-center gap-1 text-xs"><Star /> {t('phone.favorites')}</button>
                    <button className="flex flex-col items-center gap-1 text-xs"><Clock /> {t('phone.recents')}</button>
                    <button className="flex flex-col items-center gap-1 text-xs"><User /> {t('phone.contacts')}</button>
                    <button className={cn("flex flex-col items-center gap-1 text-xs", "text-blue-500")}><PhoneIcon /> {t('phone.keypad')}</button>
                    <button className="flex flex-col items-center gap-1 text-xs"><Voicemail /> {t('phone.voicemail')}</button>
                </div>
            </div>
        </div>
    );
};

export default Phone;
