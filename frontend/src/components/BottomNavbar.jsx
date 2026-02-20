import React from 'react';

const BottomNavbar = ({ activeTab, onNavigate }) => {
    const navItems = [
        { id: 'dashboard', icon: 'home', label: 'Home' },
        { id: 'schemes', icon: 'assignment', label: 'Schemes' },
        { id: 'farm-wizard', icon: 'add', label: 'Add', isCenter: true },
        { id: 'farm-list', icon: 'agriculture', label: 'Farms' },
        { id: 'account-info', icon: 'person', label: 'Profile' }
    ];

    return (
        <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 animate-fade-in-up">
            <nav className="glass-panel backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 rounded-full px-2 py-2 shadow-glass flex items-center gap-1 border border-white/40 dark:border-white/10">
                {navItems.map((item) => {
                    if (item.isCenter) {
                        return (
                            <div key={item.id} className="mx-1">
                                <button
                                    onClick={() => onNavigate(item.id)}
                                    className="w-12 h-12 bg-primary hover:bg-primary-dark rounded-full shadow-lg shadow-primary/40 flex items-center justify-center transform hover:-translate-y-1 active:scale-90 transition-all duration-300 text-white"
                                >
                                    <span className="material-icons-round text-3xl">{item.icon}</span>
                                </button>
                            </div>
                        );
                    }

                    const isActive = activeTab === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className={`relative flex flex-col items-center justify-center transition-all duration-300 px-4 py-1 min-w-[64px] ${isActive
                                ? 'text-primary'
                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                                }`}
                        >
                            <span className="material-icons-round text-2xl mb-1">{item.icon}</span>
                            <span className={`text-[10px] font-bold tracking-tight uppercase transition-colors ${isActive ? 'text-primary' : 'text-gray-400'}`}>
                                {item.label}
                            </span>
                            {isActive && (
                                <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full"></span>
                            )}
                        </button>
                    );
                })}
            </nav>
        </div>
    );
};

export default BottomNavbar;
