'use client';
import Clock from "@/components/apps/Clock";

const ClockApp = () => {
    return (
       <div className="bg-white dark:bg-black text-black dark:text-white h-full w-full flex flex-col pt-10">
         <Clock />
       </div>
    );
};

export default ClockApp;
