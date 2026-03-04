import Image from 'next/image';
import Link from 'next/link';
import { useI18n } from '@/hooks/use-i18n';
import type { WidgetSize } from '@/hooks/use-home-screen';

const ProfileWidget = ({ size = '2x2' }: { size?: WidgetSize }) => {
    const { t } = useI18n();
    return (
        <div className="w-full h-full bg-white/25 backdrop-blur-xl rounded-2xl md:rounded-3xl p-2.5 text-gray-800 flex flex-col justify-between">
            <div className="flex items-center gap-2">
                <Image src="https://picsum.photos/seed/profile/80/80" width={28} height={28} alt={t('widget.profile.alt')} className="rounded-full border-2 border-white/50" data-ai-hint="male portrait" />
                <div className="text-black">
                    <p className="text-[10px]/[12px] font-light">{t('widget.profile.greeting')}</p>
                    <h3 className="text-sm font-bold leading-tight">{t('settings.profile.name')}</h3>
                </div>
            </div>
            <div>
                <p className="text-[10px]/[12px] font-medium text-black">{t('widget.profile.bio')}</p>
                <p className="text-[9px]/[11px] text-gray-800 mt-0.5">{t('widget.profile.location')}</p>
            </div>
            <div className="grid grid-cols-2 gap-1 mt-1">
                <Link href="/app/about" className="text-center bg-gray-500/30 hover:bg-gray-500/50 text-white font-semibold py-0.5 rounded-md text-[10px] transition-colors">
                    {t('widget.profile.about')}
                </Link>
                <Link href="/app/portfolio" className="text-center bg-gray-500/30 hover:bg-gray-500/50 text-white font-semibold py-0.5 rounded-md text-[10px] transition-colors">
                    {t('widget.profile.portfolio')}
                </Link>
            </div>
        </div>
    )
}

export default ProfileWidget;
