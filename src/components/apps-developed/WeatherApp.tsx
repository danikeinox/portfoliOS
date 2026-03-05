'use client';
import Weather from "@/components/apps/Weather";

const WeatherApp = () => {
    return (
        <div className="h-full w-full bg-transparent flex flex-col py-10">
            <Weather />
        </div>
    );
};

export default WeatherApp;
