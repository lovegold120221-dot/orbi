import React from 'react';
import TopControlBar from './TopControlBar';
import BottomToolbar from './BottomToolbar';

const OrbitMeetingLayout = ({ children }) => {
  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white antialiased">
      {/* 1. Top Meeting Header Bar */}
      <header className="flex justify-between items-center p-4 border-b border-gray-800 shadow-lg sticky top-0 z-20 bg-gray-900/95 backdrop-blur-[1px]">
        {/* Left: App Name (e.g., Orbit Meeting) */}
        <div className="text-xl font-bold text-indigo-400">Orbit Meeting</div>

        {/* Center: Placeholder for meeting title / status info */}
        <div className="text-gray-300 text-sm max-w-lg mx-8">
          Meeting Title Placeholder (e.g., Q3 Planning Sync)
        </div>

        {/* Right: View/Settings Control Strip */}
        <TopControlBar />
      </header>

      {/* 2. Main Content Area (Video Canvas + Side Panels) */}
      <main className="flex flex-1 overflow-hidden pt-[64px]"> {/* Adjust padding based on actual header height */}
        
        {/* Video/Main Stage - Takes most space */}
        <div className="relative flex-grow h-full max-w-5/3 min-w-0 pr-2">
            {children} 
            {/* Children will be the active video canvas, participant list, etc. */}
        </div>

        {/* Side Panel (Participants List / Chat) - Hidden by default in mobile view */}
        <div className="flex-shrink-0 w-[35%] max-w-xs hidden lg:block border-l border-gray-800/50 p-4 overflow-y-auto bg-gray-900/70">
            {/* Placeholder for Participant list or Chat sidebar */}
            <div className="text-sm text-gray-500 py-10">Participants Sidebar Placeholder (Zoom style)</div>
        </div>

      </main>

      {/* 3. Bottom Meeting Toolbar */}
      <BottomToolbar />
    </div>
  );
};

export default OrbitMeetingLayout;
