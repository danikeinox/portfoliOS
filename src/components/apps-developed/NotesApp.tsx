'use client';
import Notes from "@/components/apps/Notes";

const NotesApp = () => {
  return (
    <div className="bg-transparent h-full w-full text-black dark:text-white flex flex-col py-10">
      <div className="flex-1 min-h-0 flex flex-col">
        <Notes />
      </div>
    </div>
  );
};

export default NotesApp;
