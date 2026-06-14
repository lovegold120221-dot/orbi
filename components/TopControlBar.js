import React from 'react';

// Helper component for the button styling
const IconButton = ({ children, title, isSecondary = true }) => (
    <button 
        title={title} 
        className={`flex items-center p-2 transition duration-150 ${isSecondary ? 'text-gray-400 hover:text-indigo-300' : 'text-white'}`}
    >
        {children}
    </button>
);

const TopControlBar = ({ isMobileView, onTranslateClick }) => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-800 sticky top-0 z-20 bg-gray-900/95 backdrop-blur-[1px]">
      {/* Left Side: Security Shield and Original Sound */}
      <div className={`flex items-center space-x-3 ${isMobileView ? 'hidden sm:flex' : ''}`}>
        <i className="fa-solid fa-shield-halved text-green" style={{ fontSize: '20px' }}></i>
        <button title="Original Sound" className='text-gray-400 hover:text-indigo-300'>
            <div className="flex items-center space-x-1">
                <span>Original Sound:</span>
                 <span className={/* Conditional color logic goes here */} style={{color: '#aaa'}}>Off</span> 
            </div>
        </button>
      </div>

      {/* Center Title (Mobile Only) */}
      {!isMobileView && <div />} {/* Spacer for desktop layout */}

      {/* Right Side Controls */}
      <div className="flex items-center space-x-6">
        
         {/* Mobile View: Orbit Dropdown Button */}
         {isMobileView && (
            <button 
                className="text-sm flex items-center gap-1 bg-[#2a2a2a] border border-[#333] text-white py-2 px-4 rounded cursor-pointer hover:bg-[#3a3a3a]">
                <i className="fa-solid fa-shield-halved text-green"></i> Orbit ▾
            </button>
        )}

        {/* Desktop View: Translation Status and View Button */}
        {!isMobileView && (
            <>
                <span className='text-gray-400'>Translation: English · Orus</span>
                <span className='text-gray-500'>|</span>
                <button className="hover:underline text-indigo-300">View</button>
            </>
        )}

        {/* Mobile View: Leave Button */}
        {isMobileView && (
            <button title="Leave Call" className='bg-[#d93838] hover:bg-[#b72b2b] text-white py-2 px-5 rounded font-semibold'>
                Leave
            </button>
        )}

      </div>
    </div>
  );
};

export default TopControlBar;
