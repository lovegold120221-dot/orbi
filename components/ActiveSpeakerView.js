import React from 'react';

// Component to display the single, primary active speaker video feed
const ActiveSpeakerVideo = ({ name = "Sara", speaking = true }) => {
  return (
    <div className="relative w-full h-[calc(100%-80px)] bg-black flex items-center justify-center shadow-xl rounded-t-xl overflow-hidden border-b border-gray-700">
      {/* High quality Unsplash placeholder approximating original visual */}
      <img 
        src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80" 
        alt="Video Feed"
        className="absolute inset-0 w-full h-full object-cover opacity-[0.9]" // Slightly dimmed for professionalism
      />

      {/* Speaker Name and Status Label */}
      <div className="name-badge absolute bottom-4 left-6 z-10">
          {name}
      </div>
    </div>
  );
};

// Component for the visible participant list (sidebar on desktop)
const ParticipantList = ({ participants }) => {
    return (
        <div className="space-y-3 pt-4 text-sm">
            <h3 className="font-semibold text-gray-200 border-b border-gray-700 pb-2">Participants</h3>
            {participants.map(p => (
                <div key={p.id} className="flex items-center p-2 bg-gray-800/70 rounded-lg cursor-pointer hover:bg-indigo-900/50 transition duration-150 border border-transparent hover:border-indigo-600">
                    {/* Avatar Placeholder */}
                    <div className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center text-sm font-bold mr-3">{p.initials}</div>
                    <div>
                        <p className="font-semibold text-base">{p.name}</p>
                        <p className="text-xs text-gray-400">Status: {p.status}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};


const ActiveSpeakerView = ({ isDesktop, activeParticipants }) => (
  <div className="w-full flex flex-col h-full min-h-[300px] relative">
      {/* Main Video Canvas: The video component */}
      <ActiveSpeakerVideo /> 

      {/* Floating Caption/Subtitle Area (Below main video on desktop view) */}
      {isDesktop && (
        <div className="p-4 bg-[#1a1a1a] border-t border-gray-700 flex items-center justify-between text-sm shadow-inner">
            <span className="text-lg font-medium text-indigo-300 mr-4">Captions:</span>
            <span className="text-xl text-white truncate max-w-[60%]">Sara is discussing the Q3 roadmap details.</span>
        </div>
      )}

      {/* Participant list container (only visible on desktop) */}
      {!isDesktop && <div />} {/* Placeholder for padding compensation */}
  </div>
);

export default ActiveSpeakerView;
