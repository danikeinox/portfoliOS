'use client';
import Camera from "@/components/apps/Camera";

const CameraApp = () => {
    // This wrapper ensures the AppFrame handles theming correctly (dark mode)
    // and provides a container for the app's content.
    return (
       <div className="bg-black h-full w-full">
         <Camera />
       </div>
    );
};

export default CameraApp;
