'use client';
import Blog from "@/components/apps/Blog";

const BlogApp = () => {
  return (
    <div className="bg-[#F2F2F7] dark:bg-black h-full w-full text-black dark:text-white flex flex-col pt-10">
      <div className="flex-1 overflow-y-auto">
        <Blog />
      </div>
    </div>
  );
};

export default BlogApp;
