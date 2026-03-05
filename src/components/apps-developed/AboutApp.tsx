'use client';
import Safari from '../apps/Safari';
import AboutPage from '../apps/AboutPage';

const AboutApp = () => {
    return (
        <div className="flex-1 w-full min-h-0 flex flex-col overflow-hidden bg-transparent text-black dark:text-white py-10">
            <Safari initialDisplayUrl="about://daniel-cabrera">
                <AboutPage />
            </Safari>
        </div>
    );
};

export default AboutApp;
