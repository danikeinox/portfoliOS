'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useDrag } from '@use-gesture/react';
import { useSpring, animated } from '@react-spring/web';
import { cn } from '@/lib/utils';
import { useI18n } from '@/hooks/use-i18n';
import { useSystemState } from '@/hooks/use-system-state';

// 1. Añadimos forceTheme a las props
const AppFrame = ({ children, appName, forceTheme, homeBarBackgroundClass, frameBgClass }: { children: React.ReactNode, appName?: string, forceTheme?: 'light' | 'dark', homeBarBackgroundClass?: string, frameBgClass?: string }) => {
    const router = useRouter();
    const [time, setTime] = useState('');
    const [isGesturing, setIsGesturing] = useState(false);
    const [isPwaStandalone, setIsPwaStandalone] = useState(false);
    const { locale } = useI18n();
    const { hourFormat } = useSystemState();

    const [{ y, scale, bgOpacity }, api] = useSpring(() => ({
        from: { y: typeof window !== 'undefined' ? window.innerHeight : 1000, scale: 0.9, bgOpacity: 0 },
        config: { tension: 320, friction: 30 },
    }));

    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            setTime(now.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit', hour12: hourFormat === '12h' }).replace(' ', ''));
        };

        updateClock();
        const timerId = setInterval(updateClock, 1000);

        api.start({ y: 0, scale: 1, bgOpacity: 1 });
        document.body.style.overflow = 'hidden';

        return () => {
            clearInterval(timerId);
            document.body.style.overflow = '';
        };
    }, [api, locale, hourFormat]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const standaloneByMedia = window.matchMedia('(display-mode: standalone)').matches;
        const standaloneByNavigator = Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
        const standaloneByReferrer = document.referrer.startsWith('android-app://');

        setIsPwaStandalone(standaloneByMedia || standaloneByNavigator || standaloneByReferrer);
    }, []);

    const closeApp = (velocity = 0) => {
        api.start({
            y: window.innerHeight, scale: 0.9, bgOpacity: 0,
            config: { tension: 350, friction: 35, velocity },
            onRest: (result) => { if (result.finished) router.back(); },
        });
    };

    const bindCloseGesture = useDrag(
        ({ last, down, movement: [, my], velocity: [, vy] }) => {
            setIsGesturing(down);
            if (my > 0) api.start({ y: my, immediate: true });
            if (last) {
                if (my > window.innerHeight / 4 || vy > 0.5) closeApp(vy);
                else api.start({ y: 0, scale: 1, config: { tension: 400, friction: 35 } });
            } else {
                api.start({ y: my, immediate: true });
            }
        },
        { from: () => [0, y.get()] }
    );

    // 2. Lógica de colores según el tema forzado
    const statusBarTextColor = forceTheme === 'dark' ? 'text-white' : forceTheme === 'light' ? 'text-black' : 'text-black dark:text-white';
    const homeBarColor = forceTheme === 'dark' ? 'bg-white' : forceTheme === 'light' ? 'bg-black' : 'bg-black dark:bg-white';

    return (
        <animated.div style={{ opacity: bgOpacity }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50">
            <animated.div
                style={{ y, scale }}
                className={cn(
                    "w-full h-full flex flex-col will-change-transform shadow-2xl rounded-t-3xl overflow-hidden relative",
                    frameBgClass ? frameBgClass : "bg-[#F2F2F7] dark:bg-[#1C1C1E]"
                )}
            >
                {/* Status Bar */}
                <div className={cn(
                    "absolute inset-x-0 h-10 px-4 flex justify-between items-center text-sm font-semibold z-50 pointer-events-none transition-colors top-[env(safe-area-inset-top)]",
                    isPwaStandalone && 'opacity-0',
                    statusBarTextColor
                )}>
                    <span className="w-1/3 text-left">{time}</span>
                    <span className="w-1/3 text-center font-bold truncate">{appName}</span>
                    <div className="w-1/3"></div>
                </div>

                {/* App Content */}
                <main className="flex-1 w-full min-h-0 relative overflow-hidden flex flex-col pt-[env(safe-area-inset-top)]">
                    {children}
                </main>

                <div
                    className={cn(
                        "absolute bottom-0 inset-x-0 h-[calc(2.5rem+env(safe-area-inset-bottom))] z-40 pointer-events-none",
                        homeBarBackgroundClass
                    )}
                />

                {/* Home Bar */}
                <div
                    {...bindCloseGesture()}
                    className="absolute bottom-0 inset-x-0 h-10 z-50 cursor-grab flex justify-center items-center pointer-events-auto"
                    style={{ touchAction: 'pan-y' }}
                >
                    <div className={cn(
                        "w-32 h-1.5 rounded-full transition-all duration-200 mb-2",
                        homeBarColor,
                        isGesturing ? "scale-90 opacity-80" : "scale-100 opacity-100"
                    )} />
                </div>
            </animated.div>
        </animated.div>
    );
};

export default AppFrame;
