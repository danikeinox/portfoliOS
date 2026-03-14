'use client';
import YoutubeReal from "@/components/apps/YoutubeReal";

const YoutubeApp = () => {
  return (
    <div className="bg-white dark:bg-[#0f0f0f] h-full w-full text-black dark:text-white flex flex-col pt-10">
      <YoutubeReal />
    </div>
  );
};

export default YoutubeApp;
