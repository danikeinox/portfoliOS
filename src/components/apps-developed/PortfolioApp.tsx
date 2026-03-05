'use client';
import Portfolio from "@/components/apps/Portfolio";

const PortfolioApp = () => {
  return (
    <div className="bg-transparent dark:bg-black h-full w-full text-black dark:text-white flex flex-col pt-10">
      <div className="flex-1 overflow-y-auto">
        <Portfolio />
      </div>

    </div>
  );
};

export default PortfolioApp;
