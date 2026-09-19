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
                className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={handleBackdropClick}
            ></div>

            {/* Drawer */}
            <div className={`fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white shadow-2xl border-r border-slate-200/80 z-50 transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>

                {/* User Profile Header */}
                <div className="pt-12 pb-6 px-6 relative overflow-hidden shrink-0 bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-700 text-white">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>

                    <button onClick={onClose} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-white/15 border border-white/20 text-white hover:bg-white/25 transition-colors active:scale-95 cursor-pointer">
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>

                    <div className="flex items-center gap-4 relative z-10 mt-4">
                        <div className="w-16 h-16 rounded-full bg-white/20 p-[2px] shadow-md">
                            <div className="w-full h-full rounded-full bg-white overflow-hidden flex items-center justify-center text-emerald-700">
                                <span className="material-symbols-outlined text-3xl">person</span>
                            </div>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-wide">{userProfile?.name || 'Farmer'}</h2>
                            <p className="text-emerald-100 text-xs mb-1.5">{userProfile?.phone || ''}</p>
                            <span className="inline-flex items-center gap-1 bg-white/20 border border-white/30 px-2 py-0.5 rounded text-[10px] text-white font-bold uppercase tracking-wider">
                                <span className="material-symbols-outlined text-[10px]">verified</span> Verified Farmer
                            </span>
                        </div>
                    </div>
                </div>

                {/* Scrolled Content Area */}
                <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-6 space-y-6">

                    {/* Agricultural Services Group */}
                    <div>
                        <h3 className="text-[10px] text-slate-400 uppercase tracking-widest font-extrabold mb-3 ml-2">Agricultural Services</h3>
                        <nav className="space-y-1">
                            <button
                                onClick={() => { onNavigate('dashboard'); onClose(); }}
                                className="w-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-4 transition-all cursor-pointer shadow-xs"
                            >
                                <span className="material-symbols-outlined rounded-lg text-lg text-emerald-600">grid_view</span>
                                <span className="font-bold text-sm tracking-wide">Dashboard</span>
                            </button>
                            <button
                                onClick={() => { onNavigate('farm-list'); onClose(); }}
                                className="w-full hover:bg-slate-50 text-slate-700 hover:text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-4 transition-all cursor-pointer"
                            >
                                <span className="material-symbols-outlined rounded-lg text-lg text-slate-500">landscape</span>
                                <span className="font-semibold text-sm tracking-wide">My Farms</span>
                                <span className="ml-auto bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200">3 Active</span>
                            </button>
                            <button
                                onClick={() => { onNavigate('mandi-prices'); onClose(); }}
                                className="w-full hover:bg-slate-50 text-slate-700 hover:text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-4 transition-all cursor-pointer"
                            >
                                <span className="material-symbols-outlined rounded-lg text-lg text-slate-500">storefront</span>
                                <span className="font-semibold text-sm tracking-wide">Mandi Rates</span>
                            </button>
                            <button
                                onClick={() => { onNavigate('schemes'); onClose(); }}
                                className="w-full hover:bg-slate-50 text-slate-700 hover:text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-4 transition-all cursor-pointer"
                            >
                                <span className="material-symbols-outlined rounded-lg text-lg text-slate-500">assignment</span>
                                <span className="font-semibold text-sm tracking-wide">Govt Schemes</span>
                                <div className="ml-auto w-2 h-2 rounded-full bg-emerald-500"></div>
                            </button>
                            <button
                                onClick={() => { onNavigate('soil-intelligence'); onClose(); }}
                                className="w-full hover:bg-slate-50 text-slate-700 hover:text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-4 transition-all cursor-pointer"
                            >
                                <span className="material-symbols-outlined rounded-lg text-lg text-emerald-600">biotech</span>
                                <span className="font-semibold text-sm tracking-wide">Soil Intelligence Hub</span>
                                <span className="ml-auto bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">AI+IoT</span>
                            </button>
                            <button
                                onClick={() => { onNavigate('iot-settings'); onClose(); }}
                                className="w-full hover:bg-slate-50 text-slate-700 hover:text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-4 transition-all cursor-pointer"
                            >
                                <span className="material-symbols-outlined rounded-lg text-lg text-slate-500">sensors</span>
                                <span className="font-semibold text-sm tracking-wide">IoT Sensors</span>
                            </button>
                        </nav>
                    </div>

                    <div className="h-px w-full bg-slate-200"></div>

                    {/* Support & Info Group */}
                    <div>
                        <h3 className="text-[10px] text-slate-400 uppercase tracking-widest font-extrabold mb-3 ml-2">Support & Info</h3>
                        <nav className="space-y-1">
                            <button className="w-full hover:bg-slate-50 text-slate-700 hover:text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-4 transition-all cursor-pointer">
                                <span className="material-symbols-outlined rounded-lg text-lg text-slate-500">history</span>
                                <span className="font-semibold text-sm tracking-wide">Activity History</span>
                            </button>
                            <button className="w-full hover:bg-slate-50 text-slate-700 hover:text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-4 transition-all cursor-pointer">
                                <span className="material-symbols-outlined rounded-lg text-lg text-slate-500">support_agent</span>
                                <span className="font-semibold text-sm tracking-wide">Help Center</span>
                            </button>
                            <button className="w-full hover:bg-slate-50 text-slate-700 hover:text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-4 transition-all cursor-pointer">
                                <span className="material-symbols-outlined rounded-lg text-lg text-slate-500">translate</span>
                                <span className="font-semibold text-sm tracking-wide">Language Settings</span>
                                <span className="ml-auto text-xs text-slate-500 font-bold">En</span>
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Footer Area */}
                <div className="p-4 shrink-0 border-t border-slate-200 bg-slate-50">
                    <button
                        onClick={() => { onNavigate('logout'); onClose(); }}
                        className="w-full bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition-all font-bold text-sm tracking-wide cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-lg">logout</span>
                        Log Out
                    </button>
                    <p className="text-center text-[10px] text-slate-400 mt-4 font-bold tracking-widest uppercase">Kisan Sahayak v2.0</p>
                </div>
            </div>
        </>
    );
};

export default SideDrawerMenu;
