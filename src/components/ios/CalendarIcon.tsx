'use client';
import { useI18n } from '@/hooks/use-i18n';

export default function CalendarIcon() {
  const { locale } = useI18n();
  const now = new Date();
  
  // Obtenemos el día abreviado y el número
  const dayName = now.toLocaleDateString(locale || 'es-ES', { weekday: 'short' }).toUpperCase().replace('.', '');
  const dayNumber = now.getDate();

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-white pt-1">
      <span className="text-[#ff3b30] font-bold text-[10px] leading-none mb-0.5 tracking-wider">
        {dayName}
      </span>
      <span className="text-black font-light text-[32px] leading-none -mt-1 tracking-tight">
        {dayNumber}
      </span>
    </div>
  );
}