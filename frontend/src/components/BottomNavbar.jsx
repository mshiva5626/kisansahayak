import React from 'react';

const BottomNavbar = ({ activeTab = 'dashboard', onNavigate, onTabChange }) => {
    const handleNav = (targetId) => {
        if (onNavigate) onNavigate(targetId);
        if (onTabChange) onTabChange(targetId);
    };

    const navItems = [
        { id: 'dashboard', icon: 'home', label: 'Home' },
        { id: 'priority-tasks', icon: 'task_alt', label: 'Tasks' },
        { id: 'scanner', icon: 'qr_code_scanner', label: 'Scan', isCenter: true },
        { id: 'schemes', icon: 'assignment', label: 'Schemes' },
        { id: 'account-info', icon: 'person', label: 'Profile' }
    ];

    // Determine active state with aliases (e.g. soil-test/soil-intelligence/scan maps to scanner)
    const isItemActive = (itemId) => {
        if (activeTab === itemId) return true;
        if (itemId === 'dashboard' && (activeTab === 'home' || !activeTab)) return true;
        if (itemId === 'scanner' && (activeTab === 'scan' || activeTab === 'soil-test' || activeTab === 'soil-intelligence')) return true;
        return false;
    };

    return (
        <div className="fixed bottom-3 inset-x-0 max-w-md mx-auto px-4 z-40 flex justify-center pointer-events-none">
            <nav className="pointer-events-auto bg-white border border-slate-200/90 rounded-[28px] px-2 py-1.5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.12),0_8px_10px_-6px_rgba(0,0,0,0.06)] flex items-center justify-between gap-1 w-full max-w-[390px] transition-all">
                {navItems.map((item) => {
                    const active = isItemActive(item.id);

                    if (item.isCenter) {
                        return (
                            <div key={item.id} className="relative -top-2 flex flex-col items-center">
                                <button
                                    onClick={() => handleNav(item.id)}
                                    className={`w-13 h-13 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-200 active:scale-90 cursor-pointer ring-4 ring-white ${
                                        active
                                            ? 'bg-emerald-600 shadow-emerald-600/40 ring-emerald-100'
                                            : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                                    }`}
                                    title={item.label}
                                >
                                    <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                                </button>
                                <span className="text-[10px] font-bold text-emerald-700 mt-0.5 tracking-tight">
                                    {item.label}
                                </span>
                            </div>
                        );
                    }

                    return (
                        <button
                            key={item.id}
                            onClick={() => handleNav(item.id)}
                            className={`flex-1 py-1 px-1.5 flex flex-col items-center justify-center rounded-2xl transition-all duration-200 cursor-pointer active:scale-95 ${
                                active
                                    ? 'text-emerald-700 bg-emerald-50/80 font-bold'
                                    : 'text-slate-500 hover:text-slate-800 font-medium'
                            }`}
                        >
                            <span className={`material-symbols-outlined text-[22px] transition-transform ${active ? 'scale-110' : ''}`}>
                                {item.icon}
                            </span>
                            <span className={`text-[10px] mt-0.5 tracking-tight ${active ? 'font-bold text-emerald-800' : 'text-slate-500'}`}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </nav>
        </div>
    );
};

export default BottomNavbar;
