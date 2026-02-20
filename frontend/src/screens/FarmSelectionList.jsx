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
        <div className="bg-background-light dark:bg-background-dark text-gray-800 dark:text-gray-100 font-display min-h-screen relative pb-24 antialiased">
            {/* Status Bar Area */}
            <div className="h-12 w-full bg-background-light dark:bg-background-dark sticky top-0 z-50"></div>

            {/* Header Section */}
            <header className="px-6 pb-2 sticky top-12 z-40 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm transition-colors duration-300">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border border-primary/30">
                            <img alt="User" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD56QhdLR2gWga3uccQ2jIOcISATWO_r_kR2VMzt8FiitPf3Vy708lx3DgXtTW9b3H0PYGFADXu9vtaYvrDJcoULmhnNsiZHjc6xtL0X4UknT-2A9xtHPnHULOQwHu2LpU_1G4Aq9i6SecS2wJDIjOx_YIuxlhmKaFBefWTb6x2hw8B1geqvqFCrLEaCeo-FTMxZsCYFEL6kD0ZUUeyEJe1mi4M0_K3JA7PoviCNLt2C_4nkJ92FQpvkQiJGFeyN0MgyDevoB9Ih-ah" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Welcome back,</p>
                            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{userProfile?.name || 'Rajesh Kumar'}</h2>
                        </div>
                    </div>
                    <button
                        onClick={onNotificationClick}
                        className="w-10 h-10 rounded-full bg-white dark:bg-surface-dark shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-primary transition-colors"
                    >
                        <span className="material-icons-round">notifications</span>
                    </button>
                </div>

                <div className="flex justify-between items-end mb-4">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">My Farms</h1>
                    <button
                        onClick={onAddFarm}
                        className="bg-primary hover:bg-primary-dark text-black font-semibold py-2 px-4 rounded-full flex items-center gap-2 shadow-soft transition-all active:scale-95 text-sm"
                    >
                        <span className="material-icons-round text-lg">add</span>
                        <span>Add Farm</span>
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="material-icons-round text-gray-400 group-focus-within:text-primary transition-colors">search</span>
                    </div>
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border-none rounded-xl bg-white dark:bg-surface-dark text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm text-sm transition-shadow"
                        placeholder="Search for a farm..."
                        type="text"
                    />
                </div>
            </header>

            {/* Filters */}
            <div className="px-6 py-4 flex gap-3 overflow-x-auto no-scrollbar">
                {['All', 'Healthy', 'Attention Needed'].map((filter) => (
                    <button
                        key={filter}
                        onClick={() => setActiveFilter(filter === 'All' ? 'All' : filter === 'Healthy' ? 'Good' : 'Alert')}
                        className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium shadow-md transition-colors ${activeFilter === (filter === 'All' ? 'All' : filter === 'Healthy' ? 'Good' : 'Alert') ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-white dark:bg-surface-dark text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}`}
                    >
                        {filter} {filter === 'All' && <span className="ml-1 opacity-70 text-xs">{farms.length}</span>}
                    </button>
                ))}
            </div>

            {/* Farm List */}
            <main className="px-6 space-y-4">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 opacity-50">
                        <span className="material-icons animate-spin text-4xl mb-2 text-primary">sync</span>
                        <p className="text-sm font-medium">Loading your farms...</p>
                    </div>
                ) : filteredFarms.length === 0 ? (
                    <div className="text-center py-12 px-6 bg-white/50 dark:bg-white/5 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
                        <span className="material-icons text-4xl text-gray-300 mb-3">agriculture</span>
                        <p className="text-gray-500 font-medium">No farms found. Add your first farm to get started!</p>
                    </div>
                ) : filteredFarms.map((farm) => (
                    <div
                        key={farm._id}
                        onClick={() => onFarmClick(farm._id)}
                        className="group bg-white dark:bg-surface-dark rounded-xl p-4 shadow-sm hover:shadow-soft border border-transparent hover:border-primary/30 transition-all duration-300 cursor-pointer active:scale-[0.99]"
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden relative bg-gray-100">
                                <img alt={farm.farm_name || farm.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={getCropThumbnail(farm.crop_type || farm.crop || '')} />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">{farm.farm_name || farm.name || 'Unnamed Farm'}</h3>
                                    <span className="material-icons-round text-gray-300 dark:text-gray-600 group-hover:text-primary group-hover:translate-x-1 transition-all">chevron_right</span>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1">
                                    <span className="material-icons-round text-xs">grass</span> {farm.crop_type || farm.crop || 'Not set'}
                                </p>
                                <div className="flex items-center gap-3">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-green-700 dark:text-green-400 border border-primary/20">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                                        {farm.status || 'Active'}
                                    </span>
                                    <span className="text-xs text-gray-400 dark:text-gray-500">{farm.area ? `${farm.area} acres` : ''}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
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
