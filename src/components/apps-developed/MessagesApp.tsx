'use client';
import Messages from "@/components/apps/Messages";

const MessagesApp = () => {
    return (
       <div className="text-black dark:text-white bg-transparent h-full w-full flex flex-col pt-10">
         <div className="flex-1 overflow-y-auto">
           <Messages />
         </div>
       </div>
    );
};

export default MessagesApp;
