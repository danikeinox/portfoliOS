'use client';
import AppStore from "@/components/apps/AppStore";

const AppStoreApp = () => {
    return (
        <div className="text-black dark:text-white bg-transparent h-full w-full flex flex-col pt-10">
            <AppStore />
        </div>
    );
};

export default AppStoreApp;
