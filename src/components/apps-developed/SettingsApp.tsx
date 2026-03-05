'use client';
import Settings from "@/components/apps/Settings";

const SettingsApp = () => {
    return (
        <div className="w-full h-full bg-transparent dark:bg-black">
            <div className="w-full h-full bg-transparent dark:bg-[#1C1C1E]/80 flex flex-col pt-10">
                <div className="flex-1  overflow-y-auto">
                    <Settings />
                </div>
            </div>
        </div>
    );
};

export default SettingsApp;
