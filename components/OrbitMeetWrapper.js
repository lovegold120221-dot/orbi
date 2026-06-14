import React from 'react';
import TopControlBar from './TopControlBar';
import BottomToolbar from './BottomToolbar';
import ActiveSpeakerView from './ActiveSpeakerView';
// Note: MobileMenu and ParticipantList are placeholders and remain outside this scope for brevity, 
// but their structural integration points are noted below.

// This component acts as the main screen container, handling both desktop and mobile layout rules.
const OrbitMeetWrapper = ({ isMobileView }) => {
  return (
    <div className="flex flex-col h-[calc(100vh)]"> {/* Use 100vh for full screen simulation */}
        {/* 1. Top Meeting Header Bar - Handles responsiveness */}
        <TopControlBar isMobileView={isMobileView} />

        {/* Main Content Area (Video Canvas + Side Panels) */}
        <main className="flex flex-1 overflow-hidden pb-[90px]"> {/* Adjusted padding based on bottom toolbar height */}
            
            {/* Video/Main Stage - Takes most space and dictates the main content flow */}
             <div className="relative flex-grow min-h-0">
                <ActiveSpeakerView isDesktop={!isMobileView} /> 

                {/* Side Panel (Participants List) - Visible only on desktop, positioned absolutely over the video container. */}
                {!isMobileView && (
                    <div className="absolute right-0 top-[120px] bottom-0 lg:static lg:right-4 lg:top-auto lg:bottom-0 w-80 border-l border-gray-800/50 p-4 overflow-y-auto bg-gray-900/70 z-10">
                        {/* Placeholder for Participant list */}
                         <h3 className="font-semibold text-gray-200 border-b border-gray-700 pb-2 mb-4">Participants</h3>
                         <div className='space-y-3'>
                            <div className="flex items-center p-2 bg-gray-800/70 rounded-lg cursor-pointer hover:bg-indigo-900/50 transition duration-150 border border-transparent hover:border-indigo-600">
                                <div className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center text-sm font-bold mr-3">A</div>
                                <div><p className="font-semibold text-base">Alice Smith</p><p className="text-xs text-gray-400">Speaker | Online</p></div>
                            </div>
                             <div className="flex items-center p-2 bg-gray-800/70 rounded-lg cursor-pointer hover:bg-indigo-900/50 transition duration-150 border border-transparent hover:border-indigo-600">
                                <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-content-center text-sm font-bold mr-3">B</div>
                                <div><p className="font-semibold text-base">Bob Johnson</p><p className="text-xs text-gray-400">Participant | Muted</p></div>
                            </div>
                        </div>
                    </div>
                )}

            </div>

        </main>

        {/* 3. Bottom Meeting Toolbar (Fixed on mobile, part of flow on desktop) */}
        <div className={`relative z-10 ${isMobileView ? 'fixed bottom-0 left-0 right-0' : ''} transition-all duration-300`}>
             <BottomToolbar isDesktop={!isMobileView} />
        </div>

    </div >
  );
};

export default OrbitMeetWrapper;
