import React from 'react';

const DashboardSkeleton = () => {
    return (
        <div className="flex flex-col min-h-screen bg-[#f8fafc] font-display">
            {/* Custom Styles applied directly since they're unique to the skeleton */}
            <style>
                {`
                    @keyframes shimmer {
                        0% { background-position: -200% 0; }
                        100% { background-position: 200% 0; }
                    }
                    .shimmer {
                        background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 20%, rgba(255,255,255,0.5) 60%, rgba(255,255,255,0));
                        background-color: #e2e8f0;
                        background-size: 200% 100%;
                        animation: shimmer 1.5s infinite linear;
                    }
                    .dark .shimmer {
                        background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.05) 20%, rgba(255,255,255,0.1) 60%, rgba(255,255,255,0));
                        background-color: #334155;
                    }
                `}
            </style>

            {/* App Header */}
            <header className="bg-white dark:bg-black border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Brand Accent Icon Placeholder */}
                        <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                            <div className="w-6 h-6 rounded-md shimmer"></div>
                        </div>
                        <div>
                            {/* Profile Name Placeholder */}
                            <div className="h-4 w-24 rounded-md shimmer mb-2"></div>
                            {/* Location Placeholder */}
                            <div className="h-3 w-32 rounded-md shimmer"></div>
                        </div>
                    </div>
                    {/* Notification Icon Placeholder */}
                    <div className="w-8 h-8 rounded-full shimmer"></div>
                </div>
            </header>

            {/* Main Content Container */}
            <main className="flex-1 p-4 space-y-6 bg-slate-50 dark:bg-background-dark max-w-md mx-auto w-full">
                {/* Hero Summary Card */}
                <section className="bg-white dark:bg-surface-dark rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-border-dark">
                    <div className="flex justify-between items-start mb-4">
                        <div className="space-y-3">
                            <div className="h-3 w-20 rounded-full shimmer"></div>
                            <div className="h-8 w-40 rounded-md shimmer"></div>
                        </div>
                        <div className="w-12 h-12 rounded-xl shimmer"></div>
                    </div>
                    <div className="pt-4 border-t border-gray-50 dark:border-gray-800 flex gap-4">
                        <div className="h-4 w-1/3 rounded-full shimmer"></div>
                        <div className="h-4 w-1/4 rounded-full shimmer"></div>
                    </div>
                </section>

                {/* Quick Actions Grid */}
                <section className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex flex-col items-center gap-2">
                            <div className="w-14 h-14 rounded-2xl shimmer"></div>
                            <div className="h-2 w-10 rounded-full shimmer"></div>
                        </div>
                    ))}
                </section>

                {/* Data Section */}
                <section className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="h-5 w-32 rounded-md shimmer"></div>
                        <div className="h-4 w-16 rounded-full shimmer"></div>
                    </div>

                    {/* List Cards */}
                    {[1, 2].map((i) => (
                        <div key={i} className="bg-white dark:bg-surface-dark rounded-xl p-4 flex items-center gap-4 shadow-sm border border-gray-50 dark:border-border-dark">
                            <div className="w-16 h-16 rounded-lg shrink-0 shimmer"></div>
                            <div className="flex-1 space-y-3">
                                <div className="h-4 w-3/4 rounded shimmer"></div>
                                <div className="h-3 w-1/2 rounded shimmer"></div>
                                <div className="flex gap-2">
                                    <div className="h-5 w-16 rounded-full shimmer"></div>
                                    {i === 1 && <div className="h-5 w-16 rounded-full shimmer"></div>}
                                </div>
                            </div>
                        </div>
                    ))}
                </section>
            </main>
        </div>
    );
};

export default DashboardSkeleton;
