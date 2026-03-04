'use client';
import Photos from "@/components/apps/Photos";

const PhotosApp = () => {
    return (
       <div className="text-black dark:text-white bg-white dark:bg-black h-full w-full flex flex-col pt-10">
         <Photos />
       </div>
    );
};

export default PhotosApp;
