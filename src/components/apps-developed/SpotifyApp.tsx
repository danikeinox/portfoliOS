'use client';
import Spotify from "@/components/apps/Spotify";

const SpotifyApp = () => {
  // This wrapper ensures the AppFrame handles theming correctly (dark mode in this case)
  // and provides a container for the app's content.
  return (
    <div className="bg-black h-full w-full text-white flex flex-col pt-10">
      <Spotify />
    </div>
  );
};

export default SpotifyApp;
