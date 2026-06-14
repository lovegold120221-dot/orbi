import React from 'react';

const MobileMenu = () => {
    const menuItems = [
        { name: "Translation", icon: "🌐", details: ["Target Language:", "English"] },
        { name: "Language Settings", icon: "🗣️", details: ["Voice:", "Orus (Female: Aoede)"] },
        { name: "Captions", icon: "📝", details: [] },
        { name: "Original Sound", icon: "🔉", details: ["Off/On Switch"] },
        { name: "Audio Source", icon: "<0xF0><0x9F><0x8E><0x9A>️", details: ["Auto / Participants / Shared Screen"] }
    ];

    return (
        <div className="w-full bg-gray-800 border-t border-gray-700 py-4 shadow-inner">
            <h3 className="text-xl font-semibold text-indigo-400 mb-3 px-5 pt-2">Orbit Menu</h3>
            
            {menuItems.map((item, index) => (
                <div key={index} className="px-5 py-3 border-b border-gray-700 last:border-b-0 cursor-pointer hover:bg-gray-700/50 transition duration-150">
                    <div className="flex justify-between items-center">
                        <span className='text-lg flex items-center'>
                            <span className='mr-3 text-xl'>{item.icon}</span> {item.name}
                        </span>
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                    <div className='mt-2 space-y-1 text-sm'>
                        {item.details.map((detail, i) => (
                            <p key={i} className='text-gray-400'>{detail}</p>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default MobileMenu;
