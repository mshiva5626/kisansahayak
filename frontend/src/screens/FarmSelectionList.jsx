import React, { useState, useEffect } from 'react';
import BottomNavbar from '../components/BottomNavbar';
import { farmAPI } from '../api';

const FarmSelectionList = ({ onBack, onAddFarm, onFarmClick, onNotificationClick, onNavigate, userProfile }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    const [farms, setFarms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchFarms = async () => {
            try {
                const { data } = await farmAPI.getFarms();
                setFarms(data.farms);
            } catch (error) {
                console.error('Failed to fetch farms:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchFarms();
    }, []);

    const filteredFarms = farms.filter(f => {
        const farmName = (f.farm_name || f.name || '').toLowerCase();
        const farmStatus = f.status || 'Good';
        return farmName.includes(searchQuery.toLowerCase()) &&
            (activeFilter === 'All' || farmStatus.includes(activeFilter));
    });

    const getCropThumbnail = (crop) => {
        const c = (crop || '').toLowerCase();
        if (c.includes('wheat')) return 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=400&q=80';
        if (c.includes('rice') || c.includes('basmati')) return 'https://images.unsplash.com/photo-1523472721958-978152f4d69b?auto=format&fit=crop&w=400&q=80';
        if (c.includes('sugarcane')) return 'https://images.unsplash.com/photo-1528659550302-601b22e153e9?auto=format&fit=crop&w=400&q=80';
        if (c.includes('cotton')) return 'https://images.unsplash.com/photo-1594916848030-d32693ba9f83?auto=format&fit=crop&w=400&q=80';
        return 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=80';
    };

    return (
        <div className="bg-gradient-to-b from-[#fcfdfc] to-[#e3eae4] dark:from-[#03140A] dark:to-[#081d11] text-slate-800 dark:text-slate-100 font-display min-h-screen relative pb-28 antialiased overflow-x-hidden">
            {/* Ambient glows */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

            {/* Header Section */}
            <header className="px-6 pt-12 pb-3 sticky top-0 z-40 bg-white/30 dark:bg-[#03140A]/30 backdrop-blur-md transition-all border-b border-white/20 dark:border-emerald-500/5">
                <div className="flex justify-between items-center mb-5">
                    <div 
                        onClick={() => onNavigate('account-info')}
                        className="flex items-center gap-3 cursor-pointer active:scale-95 transition-all group"
                    >
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 p-0.5 border border-emerald-500/30 relative">
                            <span className="absolute inset-0 rounded-full border border-emerald-500/40 animate-pulse"></span>
                            <img alt="User" className="w-full h-full object-cover rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD56QhdLR2gWga3uccQ2jIOcISATWO_r_kR2VMzt8FiitPf3Vy708lx3DgXtTW9b3H0PYGFADXu9vtaYvrDJcoULmhnNsiZHjc6xtL0X4UknT-2A9xtHPnHULOQwHu2LpU_1G4Aq9i6SecS2wJDIjOx_YIuxlhmKaFBefWTb6x2hw8B1geqvqFCrLEaCeo-FTMxZsCYFEL6kD0ZUUeyEJe1mi4M0_K3JA7PoviCNLt2C_4nkJ92FQpvkQiJGFeyN0MgyDevoB9Ih-ah" />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider leading-none mb-1">Active Profile</p>
                            <h2 className="text-xs font-bold text-slate-900 dark:text-slate-200 group-hover:text-emerald-500 transition-colors leading-none">{userProfile?.name || 'Rajesh Kumar'}</h2>
                        </div>
                    </div>
                    <button
                        onClick={onNotificationClick}
                        className="w-10 h-10 rounded-full bg-white/40 dark:bg-[#03140A]/50 backdrop-blur-md shadow-sm border border-white/60 dark:border-emerald-500/10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-emerald-500 dark:hover:text-emerald-400 active:scale-90 transition-all tactile-btn cursor-pointer"
                    >
                        <span className="material-icons-round text-xl">notifications</span>
                    </button>
                </div>

                <div className="flex justify-between items-end mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-950 dark:text-white tracking-tight">Connected Farms</h1>
                        <p className="text-[10px] text-slate-400 dark:text-slate-400 leading-none mt-1 font-medium">Select a farm to open the digital task center.</p>
                    </div>
                    <button
                        onClick={onAddFarm}
                        className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-2.5 px-4 rounded-full flex items-center gap-1.5 shadow-md active:scale-95 transition-all text-xs tactile-btn cursor-pointer"
                    >
                        <span className="material-icons-round text-base">add</span>
                        <span>Add Farm</span>
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500">
                        <span className="material-icons-round text-lg transition-colors">search</span>
                    </div>
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-10 pr-4 py-3 rounded-xl bg-white/40 dark:bg-black/30 border border-white/60 dark:border-emerald-500/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400 shadow-sm text-xs transition-all"
                        placeholder="Search farms by crop or title..."
                        type="text"
                    />
                </div>
            </header>

            {/* Filters */}
            <div className="px-6 py-4 flex gap-2.5 overflow-x-auto no-scrollbar shrink-0">
                {['All', 'Healthy', 'Attention Needed'].map((filter) => (
                    <button
                        key={filter}
                        onClick={() => setActiveFilter(filter === 'All' ? 'All' : filter === 'Healthy' ? 'Good' : 'Alert')}
                        className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm active:scale-95 tactile-btn cursor-pointer ${
                            activeFilter === (filter === 'All' ? 'All' : filter === 'Healthy' ? 'Good' : 'Alert') 
                                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' 
                                : 'bg-white/40 dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-white/60 dark:border-emerald-500/10'
                        }`}
                    >
                        {filter} {filter === 'All' && <span className="ml-1 opacity-70 text-[10px] font-mono">{farms.length}</span>}
                    </button>
                ))}
            </div>

            {/* Farm List */}
            <main className="px-6 space-y-4 tilt-card-container">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-16 opacity-60">
                        <span className="material-icons animate-spin text-3xl mb-2 text-emerald-500">sync</span>
                        <p className="text-xs font-bold tracking-wider uppercase text-slate-400">Syncing Farms...</p>
                    </div>
                ) : filteredFarms.length === 0 ? (
                    <div className="text-center py-16 px-6 krishi-glass rounded-2xl border border-dashed border-emerald-500/20">
                        <span className="material-icons text-4xl text-slate-300 dark:text-emerald-500/20 mb-3 animate-pulse">agriculture</span>
                        <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">No connected farms found.</p>
                        <p className="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto">Create a farm sheet to start scanning crops and tracking market values.</p>
                    </div>
                ) : (
                    filteredFarms.map((farm) => (
                        <div
                            key={farm._id}
                            onClick={() => onFarmClick(farm._id)}
                            className="tilt-card krishi-glass rounded-2xl p-4 shadow-md border border-white/60 dark:border-emerald-500/10 hover:border-emerald-500/40 cursor-pointer transition-all duration-300 flex items-start gap-4"
                        >
                            <div className="w-18 h-18 flex-shrink-0 rounded-xl overflow-hidden relative bg-slate-100 dark:bg-[#081d11] border border-white/20 dark:border-emerald-500/10">
                                <img 
                                    alt={farm.farm_name || farm.name} 
                                    className="w-full h-full object-cover transition-transform duration-500" 
                                    src={getCropThumbnail(farm.crop_type || farm.crop || '')} 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="text-base font-bold text-slate-905 dark:text-white truncate pr-2">{farm.farm_name || farm.name || 'Unnamed Farm'}</h3>
                                    <span className="material-icons-round text-slate-400 dark:text-emerald-500/30 group-hover:text-emerald-500 transition-all text-lg">chevron_right</span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2.5 flex items-center gap-1 font-semibold">
                                    <span className="material-icons-round text-emerald-500 text-xs">grass</span> 
                                    <span>Primary Crop: {farm.crop_type || farm.crop || 'Not specified'}</span>
                                </p>
                                <div className="flex items-center justify-between">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                        {farm.status || 'Active'}
                                    </span>
                                    <span className="text-xs text-slate-400 dark:text-slate-400 font-bold">{farm.area ? `${farm.area} ${farm.unit || 'Acres'}` : ''}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </main>

            {/* Bottom Navigation */}
            <BottomNavbar
                activeTab="farm-list"
                onNavigate={onNavigate}
            />
        </div>
    );
};

export default FarmSelectionList;
