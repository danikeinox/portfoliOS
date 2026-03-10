'use client';
import Contact from "@/components/apps/Contact";

const ContactApp = () => {
  return (
    <div className="bg-[#F2F2F7] dark:bg-black h-full w-full text-black dark:text-white flex flex-col pt-10">
      <div className="flex-1 overflow-y-hidden">
        <Contact />
      </div>
    </div>
  );
};

export default ContactApp;
