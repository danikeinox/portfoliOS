'use client';
import Contact from "@/components/apps/Contact";

const ContactApp = () => {
    return (
       <div className="text-black dark:text-white bg-transparent h-full w-full flex flex-col pt-10">
         <div className="flex-1 overflow-y-auto">
           <Contact />
         </div>
       </div>
    );
};

export default ContactApp;
