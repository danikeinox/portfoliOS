'use client';
import Safari from '../apps/Safari';
import AboutPage from '../apps/AboutPage';

const AboutApp = () => {
    return (
        <div className="flex-1 w-full min-h-0 flex flex-col overflow-hidden bg-neutral-200 pt-10">
            <Safari initialDisplayUrl="about://daniel-cabrera">
                <AboutPage />
            </Safari>
        </div>
    );
};

export default AboutApp;
