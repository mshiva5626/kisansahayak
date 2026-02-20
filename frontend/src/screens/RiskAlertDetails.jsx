import React from 'react';

const RiskAlertDetails = ({ onBack }) => {
    return (
        <div className="bg-background-light dark:bg-background-dark text-neutral-text font-display antialiased min-h-screen flex flex-col relative overflow-hidden">
            {/* Ambient Background Decoration */}
            <div className="fixed top-0 left-0 w-full h-96 bg-gradient-to-b from-[#eebd2b]/10 to-transparent pointer-events-none z-0"></div>

            {/* Header */}
            <header className="flex items-center justify-between px-6 pt-14 pb-4 sticky top-0 z-50 bg-white/70 dark:bg-[#221d10]/70 backdrop-blur-xl border-b border-[#eebd2b]/20 dark:border-[#eebd2b]/10">
                <button
                    onClick={onBack}
                    className="p-2 rounded-full hover:bg-black/5 active:bg-black/10 transition-colors text-neutral-800 dark:text-white group"
                >
                    <span className="material-icons-outlined text-2xl group-hover:-translate-x-0.5 transition-transform">chevron_left</span>
                </button>
                <h1 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Alert Details</h1>
                <button className="p-2 rounded-full hover:bg-black/5 active:bg-black/10 transition-colors text-neutral-800 dark:text-white">
                    <span className="material-icons-outlined text-2xl">ios_share</span>
                </button>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto no-scrollbar px-6 pb-40 relative z-10">
                {/* Hero Section */}
                <div className="flex flex-col items-center justify-center pt-8 pb-10 text-center relative animate-fade-in">
                    {/* Glow Effect */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 hero-glow rounded-full blur-2xl -z-10"></div>
                    {/* Status Badge */}
                    <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 mb-6 shadow-sm">
                        <span className="material-icons-outlined text-lg">warning</span>
                        <span className="text-xs font-bold uppercase tracking-wide">High Risk Alert</span>
                    </div>
                    {/* Hero Icon */}
                    <div className="mb-6 relative">
                        <span className="material-icons-outlined text-7xl text-neutral-800 dark:text-white drop-shadow-lg">thunderstorm</span>
                    </div>
                    {/* Title & Time */}
                    <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2 leading-tight">Heavy Rain Forecast</h2>
                    <p className="text-neutral-500 dark:text-neutral-400 font-medium">Expected: Today, 4:00 PM</p>
                </div>

                {/* Information Stack */}
                <div className="space-y-4 animate-fade-in delay-100">
                    {/* Card 1: The Risk */}
                    <div className="bg-white dark:bg-white/5 rounded-2xl p-5 border border-neutral-border dark:border-white/10 shadow-soft">
                        <div className="flex items-start gap-4">
                            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400 shrink-0">
                                <span className="material-icons-outlined text-2xl">water_drop</span>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1">The Risk</h3>
                                <p className="text-lg font-semibold text-neutral-800 dark:text-gray-100 leading-snug">Spray Washout Probability</p>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">High likelihood of chemical runoff if sprayed within the next 4 hours due to sudden precipitation.</p>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Why it Matters */}
                    <div className="bg-white dark:bg-white/5 rounded-2xl p-5 border border-neutral-border dark:border-white/10 shadow-soft">
                        <div className="flex items-start gap-4">
                            <div className="p-2.5 bg-orange-50 dark:bg-orange-900/20 rounded-xl text-orange-600 dark:text-orange-400 shrink-0">
                                <span className="material-icons-outlined text-2xl">currency_rupee</span>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1">Why It Matters</h3>
                                <p className="text-lg font-semibold text-neutral-800 dark:text-gray-100 leading-snug">Economic & Yield Impact</p>
                                <ul className="mt-2 space-y-2">
                                    <li className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                                        Wasted input costs (approx ₹2,000/acre)
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                                        Reduced protection against pests
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Recommended Action (Primary Focus) */}
                    <div className="bg-gradient-to-br from-[#eebd2b]/10 to-transparent dark:from-[#eebd2b]/20 dark:to-transparent rounded-2xl p-6 border border-[#eebd2b]/30 dark:border-[#eebd2b]/20 relative overflow-hidden group">
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-[#eebd2b]/20 rounded-full blur-xl group-hover:bg-[#eebd2b]/30 transition-colors"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="material-icons-outlined text-[#eebd2b] dark:text-[#eebd2b] text-xl">verified_user</span>
                                <h3 className="text-xs font-bold text-[#eebd2b] dark:text-[#eebd2b] uppercase tracking-wider">Recommended Action</h3>
                            </div>
                            <h4 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Delay spraying by 48 hours</h4>
                            <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-black/20 rounded-xl backdrop-blur-sm border border-white/50 dark:border-white/5">
                                <span className="material-icons-outlined text-green-600 dark:text-green-400">calendar_today</span>
                                <div>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Next Safe Window</p>
                                    <p className="text-sm font-bold text-neutral-800 dark:text-gray-200">Thursday, 10:00 AM</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Sticky Bottom Actions */}
            <div className="fixed bottom-0 left-0 w-full px-6 pt-4 pb-8 bg-gradient-to-t from-white via-white to-transparent dark:from-background-dark dark:via-background-dark z-50">
                <div className="flex flex-col gap-3">
                    <button className="w-full bg-[#eebd2b] hover:bg-yellow-400 active:bg-yellow-500 text-neutral-900 font-bold text-lg py-4 rounded-xl shadow-lg shadow-[#eebd2b]/30 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2">
                        <span className="material-icons-outlined">notification_add</span>
                        Set Reminder for Thursday
                    </button>
                    <button
                        onClick={onBack}
                        className="w-full bg-white dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-300 font-semibold py-3.5 rounded-xl hover:bg-neutral-50 dark:hover:bg-white/10 transition-colors"
                    >
                        Mark as Read
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RiskAlertDetails;
