'use client';
import News from "@/components/apps/News";
import { useI18n } from "@/hooks/use-i18n";

// This component can no longer be async due to the use of the `useI18n` hook.
const NewsApp = () => {
    const { locale } = useI18n();
    return (
        <div className="text-black dark:text-white bg-transparent h-full w-full flex flex-col pt-10">
            {/* @ts-expect-error Server Component */}
            <News locale={locale} />
        </div>
    );
};

export default NewsApp;
