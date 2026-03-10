'use client';
import Camera from "@/components/apps/Camera";

const CameraApp = () => {
  // This wrapper ensures the AppFrame handles theming correctly (dark mode)
  // and provides a container for the app's content.
  return (
    <div className="bg-transparent h-full w-full text-black dark:text-white flex flex-col pt-10">
      <Camera />
    </div>
  );
};

export default CameraApp;
