'use client';
import Testimonials from "@/components/apps/Testimonials";

const TestimonialsApp = () => {
    return (
       <div className="text-black dark:text-white bg-transparent h-full w-full flex flex-col pt-10">
         <div className="flex-1 overflow-y-auto">
           <Testimonials />
         </div>
       </div>
    );
};

export default TestimonialsApp;
