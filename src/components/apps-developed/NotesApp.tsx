'use client';
import Notes from "@/components/apps/Notes";

const NotesApp = () => {
    return (
       <div className="text-black dark:text-white bg-transparent h-full w-full flex flex-col pt-10">
         <div className="flex-1 min-h-0 flex flex-col">
           <Notes />
         </div>
       </div>
    );
};

export default NotesApp;
