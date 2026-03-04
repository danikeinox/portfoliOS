'use client';
import Calendar from "@/components/apps/Calendar";

const CalendarApp = () => {
    // This wrapper ensures the AppFrame handles theming correctly
    // and provides a container for the app's content.
    return (
       <div className="bg-white h-full w-full text-black flex flex-col pt-10">
         <Calendar />
       </div>
    );
};

export default CalendarApp;
