import React from 'react';
// Props now include an onButtonClick function to simulate interactivity
const BottomToolbar = ({ isDesktop }) => {

  // Handler that simulates running the meeting app logic
  const handleButtonClick = (action) => {
    console.log(`[Meeting Logic]: ${action} button clicked.`);
    // In a real app, this would trigger state changes (e.g., setMicMuted(true)) or open a modal.
    alert(`Attempting to execute: ${action}`); 
  };


  return (
    <footer className={`flex w-full ${isDesktop ? 'border-t border-gray-800' : 'fixed bottom-0 left-0 right-0 z-10'} bg-[#1a1a1a] text-white`}>
      
        {/* SECTION LEFT (Desktop Only) - Expanded Toolset */}
        <div className={`hidden lg:flex flex-col items-center justify-center w-[250px] p-4 ${!isDesktop ? 'hidden' : ''}`}>
            <h3 className="text-gray-400 mb-4 text-sm uppercase tracking-wider">Meeting Controls</h3>

             {/* Unmute/Mic */}
             <div className='mb-4'>
                <button 
                    className="flex flex-col items-center w-full p-2 hover:bg-gray-700 rounded-lg transition duration-150"
                    onClick={() => handleButtonClick('Unmute')}
                >
                    <i className="fa-solid fa-microphone-slash text-xl mb-1"></i>
                    <span className='text-sm'>Mic</span>
                </button>
            </div>

             {/* Video */}
              <div className='mb-4'>
                <button 
                    className="flex flex-col items-center w-full p-2 hover:bg-gray-700 rounded-lg transition duration-150"
                    onClick={() => handleButtonClick('Video')}
                >
                    <i className="fa-solid fa-video text-xl mb-1"></i>
                    <span className='text-sm'>Video</span>
                </button>
            </div>

             {/* Security */}
              <div className='mb-4'>
                <button 
                    className="flex flex-col items-center w-full p-2 hover:bg-gray-700 rounded-lg transition duration-150"
                    onClick={() => handleButtonClick('Security')}
                >
                    <i className="fa-solid fa-shield-halved text-xl mb-1"></i>
                    <span className='text-sm'>Security</span>
                </button>
            </div>

             {/* Participants */}
              <div className='mb-4'>
                <button 
                    className="flex flex-col items-center w-full p-2 hover:bg-gray-700 rounded-lg transition duration-150"
                    onClick={() => handleButtonClick('Participants')}
                >
                     <i className="fa-solid fa-user-group text-xl mb-1"></i>
                    <span className='text-sm'>People</span>
                </button>
              </div>

             {/* Chat */}
              <div className='mb-4'>
                <button 
                    className="flex flex-col items-center w-full p-2 hover:bg-gray-700 rounded-lg transition duration-150"
                    onClick={() => handleButtonClick('Chat')}
                >
                    <i className="fa-solid fa-comment text-xl mb-1"></i>
                    <span className='text-sm'>Chat</span>
                </button>
              </div>

            {/* Share Screen */}
            <div className='mb-4'>
                 <button 
                    className="flex flex-col items-center w-full p-2 hover:bg-gray-700 rounded-lg transition duration-150"
                    onClick={() => handleButtonClick('Share')}
                >
                     <div className='text-green text-xl mb-1'><i className="fa-solid fa-arrow-up"></i></div>
                    <span className='text-sm'>Share Screen</span>
                </button>
            </div>

             {/* Orbit Special Feature (Translate) */}
              <div className='mb-4'>
                 <button 
                    className="flex flex-col items-center w-full p-2 bg-purple-800 hover:bg-purple-700 rounded-lg transition duration-150"
                    onClick={() => handleButtonClick('Translate')}>
                     <i className="fa-solid fa-globe text-xl mb-1"></i>
                    <span className='text-sm'>Translate</span>
                </button>
            </div>

             {/* Additional Features */}
              <div className='flex justify-center space-x-4 mt-6 border-t border-gray-700 pt-4'>
                   <button className="control-btn" title="Polling"><i className="fa-regular fa-circle-dot text-xl"></i><span className='text-sm ml-1'>Poll</span></button>
                   <button className="control-btn" title="Record"><i className="fa-solid fa-calendar-check text-xl"></i><span className='text-sm ml-1'>Record</span></button>
                </div>

        </div >


        {/* SECTION CENTER (Shared Controls) - This area is now mostly handled by the left panel */}
        <div className={`flex ${isDesktop ? 'hidden' : ''} justify-center`}>
             {/* Mobile Only Visible Buttons (Unmute/Video) are structured above in section-left now, simplifying this block. */}
        </div>


        {/* SECTION RIGHT (Leave Button - Desktop only, or fixed position on mobile top bar for leave button) */}
         <div className={`hidden lg:flex flex-col items-center justify-end w-[200px] p-4 ${!isDesktop ? 'hidden' : ''}`}>
            <button title="Leave Call" className='leave-btn'>Leave</button>
        </div>

    </footer >
  );
};

export default BottomToolbar;
