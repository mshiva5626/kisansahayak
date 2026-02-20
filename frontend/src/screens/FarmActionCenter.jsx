import React from 'react';
import BottomNavbar from '../components/BottomNavbar';

const FarmActionCenter = ({ onBack, onAICopilotClick, onNavigate }) => {
    const actions = [
        { id: 'weather', title: 'Weather', sub: 'Rain expected 4 PM', icon: 'thunderstorm', color: 'blue' },
        { id: 'ai', title: 'AI Copilot', sub: 'Ask anything', icon: 'smart_toy', color: 'primary', premium: true },
        { id: 'advisory', title: 'Advisory', sub: 'Fertilizer due', icon: 'assignment', badge: '2', color: 'green' },
        { id: 'satellite', title: 'Satellite', sub: 'Field health view', icon: 'satellite_alt', color: 'teal', premium: true },
        { id: 'scan', title: 'Scan Crop', sub: 'Detect diseases', icon: 'document_scanner', color: 'purple' },
        { id: 'timeline', title: 'Timeline', sub: 'Harvest: 12 days', icon: 'calendar_month', color: 'orange' },
        { id: 'reports', title: 'Reports', sub: 'View history', icon: 'analytics', color: 'gray' },
    ];

    const handleAction = (id) => {
        if (id === 'ai') onAICopilotClick();
        if (id === 'weather') onNavigate('weather');
        if (id === 'scan') onNavigate('scanner');
        if (id === 'satellite') onNavigate('satellite');
    };

    return (
        <div className="relative w-full max-w-[420px] mx-auto bg-background-light dark:bg-background-dark overflow-hidden min-h-screen flex flex-col font-display text-text-main dark:text-gray-100 antialiased">
            {/* Header omitted for brevity */}
            {/* ... */}
            {/* Main Content Area */}
            <main className="flex-1 px-6 pb-24 overflow-y-auto no-scrollbar">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">Farm Actions</h3>
                    <span className="text-xs text-primary font-medium bg-primary/10 px-2 py-1 rounded">7 Available</span>
                </div>

                {/* 2x3 Action Grid */}
                <div className="grid grid-cols-2 gap-4">
                    {actions.map((action) => (
                        <button
                            key={action.id}
                            onClick={() => handleAction(action.id)}
                            className={`group relative flex flex-col justify-between p-4 h-40 bg-white dark:bg-surface-dark rounded-xl shadow-sm border transition-all active:scale-[0.98] ${action.premium ? 'border-primary/20 hover:border-primary overflow-hidden' : 'border-gray-100 dark:border-gray-800 hover:shadow-md'}`}
                        >
                            {action.premium && <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"></div>}
                            <div className="relative z-10 flex justify-between items-start w-full">
                                <div className={`p-2.5 rounded-lg ${action.color === 'primary' ? 'bg-primary/20 text-primary' : `bg-${action.color}-50 dark:bg-${action.color}-900/20 text-${action.color}-500 dark:text-${action.color}-400`}`}>
                                    <span className="material-icons-round text-2xl">{action.icon}</span>
                                </div>
                                {action.premium ? (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary text-background-dark">NEW</span>
                                ) : action.badge ? (
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">{action.badge}</span>
                                ) : (
                                    <span className="material-icons-round text-gray-300 dark:text-gray-600 group-hover:text-primary transition-colors">arrow_outward</span>
                                )}
                            </div>
                            <div className="relative z-10 text-left mt-2">
                                <h4 className="font-semibold text-gray-900 dark:text-white text-lg">{action.title}</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{action.sub}</p>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Recent Alerts */}
                <div className="mt-8">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Recent Alerts</h3>
                    <div className="bg-white dark:bg-surface-dark rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                            <span className="material-icons-round text-red-500 text-lg">warning</span>
                        </div>
                        <div>
                            <h5 className="text-sm font-semibold text-gray-900 dark:text-white">Pest Alert in Region</h5>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">High probability of locust activity detected within 50km.</p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Bottom Navigation */}
            <BottomNavbar
                activeTab="farm-list"
                onNavigate={onNavigate}
            />
        </div>
    );
};

export default FarmActionCenter;
