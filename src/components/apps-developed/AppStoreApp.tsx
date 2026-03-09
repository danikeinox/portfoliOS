'use client';
import AppStore from "@/components/apps/AppStore";

const AppStoreApp = () => {
    return (
        <div className="bg-transparent h-full min-h-0 w-full text-black dark:text-white flex flex-col">
            <AppStore />
        </div>
    );
};

export default AppStoreApp;
