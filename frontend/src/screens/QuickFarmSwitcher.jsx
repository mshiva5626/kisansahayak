import React, { useState, useEffect } from 'react';
import { farmAPI } from '../api';

const QuickFarmSwitcher = ({ onBack, onAddFarm, onFarmSelect }) => {
    const [farms, setFarms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchFarms = async () => {
            try {
                const { data } = await farmAPI.getFarms();
                setFarms(data.farms || []);
            } catch (error) {
                console.error('Failed to fetch farms:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchFarms();
    }, []);

    const getIcon = (crop) => {
        const c = (crop || '').toLowerCase();
        if (c.includes('rice')) return 'water_drop';
        if (c.includes('fruit') || c.includes('apple') || c.includes('mango')) return 'park';
        return 'grass';
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-end justify-center selection:bg-primary selection:text-white">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
                onClick={onBack}
            ></div>

            {/* Bottom Sheet */}
            <div className="relative w-full max-w-md bg-background-light dark:bg-surface-dark rounded-t-[32px] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] transform transition-transform duration-300 ease-out flex flex-col max-h-[85%] animate-fade-in-up">
                {/* Sheet Handle */}
                <div className="w-full h-8 flex justify-center items-start pt-3">
                    <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                </div>

                {/* Sheet Header */}
                <div className="px-6 pb-5 pt-1 flex justify-between items-center border-b border-gray-100 dark:border-white/5">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Switch Farm</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Select a property to manage</p>
                    </div>
                    <button
                        onClick={onAddFarm}
                        className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-all active:scale-90"
                    >
                        <span className="material-icons-round text-2xl">add_circle_outline</span>
                    </button>
                </div>

                {/* Farm List */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 no-scrollbar">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <span className="material-icons animate-spin text-3xl text-primary mb-2">sync</span>
                            <p className="text-sm text-gray-500">Loading farms...</p>
                        </div>
                    ) : farms.length === 0 ? (
                        <div className="text-center py-8 px-6">
                            <span className="material-icons text-4xl text-gray-300 mb-3">agriculture</span>
                            <p className="text-gray-500 font-medium">No farms yet. Add your first farm!</p>
                        </div>
                    ) : farms.map((farm, idx) => (
                        <div key={farm._id || idx} className="relative group cursor-pointer" onClick={() => onFarmSelect(farm._id)}>
                            {idx === 0 && (
                                <div className="absolute -inset-0.5 bg-primary rounded-2xl opacity-30 blur-sm group-hover:opacity-50 transition-opacity"></div>
                            )}
                            <div className={`relative flex items-center p-4 bg-white dark:bg-background-dark border ${idx === 0 ? 'border-primary/50 shadow-glow' : 'border-transparent dark:border-white/5'} hover:border-primary/30 rounded-2xl shadow-sm transition-all duration-300`}>
                                {/* Farm Icon */}
                                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mr-4 shrink-0 transition-colors ${idx === 0
                                    ? 'bg-primary/20 text-primary'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 group-hover:text-primary/60'
                                    }`}>
                                    <span className="material-icons-round text-3xl">{getIcon(farm.crop_type || farm.crop)}</span>
                                </div>

                                {/* Farm Details */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-gray-900 dark:text-white truncate text-lg tracking-tight">{farm.farm_name || farm.name || 'Unnamed Farm'}</h3>
                                        {idx === 0 && (
                                            <span className="bg-primary/10 text-primary-dark dark:text-primary text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-widest">Active</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5 font-medium">
                                        <span className="material-icons-round text-base opacity-60">agriculture</span>
                                        {farm.crop_type || farm.crop || 'Not set'}
                                    </p>
                                </div>

                                {/* Selection Indicator */}
                                {idx === 0 ? (
                                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shadow-lg animate-fade-in">
                                        <span className="material-icons-round text-lg font-bold">check</span>
                                    </div>
                                ) : (
                                    <div className="w-8 h-8 flex items-center justify-center text-gray-300 dark:text-gray-600 transition-transform group-hover:translate-x-1">
                                        <span className="material-icons-round text-2xl">chevron_right</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Action */}
                <div className="p-8 pt-2 pb-12">
                    <button
                        onClick={onBack}
                        className="w-full py-4 rounded-2xl border-2 border-gray-100 dark:border-white/5 text-gray-600 dark:text-gray-300 font-bold text-sm flex items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-all active:scale-[0.98]"
                    >
                        <span className="material-icons-round text-xl">settings</span>
                        Manage All Farms
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuickFarmSwitcher;
