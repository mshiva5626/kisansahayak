import React, { useState, useEffect } from 'react';
import BottomNavbar from '../components/BottomNavbar';
import { schemeAPI } from '../api';
import SchemeChatModal from '../components/SchemeChatModal';

const SchemesDashboard = ({ onBack, onNotificationClick, onNavigate, userProfile }) => {
    const [schemes, setSchemes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('central'); // 'central' | 'state'
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [isChatOpen, setIsChatOpen] = useState(false);

    const categories = ['All', 'Income Support', 'Insurance', 'Loan', 'Subsidy', 'Organic'];

    useEffect(() => {
        const fetchSchemes = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const state = userProfile?.state || '';
                const { data } = await schemeAPI.getRealtimeSchemes(state);
                setSchemes(data.schemes || []);
            } catch (err) {
                console.error('Schemes fetch error:', err);
                setError('Failed to load schemes. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchSchemes();
    }, [userProfile?.state]);

    // Filter schemes by tab, search, and category
    const filteredSchemes = schemes.filter(scheme => {
        // Tab filter
        if (activeTab === 'central' && scheme.scheme_type !== 'central') return false;
        if (activeTab === 'state' && scheme.scheme_type !== 'state') return false;

        // Search filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const matchesName = (scheme.name || '').toLowerCase().includes(q);
            const matchesBenefits = (scheme.benefits || '').toLowerCase().includes(q);
            const matchesState = (scheme.state || '').toLowerCase().includes(q);
            if (!matchesName && !matchesBenefits && !matchesState) return false;
        }

        // Category filter
        if (activeCategory !== 'All') {
            const cat = activeCategory.toLowerCase();
            const name = (scheme.name || '').toLowerCase();
            const benefits = (scheme.benefits || '').toLowerCase();
            if (!name.includes(cat) && !benefits.includes(cat) && !(scheme.ministry || '').toLowerCase().includes(cat)) {
                return false;
            }
        }

        return true;
    });

    // Tag color by scheme type
    const getTagColor = (scheme) => {
        if (scheme.scheme_type === 'central') return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
    };

    return (
        <div className="flex flex-col h-screen bg-background-light dark:bg-background-dark font-display text-gray-800 dark:text-gray-100 overflow-hidden">
            {/* Header */}
            <header className="bg-surface-light dark:bg-surface-dark px-5 pt-12 pb-4 flex justify-between items-center shadow-sm z-10 sticky top-0">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <span className="material-icons text-gray-600 dark:text-gray-300">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Government Schemes</h1>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {schemes.length} schemes available{userProfile?.state ? ` for ${userProfile.state}` : ''}
                        </p>
                    </div>
                </div>
                <button onClick={onNotificationClick} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative">
                    <span className="material-icons text-gray-600 dark:text-gray-300">notifications</span>
                </button>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto no-scrollbar pb-24">
                {/* Search */}
                <div className="px-5 py-4 bg-surface-light dark:bg-surface-dark mb-4 shadow-sm">
                    <div className="relative">
                        <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">search</span>
                        <input
                            className="w-full bg-gray-50 dark:bg-background-dark border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/50 text-gray-700 dark:text-gray-200 placeholder-gray-400"
                            placeholder="Search schemes..."
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Central / State Tabs */}
                <div className="px-5 mb-6">
                    <div className="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-xl">
                        <button
                            onClick={() => setActiveTab('central')}
                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-200 text-center ${activeTab === 'central'
                                ? 'bg-surface-light dark:bg-surface-dark shadow-sm text-gray-900 dark:text-white'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                }`}
                        >
                            Central ({schemes.filter(s => s.scheme_type === 'central').length})
                        </button>
                        <button
                            onClick={() => setActiveTab('state')}
                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-200 text-center ${activeTab === 'state'
                                ? 'bg-surface-light dark:bg-surface-dark shadow-sm text-gray-900 dark:text-white'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                }`}
                        >
                            State ({schemes.filter(s => s.scheme_type === 'state').length})
                        </button>
                    </div>
                </div>

                {/* Loading */}
                {isLoading && (
                    <div className="px-5 space-y-4 py-4 mt-2">
                        <style>{`
                            @keyframes shimmerSlide {
                                100% { transform: translateX(100%); }
                            }
                        `}</style>
                        <div className="flex flex-col items-center justify-center py-6 px-6 text-center mb-2 animate-pulse">
                            <div className="relative flex justify-center items-center w-16 h-16 mb-4">
                                <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                                <div className="absolute inset-2 rounded-full border-4 border-[#13ec13]/20 border-b-[#13ec13] animate-[spin_1.5s_reverse_infinite]"></div>
                                <span className="material-icons-round text-primary text-2xl drop-shadow-sm">smart_toy</span>
                            </div>
                            <h3 className="font-bold text-gray-800 dark:text-gray-200 text-lg">Curating AI Schemes</h3>
                            <p className="text-xs text-gray-500 mt-2 max-w-[250px]">Scanning government databases to find maximum benefits for your profile...</p>
                        </div>
                        {[1, 2].map((i) => (
                            <div key={i} className="bg-surface-light dark:bg-surface-dark rounded-2xl p-5 shadow-soft border border-gray-100 dark:border-gray-800 relative overflow-hidden">
                                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 dark:via-white/5 to-transparent z-10" style={{ animation: 'shimmerSlide 2s infinite' }}></div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-16 h-5 bg-gray-200 dark:bg-gray-700/50 rounded-md"></div>
                                    <div className="w-20 h-3 bg-gray-200 dark:bg-gray-700/50 rounded-md"></div>
                                </div>
                                <div className="w-3/4 h-5 bg-gray-200 dark:bg-gray-700/50 rounded-md mb-3"></div>
                                <div className="space-y-2 mb-4">
                                    <div className="w-full h-3 bg-gray-100 dark:bg-gray-800/50 rounded-md"></div>
                                    <div className="w-5/6 h-3 bg-gray-100 dark:bg-gray-800/50 rounded-md"></div>
                                </div>
                                <div className="w-full h-16 bg-gray-50 dark:bg-gray-800/30 rounded-lg mb-3"></div>
                                <div className="flex justify-between items-center mt-4">
                                    <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700/50 rounded-md"></div>
                                    <div className="w-24 h-8 bg-primary/20 dark:bg-primary/10 rounded-lg"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="px-5 py-8 text-center">
                        <span className="material-icons text-4xl text-gray-300 dark:text-gray-600 mb-2 block">error_outline</span>
                        <p className="text-sm text-gray-500">{error}</p>
                    </div>
                )}

                {/* Schemes List */}
                {!isLoading && !error && (
                    <div className="px-5 space-y-4">
                        {filteredSchemes.length === 0 ? (
                            <div className="text-center py-12">
                                <span className="material-icons text-5xl text-gray-300 dark:text-gray-600 mb-3 block">search_off</span>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">No schemes found{searchQuery ? ` for "${searchQuery}"` : ''}</p>
                            </div>
                        ) : (
                            filteredSchemes.map((scheme) => (
                                <div
                                    key={scheme._id}
                                    className="bg-surface-light dark:bg-surface-dark rounded-2xl p-5 shadow-soft border border-gray-100 dark:border-gray-800 relative overflow-hidden group"
                                >
                                    <div className="flex justify-between items-start mb-3 relative z-10">
                                        <span className={`${getTagColor(scheme)} text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md`}>
                                            {scheme.scheme_type === 'central' ? 'Central' : scheme.state}
                                        </span>
                                        {scheme.ministry && (
                                            <span className="text-[10px] text-gray-400 max-w-[40%] text-right truncate">
                                                {scheme.ministry}
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight mb-2 pr-4">{scheme.name}</h3>

                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                                        {scheme.benefits}
                                    </p>

                                    {/* Eligibility */}
                                    {scheme.eligibility && (
                                        <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-3 mb-3">
                                            <p className="text-[10px] font-bold uppercase text-gray-400 mb-1 tracking-wider">Eligibility</p>
                                            <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">{scheme.eligibility}</p>
                                        </div>
                                    )}

                                    {/* How to Apply */}
                                    {scheme.application_guidance && (
                                        <div className="bg-primary/5 rounded-lg p-3 mb-3">
                                            <p className="text-[10px] font-bold uppercase text-primary mb-1 tracking-wider">How to Apply</p>
                                            <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">{scheme.application_guidance}</p>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between mt-auto">
                                        <div className="flex items-center text-xs text-gray-400 font-medium">
                                            <span className="material-icons text-sm mr-1">verified</span>
                                            Government Verified
                                        </div>
                                        {scheme.website_url ? (
                                            <a
                                                href={scheme.website_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="bg-primary hover:bg-green-400 text-black font-semibold text-sm py-2 px-5 rounded-lg shadow-sm transition-all active:scale-95 inline-flex items-center gap-1"
                                            >
                                                Apply Now
                                                <span className="material-icons text-sm">open_in_new</span>
                                            </a>
                                        ) : (
                                            <button className="bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm py-2 px-5 rounded-lg cursor-not-allowed">
                                                Details Unavailable
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </main>

            {/* Floating Chat Button */}
            {!isLoading && !error && schemes.length > 0 && (
                <button
                    onClick={() => setIsChatOpen(true)}
                    className="absolute bottom-24 right-5 bg-gradient-to-r from-primary to-green-500 text-slate-900 w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-30"
                >
                    <span className="material-icons-round text-2xl">smart_toy</span>
                </button>
            )}

            {/* AI Assistant Modal */}
            <SchemeChatModal
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                schemesContext={filteredSchemes}
                userProfile={userProfile}
            />

            {/* Bottom Nav */}
            <BottomNavbar activeTab="schemes" onNavigate={onNavigate} />
        </div>
    );
};

export default SchemesDashboard;
