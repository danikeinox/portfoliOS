'use client';
import Youtube from "@/components/apps/Youtube";

const YoutubeApp = () => {
    return (
       <div className="bg-white dark:bg-[#0f0f0f] h-full w-full text-black dark:text-white flex flex-col pt-10">
         <Youtube />
       </div>
    );
};

export default YoutubeApp;
