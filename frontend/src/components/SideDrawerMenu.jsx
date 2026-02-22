import React from 'react';

const SideDrawerMenu = ({ isOpen, onClose, userProfile, onNavigate }) => {
    // Add logic to close drawer when clicking outside
    const handleBackdropClick = (e) => {
        if (e.target.id === 'drawer-backdrop') {
            onClose();
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                id="drawer-backdrop"
                className={`fixed inset-0 bg-[#0a140a]/80 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={handleBackdropClick}
            ></div>

            {/* Drawer */}
            <div className={`fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-gradient-to-br from-[#0a140a] to-[#0f240f] shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-50 transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>

                {/* User Profile Header */}
                <div className="pt-12 pb-6 px-6 relative overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-[#13ec6d]/10 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/2"></div>

                    <button onClick={onClose} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors active:scale-95">
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>

                    <div className="flex items-center gap-4 relative z-10 mt-6">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#13ec6d] to-[#0a662e] p-[2px] shadow-[0_0_15px_rgba(19,236,109,0.3)]">
                            <div className="w-full h-full rounded-full bg-[#112411] overflow-hidden flex items-center justify-center">
                                {/* Use an image if user profile has one or fallback to icon */}
                                <span className="material-symbols-outlined text-[#8abf8a] text-3xl">person</span>
                            </div>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-wide">{userProfile?.name || 'Farmer'}</h2>
                            <p className="text-[#8abf8a] text-sm mb-1">{userProfile?.phone || ''}</p>
                            <span className="inline-flex items-center gap-1 bg-[#13ec6d]/10 border border-[#13ec6d]/30 px-2 py-0.5 rounded text-[10px] text-[#13ec6d] font-bold uppercase tracking-wider">
                                <span className="material-symbols-outlined text-[10px]">verified</span> Verified Farmer
                            </span>
                        </div>
                    </div>
                </div>

                {/* Scrolled Content Area */}
                <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-6 space-y-6">

                    {/* Agricultural Services Group */}
                    <div>
                        <h3 className="text-[10px] text-[#5c8a5c] uppercase tracking-widest font-bold mb-3 ml-2">Agricultural Services</h3>
                        <nav className="space-y-1">
                            <button
                                onClick={() => { onNavigate('dashboard'); onClose(); }}
                                className="w-full bg-[#1a2e1a] border border-[#2a4a2a] text-[#13ec6d] px-4 py-3 rounded-xl flex items-center gap-4 transition-all"
                            >
                                <span className="material-symbols-outlined rounded-lg text-lg">grid_view</span>
                                <span className="font-semibold text-sm tracking-wide">Dashboard</span>
                            </button>
                            <button
                                onClick={() => { onNavigate('farm-list'); onClose(); }}
                                className="w-full hover:bg-white/5 text-gray-300 hover:text-white px-4 py-3 rounded-xl flex items-center gap-4 transition-all"
                            >
                                <span className="material-symbols-outlined rounded-lg text-lg">landscape</span>
                                <span className="font-medium text-sm tracking-wide">My Farms</span>
                                <span className="ml-auto bg-[#1a2e1a] text-[#8abf8a] text-[10px] font-bold px-2 py-0.5 rounded-full">3 Active</span>
                            </button>
                            <button
                                onClick={() => { onNavigate('mandi-prices'); onClose(); }}
                                className="w-full hover:bg-white/5 text-gray-300 hover:text-white px-4 py-3 rounded-xl flex items-center gap-4 transition-all"
                            >
                                <span className="material-symbols-outlined rounded-lg text-lg">storefront</span>
                                <span className="font-medium text-sm tracking-wide">Mandi Rates</span>
                            </button>
                            <button
                                onClick={() => { onNavigate('schemes'); onClose(); }}
                                className="w-full hover:bg-white/5 text-gray-300 hover:text-white px-4 py-3 rounded-xl flex items-center gap-4 transition-all"
                            >
                                <span className="material-symbols-outlined rounded-lg text-lg">assignment</span>
                                <span className="font-medium text-sm tracking-wide">Govt Schemes</span>
                                <div className="ml-auto w-2 h-2 rounded-full bg-[#13ec6d] shadow-[0_0_5px_rgba(19,236,109,0.5)]"></div>
                            </button>
                        </nav>
                    </div>

                    <div className="h-px w-full bg-gradient-to-r from-transparent via-[#2a4a2a] to-transparent"></div>

                    {/* Support & Info Group */}
                    <div>
                        <h3 className="text-[10px] text-[#5c8a5c] uppercase tracking-widest font-bold mb-3 ml-2">Support & Info</h3>
                        <nav className="space-y-1">
                            <button className="w-full hover:bg-white/5 text-gray-300 hover:text-white px-4 py-3 rounded-xl flex items-center gap-4 transition-all">
                                <span className="material-symbols-outlined rounded-lg text-lg opacity-70">history</span>
                                <span className="font-medium text-sm tracking-wide">Activity History</span>
                            </button>
                            <button className="w-full hover:bg-white/5 text-gray-300 hover:text-white px-4 py-3 rounded-xl flex items-center gap-4 transition-all">
                                <span className="material-symbols-outlined rounded-lg text-lg opacity-70">support_agent</span>
                                <span className="font-medium text-sm tracking-wide">Help Center</span>
                            </button>
                            <button className="w-full hover:bg-white/5 text-gray-300 hover:text-white px-4 py-3 rounded-xl flex items-center gap-4 transition-all">
                                <span className="material-symbols-outlined rounded-lg text-lg opacity-70">translate</span>
                                <span className="font-medium text-sm tracking-wide">Language Settings</span>
                                <span className="ml-auto text-xs text-[#5c8a5c]">En</span>
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Footer Area */}
                <div className="p-4 shrink-0 border-t border-[#1a2e1a] bg-[#0a140a]">
                    <button
                        onClick={() => { onNavigate('logout'); onClose(); }}
                        className="w-full bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition-all font-semibold text-sm tracking-wide"
                    >
                        <span className="material-symbols-outlined text-lg">logout</span>
                        Log Out
                    </button>
                    <p className="text-center text-[10px] text-[#5c8a5c] mt-4 font-bold tracking-widest uppercase">Kisan Sahayak v2.0</p>
                </div>
            </div>
        </>
    );
};

export default SideDrawerMenu;
