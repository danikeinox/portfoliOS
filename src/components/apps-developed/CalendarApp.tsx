'use client';
import Calendar from "@/components/apps/Calendar";

const CalendarApp = () => {
  // This wrapper ensures the AppFrame handles theming correctly
  // and provides a container for the app's content.
  return (
    <div className="bg-[#F2F2F7] dark:bg-[#1C1C1E] h-full w-full text-black dark:text-white flex flex-col pt-10">
      <Calendar />
    </div>
  );
};

export default CalendarApp;
