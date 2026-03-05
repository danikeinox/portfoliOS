'use client';
import News from "@/components/apps/News";

// This component can no longer be async due to the use of the `useI18n` hook.
const NewsApp = () => {
    return (
        <div className="bg-transparent h-full w-full text-black dark:text-white flex flex-col pt-10">
            <News />
        </div>
    );
};

export default NewsApp;
