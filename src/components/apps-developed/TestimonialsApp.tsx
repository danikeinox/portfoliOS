'use client';
import Testimonials from "@/components/apps/Testimonials";

const TestimonialsApp = () => {
  return (
    <div className="bg-[#F2F2F7] dark:bg-black h-full w-full text-black dark:text-white flex flex-col pt-10">
      <div className="flex-1 overflow-y-auto">
        <Testimonials />
      </div>
    </div>
  );
};

export default TestimonialsApp;
