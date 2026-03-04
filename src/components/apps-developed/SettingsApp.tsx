'use client';
import Settings from "@/components/apps/Settings";

const SettingsApp = () => {
    return (
        <div className="w-full h-full bg-neutral-900 text-white flex flex-col pt-10">
            <div className="flex-1 overflow-y-auto">
                <Settings />
            </div>
        </div>
    );
};

export default SettingsApp;
