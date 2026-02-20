import React from 'react';
import BottomNavbar from '../components/BottomNavbar';

const NotificationCentre = ({ onBack, onAlertClick, onNavigate }) => {
    const notifications = {
        today: [
            {
                id: 1,
                type: 'critical',
                title: 'Pest Outbreak Alert',
                time: '2m ago',
                desc: 'Fall Armyworm detected in nearby district (Sitapur). Immediate preventive spray recommended.',
                icon: 'warning',
                color: 'red'
            },
            {
                id: 2,
                type: 'action',
                title: 'New Subsidy Scheme',
                time: '1h ago',
                desc: 'PM-Kisan installment has been released. Check your eligibility status now.',
                icon: 'account_balance_wallet',
                color: 'primary',
                actionLabel: 'Check Status',
                unread: true
            },
            {
                id: 3,
                type: 'warning',
                title: 'Weather Update',
                time: '3h ago',
                desc: 'Heavy rainfall expected tomorrow evening. Secure your harvested crops.',
                icon: 'thunderstorm',
                color: 'amber'
            },
            {
                id: 4,
                type: 'standard',
                title: 'Soil Test Complete',
                time: '5h ago',
                desc: 'Your soil sample #4582 analysis is ready. View the report for fertilizer recommendations.',
                icon: 'science',
                color: 'gray'
            }
        ],
        earlier: [
            {
                id: 5,
                type: 'market',
                title: 'Weekly Market Report',
                time: 'Yesterday',
                desc: 'Wheat prices are up by 5% in the local mandi. Check detailed trends.',
                icon: 'trending_up',
                color: 'blue'
            },
            {
                id: 6,
                type: 'community',
                title: 'Community Reply',
                time: '2d ago',
                desc: 'Rajesh Kumar and 4 others replied to your query about organic fertilizers.',
                icon: 'forum',
                color: 'purple',
                badge: '5+'
            }
        ]
    };

    return (
        <div className="w-full max-w-md mx-auto bg-background-light dark:bg-background-dark relative min-h-screen flex flex-col font-display">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md px-5 pt-12 pb-4 border-b border-neutral-light dark:border-neutral-dark flex flex-col">
                <div className="flex justify-between items-center mb-2">
                    <button onClick={onBack} className="p-1 -ml-1 flex items-center justify-center">
                        <span className="material-icons-round text-2xl">chevron_left</span>
                    </button>
                    <button className="text-primary hover:text-green-600 dark:hover:text-green-400 text-sm font-semibold transition-colors">
                        Mark all as read
                    </button>
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Notifications</h1>
            </header>

            {/* Content Area */}
            <main className="flex-1 px-4 py-2 overflow-y-auto no-scrollbar pb-24">
                {/* Today */}
                <div className="mt-4 mb-2">
                    <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-1">Today</h2>
                    {notifications.today.map((n) => (
                        <div
                            key={n.id}
                            onClick={() => n.title === 'Weather Update' ? onAlertClick() : null}
                            className={`group relative w-full mb-3 rounded-2xl p-4 shadow-card hover:shadow-soft transition-all duration-300 border cursor-pointer ${n.type === 'critical' ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/40' : n.type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30' : 'bg-card-light dark:bg-card-dark border-neutral-light dark:border-neutral-dark'}`}
                        >
                            {n.unread && <div className="absolute top-4 right-4 w-2.5 h-2.5 bg-primary rounded-full shadow-sm ring-4 ring-card-light dark:ring-card-dark"></div>}
                            <div className="flex gap-4">
                                <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${n.color === 'red' ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400' : n.color === 'amber' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400' : 'bg-primary/10 text-primary'}`}>
                                    <span className="material-icons-round text-2xl">{n.icon}</span>
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className={`font-bold text-base leading-tight ${n.type === 'critical' ? 'text-red-900 dark:text-red-100' : n.type === 'warning' ? 'text-amber-900 dark:text-amber-100' : 'text-gray-900 dark:text-white'}`}>{n.title}</h3>
                                        <span className={`text-xs font-medium whitespace-nowrap ml-2 ${n.type === 'critical' ? 'text-red-700 dark:text-red-300' : n.type === 'warning' ? 'text-amber-700 dark:text-amber-300' : 'text-gray-400 dark:text-gray-500'}`}>{n.time}</span>
                                    </div>
                                    <p className={`text-sm mt-1 leading-snug ${n.type === 'critical' ? 'text-red-800 dark:text-red-200' : n.type === 'warning' ? 'text-amber-800 dark:text-amber-200' : 'text-gray-600 dark:text-gray-300'}`}>
                                        {n.desc}
                                    </p>
                                    {n.actionLabel && (
                                        <button className="mt-3 bg-primary hover:bg-green-500 text-black font-semibold text-xs py-2 px-4 rounded-full transition-colors inline-flex items-center gap-1 shadow-sm">
                                            {n.actionLabel}
                                            <span className="material-icons-round text-sm">arrow_forward</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Earlier */}
                <div className="mt-8 mb-2">
                    <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-1">Earlier</h2>
                    {notifications.earlier.map((n) => (
                        <div key={n.id} className="w-full mb-3 bg-card-light dark:bg-card-dark rounded-2xl shadow-card border border-neutral-light dark:border-neutral-dark p-4 group active:scale-[0.99] transition-transform">
                            <div className="flex gap-4 items-center">
                                <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center relative ${n.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'}`}>
                                    <span className="material-icons-round text-2xl">{n.icon}</span>
                                    {n.badge && (
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-background-light dark:bg-background-dark rounded-full flex items-center justify-center">
                                            <span className="text-[10px] font-bold text-gray-500">{n.badge}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-semibold text-gray-900 dark:text-white text-base">{n.title}</h3>
                                        <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">{n.time}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">{n.desc}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* Bottom Navigation */}
            <BottomNavbar
                activeTab="notifications"
                onNavigate={onNavigate}
            />
        </div>
    );
};

export default NotificationCentre;
