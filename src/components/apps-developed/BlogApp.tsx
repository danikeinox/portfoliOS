'use client';
import Blog from "@/components/apps/Blog";

const BlogApp = () => {
    return (
       <div className="text-black dark:text-white bg-transparent h-full w-full flex flex-col pt-10">
         <div className="flex-1 overflow-y-auto">
           <Blog />
         </div>
       </div>
    );
};

export default BlogApp;
