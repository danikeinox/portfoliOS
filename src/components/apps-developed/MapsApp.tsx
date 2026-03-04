'use client';
import dynamic from 'next/dynamic';

const Maps = dynamic(() => import('@/components/apps/Maps'), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-white" />,
});

const MapsApp = () => {
    return (
        <div className="text-black bg-white h-full w-full flex flex-col pt-10">
            <Maps />
        </div>
    );
};

export default MapsApp;
