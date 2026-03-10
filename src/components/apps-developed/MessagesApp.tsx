'use client';
import Messages from "@/components/apps/Messages";

const MessagesApp = () => {
  return (
    <div className="bg-transparent h-full w-full text-black dark:text-white flex flex-col pt-10">
      <div className="flex-1 overflow-y-auto">
        <Messages />
      </div>
    </div>
  );
};

export default MessagesApp;
