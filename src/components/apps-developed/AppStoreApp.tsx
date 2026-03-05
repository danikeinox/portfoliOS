'use client';
import AppStore from "@/components/apps/AppStore";

const AppStoreApp = () => {
    return (
        <div className="bg-transparent h-full w-full text-black dark:text-white flex flex-col pt-10">
            <AppStore />
        </div>
    );
};

export default AppStoreApp;
