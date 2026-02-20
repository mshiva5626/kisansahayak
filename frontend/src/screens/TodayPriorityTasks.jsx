import React from 'react';
import BottomNavbar from '../components/BottomNavbar';

const TodayPriorityTasks = ({ onBack, onTaskDone, onViewTreatment, onNavigate }) => {
    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-gray-900 dark:text-gray-100 min-h-screen flex justify-center">
            <div className="w-full max-w-md bg-background-light dark:bg-background-dark min-h-screen relative flex flex-col pb-24 shadow-2xl overflow-hidden">
                {/* Header Section */}
                <header className="pt-12 px-6 pb-4 flex justify-between items-end bg-surface-light dark:bg-surface-dark sticky top-0 z-10 shadow-sm border-b border-gray-100 dark:border-white/5 animate-fade-in">
                    <div className="flex items-center gap-3">
                        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <span className="material-icons text-gray-600 dark:text-gray-300">arrow_back</span>
                        </button>
                        <div>
                            <p className="text-sm font-medium text-neutral-custom dark:text-gray-400 uppercase tracking-wider mb-1">Kisan Sahayak</p>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Today's Focus</h1>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="block text-xs font-semibold text-primary dark:text-primary bg-primary/10 px-2 py-1 rounded-full">OCT 24</span>
                    </div>
                </header>

                <main className="flex-1 px-6 pt-6 flex flex-col gap-6 overflow-y-auto no-scrollbar">
                    {/* Weather Strip */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-4 shadow-card flex items-center justify-between border-l-4 border-primary animate-fade-in delay-100">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500">
                                <span className="material-icons text-2xl">wb_sunny</span>
                            </div>
                            <div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-bold dark:text-white">28°C</span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Partly Cloudy</span>
                                </div>
                                <p className="text-xs text-neutral-custom dark:text-gray-400 mt-0.5">Perfect conditions for spraying.</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="material-icons text-gray-300 dark:text-gray-600">chevron_right</span>
                        </div>
                    </div>

                    {/* Priority Action Card (Hero) */}
                    <section className="relative animate-fade-in delay-200">
                        <div className="absolute -top-3 left-4 z-10">
                            <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg uppercase tracking-wide">High Priority</span>
                        </div>
                        <div className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-soft overflow-hidden border border-gray-100 dark:border-white/5 group">
                            {/* Card Image/Header Area */}
                            <div className="h-40 w-full relative bg-gray-200">
                                <img
                                    alt="Green wheat field"
                                    className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700"
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAKSp04E3_woNO2I6DnmouIDt_Rr_h4FQE_-iPdwkCb2a7aonBjUX7TDusalR_bCbkAIKn7nXG1JTu8rMt2bsAHEO0ZmcVyLGGZsrh5TQlCVtxqEfNTBsC-9ZftzhnXSyqQ-7E8BswPLMJuPcH2Wh6OM3NNGQL3V8EMGRprJGDqJ5upwOJZVivzdpMCrWRdG-r1y7TcZTGR8kdosD2ivwpETnNts1VsdY5CsH5o6MCbpMu8eKnEGeJf06Git9QY8GZF-j5YGr762Azs"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                <div className="absolute bottom-3 left-4 text-white">
                                    <div className="flex items-center gap-1 text-xs font-medium bg-black/30 backdrop-blur-md px-2 py-0.5 rounded-lg w-fit mb-1">
                                        <span className="material-icons text-[14px]">place</span>
                                        Sector 4 - Wheat
                                    </div>
                                </div>
                            </div>
                            {/* Card Body */}
                            <div className="p-5">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">Apply Urea Fertilizer</h2>
                                <p className="text-neutral-custom dark:text-gray-300 mb-6 text-sm leading-relaxed">
                                    Based on soil analysis, apply <span className="font-semibold text-gray-900 dark:text-white">25kg/acre</span>. Ensure application is completed before noon to maximize absorption.
                                </p>
                                {/* Action Button */}
                                <button
                                    onClick={onTaskDone}
                                    className="w-full bg-primary hover:bg-primary-dark active:scale-[0.98] transition-all text-white font-semibold py-4 rounded-xl shadow-lg shadow-primary/30 flex items-center justify-center gap-2 text-lg"
                                >
                                    <span className="material-icons">check_circle</span>
                                    Mark as Done
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Caution Card */}
                    <section>
                        <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-500/20 rounded-xl p-5 flex gap-4 items-start">
                            <div className="flex-shrink-0">
                                <div className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 p-2 rounded-lg">
                                    <span className="material-icons">warning</span>
                                </div>
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">High Humidity Alert</h3>
                                    <span className="text-[10px] font-bold text-orange-600 bg-orange-100 dark:bg-orange-900/40 dark:text-orange-300 px-2 py-0.5 rounded-full uppercase">Warning</span>
                                </div>
                                <p className="text-sm text-neutral-custom dark:text-gray-400 mb-3">
                                    Conditions are favorable for fungal growth. Inspect leaves for spots.
                                </p>
                                <button
                                    onClick={onViewTreatment}
                                    className="text-sm font-semibold text-orange-600 dark:text-orange-400 flex items-center gap-1 hover:underline"
                                >
                                    View Treatment Plan
                                    <span className="material-icons text-sm">arrow_forward</span>
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Upcoming List (Mini) */}
                    <section className="pb-4">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Upcoming</h4>
                        <div className="space-y-3">
                            <div className="flex items-center gap-4 bg-surface-light dark:bg-surface-dark p-3 rounded-xl border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-colors">
                                <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                                    <span className="material-icons text-lg">water_drop</span>
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-900 dark:text-white text-sm">Irrigation Cycle</p>
                                    <p className="text-xs text-gray-500">Tomorrow, 6:00 AM</p>
                                </div>
                                <span className="material-icons text-gray-300 text-sm">more_horiz</span>
                            </div>
                        </div>
                    </section>
                </main>

                {/* Bottom Navigation */}
                <BottomNavbar
                    activeTab="dashboard"
                    onNavigate={onNavigate}
                />
            </div>
        </div>
    );
};

export default TodayPriorityTasks;
