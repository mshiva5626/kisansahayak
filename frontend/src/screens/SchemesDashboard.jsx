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
        if (scheme.scheme_type === 'central') return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    };

    return (
        <div className="relative flex h-screen w-full flex-col overflow-hidden max-w-md mx-auto bg-gradient-to-b from-[#fcfdfc] to-[#e3eae4] dark:from-[#03140A] dark:to-[#081d11] font-display text-slate-900 dark:text-slate-100 antialiased">
            {/* Header Section */}
            <header className="relative bg-gradient-to-b from-[#03140A] to-[#083D20] text-white pb-6 pt-12 px-5 rounded-b-[2rem] border-b border-emerald-500/10 shadow-lg z-10 overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl pointer-events-none"></div>

                <div className="flex items-center justify-between mb-5 relative z-10">
                    <div className="flex items-center gap-2 text-white">
                        <button onClick={onBack} className="mr-2 p-2 bg-white/10 hover:bg-white/20 active:scale-95 rounded-full transition-all flex items-center justify-center tactile-btn">
                            <span className="material-icons text-xl text-white">arrow_back</span>
                        </button>
                        <span className="material-icons text-2xl text-emerald-400">gavel</span>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Sarkari Yojana</span>
                            <div className="flex items-center gap-1 font-extrabold text-base leading-none">
                                Government Schemes
                            </div>
                        </div>
                    </div>
                    <button onClick={onNotificationClick} className="relative p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white tactile-btn">
                        <span className="material-icons text-white">notifications</span>
                        <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full"></span>
                    </button>
                </div>

                <div className="flex justify-between items-center mb-4 relative z-10">
                    <p className="text-xs text-emerald-300 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                        {schemes.length} schemes available{userProfile?.state ? ` for ${userProfile.state}` : ''}
                    </p>
                </div>

                <div className="relative z-10">
                    <div className="relative flex w-full items-center">
                        <div className="absolute left-4 flex items-center justify-center text-emerald-600 dark:text-emerald-500">
                            <span className="material-icons text-[20px]">search</span>
                        </div>
                        <input
                            className="w-full rounded-xl border-none bg-white dark:bg-white/10 backdrop-blur-md py-3 pl-12 pr-4 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-350 focus:ring-2 focus:ring-emerald-500/50 shadow-soft text-sm font-semibold outline-none transition-all"
                            placeholder="Search schemes or eligibility..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            type="text"
                        />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto no-scrollbar pb-24 z-20 relative">
                {/* Central / State Tabs */}
                <div className="px-5 my-5">
                    <div className="flex bg-white/40 dark:bg-white/5 border border-white/60 dark:border-white/10 p-1 rounded-2xl backdrop-blur-md">
                        <button
                            onClick={() => setActiveTab('central')}
                            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-extrabold tracking-wide uppercase transition-all duration-200 text-center tactile-btn ${activeTab === 'central'
                                ? 'bg-emerald-500 text-slate-900 shadow-sm ring-1 ring-emerald-400 font-black'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                }`}
                        >
                            Central ({schemes.filter(s => s.scheme_type === 'central').length})
                        </button>
                        <button
                            onClick={() => setActiveTab('state')}
                            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-extrabold tracking-wide uppercase transition-all duration-200 text-center tactile-btn ${activeTab === 'state'
                                ? 'bg-emerald-500 text-slate-900 shadow-sm ring-1 ring-emerald-400 font-black'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                }`}
                        >
                            State ({schemes.filter(s => s.scheme_type === 'state').length})
                        </button>
                    </div>
                </div>

                {/* Categories Selector */}
                <div className="flex overflow-x-auto gap-2 px-5 pb-4 no-scrollbar">
                    {categories.map((cat) => {
                        const isSelected = activeCategory === cat;
                        return (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`snap-start shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all border tactile-btn ${
                                    isSelected
                                        ? 'bg-emerald-500 text-slate-900 border-emerald-400 shadow-sm ring-2 ring-emerald-500/25'
                                        : 'bg-white/40 dark:bg-white/5 text-slate-600 dark:text-slate-350 border-white/50 dark:border-white/10 hover:bg-white/60'
                                }`}
                            >
                                {cat}
                            </button>
                        );
                    })}
                </div>

                {/* Loading */}
                {isLoading && (
                    <div className="px-5 space-y-5 py-4 mt-2">
                        <style>{`
                            @keyframes shimmerSlide {
                                100% { transform: translateX(100%); }
                            }
                        `}</style>
                        <div className="flex flex-col items-center justify-center py-8 px-6 text-center mb-4 krishi-glass rounded-3xl border-emerald-500/20 shadow-md">
                            <div className="relative flex justify-center items-center w-20 h-20 mb-4">
                                <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin"></div>
                                <div className="absolute inset-3 rounded-full border-4 border-[#56fa8a]/20 border-b-[#56fa8a] animate-[spin_1.5s_reverse_infinite]"></div>
                                <span className="material-icons-round text-emerald-400 text-3xl drop-shadow-[0_2px_5px_rgba(14,208,84,0.3)]">smart_toy</span>
                            </div>
                            <h3 className="font-extrabold text-slate-800 dark:text-white text-lg">Curating Live Schemes</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-[250px] leading-relaxed">
                                Scanning government databases to match benefits with your agricultural profile...
                            </p>
                        </div>
                        {[1, 2].map((i) => (
                            <div key={i} className="krishi-glass rounded-3xl p-5 shadow-soft border border-white/40 dark:border-white/5 relative overflow-hidden">
                                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 dark:via-white/5 to-transparent z-10" style={{ animation: 'shimmerSlide 2s infinite' }}></div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-16 h-5 bg-emerald-500/20 dark:bg-emerald-500/10 rounded-md animate-pulse"></div>
                                    <div className="w-20 h-3 bg-slate-200 dark:bg-slate-700/50 rounded-md"></div>
                                </div>
                                <div className="w-3/4 h-5 bg-slate-350 dark:bg-slate-650 rounded-md mb-3 animate-pulse"></div>
                                <div className="space-y-2 mb-4">
                                    <div className="w-full h-3 bg-slate-200 dark:bg-slate-800/50 rounded-md"></div>
                                    <div className="w-5/6 h-3 bg-slate-200 dark:bg-slate-800/50 rounded-md"></div>
                                </div>
                                <div className="w-full h-16 bg-slate-100 dark:bg-slate-900/50 rounded-xl mb-3"></div>
                                <div className="flex justify-between items-center mt-4">
                                    <div className="w-24 h-4 bg-slate-200 dark:bg-slate-700/50 rounded-md"></div>
                                    <div className="w-24 h-8 bg-emerald-500/20 dark:bg-emerald-500/10 rounded-lg"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="mx-5 my-8 text-center krishi-glass rounded-3xl p-6 border border-rose-500/20 shadow-md">
                        <span className="material-icons text-4xl text-rose-500 mb-2 block">error_outline</span>
                        <p className="text-sm font-semibold text-slate-600 dark:text-slate-350">{error}</p>
                    </div>
                )}

                {/* Schemes List */}
                {!isLoading && !error && (
                    <div className="px-5 space-y-5">
                        {filteredSchemes.length === 0 ? (
                            <div className="text-center py-16 krishi-glass rounded-3xl border-dashed border-2 border-slate-350 dark:border-white/10">
                                <span className="material-icons text-5xl text-slate-300 dark:text-slate-600 mb-3 block">search_off</span>
                                <p className="text-slate-500 dark:text-slate-450 text-sm font-semibold">No schemes found{searchQuery ? ` for "${searchQuery}"` : ''}</p>
                            </div>
                        ) : (
                            filteredSchemes.map((scheme) => (
                                <div
                                    key={scheme._id}
                                    className="tilt-card-container animate-fade-in"
                                >
                                    <div className="tilt-card krishi-glass rounded-3xl p-5 border border-white/50 dark:border-white/10 relative overflow-hidden group">
                                        {/* Subtle green ambient card glow */}
                                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform pointer-events-none"></div>

                                        <div className="flex justify-between items-start mb-3.5 relative z-10">
                                            <span className={`${getTagColor(scheme)} text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg shadow-sm border border-emerald-500/15`}>
                                                {scheme.scheme_type === 'central' ? '⚽ Central Scheme' : `🏛️ ${scheme.state}`}
                                            </span>
                                            {scheme.ministry && (
                                                <span className="text-[10px] text-slate-450 dark:text-slate-400 max-w-[50%] text-right font-semibold truncate">
                                                    {scheme.ministry}
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug mb-2.5 pr-4 group-hover:text-emerald-500 transition-colors">
                                            {scheme.name}
                                        </h3>

                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed font-medium line-clamp-2">
                                            {scheme.benefits}
                                        </p>

                                        {/* Eligibility */}
                                        {scheme.eligibility && (
                                            <div className="bg-white/40 dark:bg-white/5 border border-white/40 dark:border-white/5 rounded-2xl p-3 mb-3.5">
                                                <p className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-400 mb-1 tracking-widest flex items-center gap-1">
                                                    <span className="material-icons text-[12px] text-amber-500">assignment_turned_in</span>
                                                    Eligibility (पात्रता)
                                                </p>
                                                <p className="text-xs text-slate-650 dark:text-slate-355 line-clamp-2 leading-normal">{scheme.eligibility}</p>
                                            </div>
                                        )}

                                        {/* How to Apply */}
                                        {scheme.application_guidance && (
                                            <div className="bg-emerald-500/5 dark:bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-3 mb-4">
                                                <p className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 mb-1 tracking-widest flex items-center gap-1">
                                                    <span className="material-icons text-[12px]">directions</span>
                                                    How to Apply (आवेदन प्रक्रिया)
                                                </p>
                                                <p className="text-xs text-slate-650 dark:text-slate-355 line-clamp-2 leading-normal">{scheme.application_guidance}</p>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between mt-auto relative z-10 pt-2 border-t border-slate-150 dark:border-white/5">
                                            <div className="flex items-center text-xs text-slate-450 dark:text-slate-400 font-semibold">
                                                <span className="material-icons text-sm mr-1 text-emerald-400 animate-pulse">verified</span>
                                                Government Verified
                                            </div>
                                            {scheme.website_url ? (
                                                <a
                                                    href={scheme.website_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-extrabold text-xs py-2.5 px-4.5 rounded-xl shadow-md transition-all active:scale-95 inline-flex items-center gap-1.5 tactile-btn ring-1 ring-emerald-400"
                                                >
                                                    Apply Online
                                                    <span className="material-icons text-[13px]">open_in_new</span>
                                                </a>
                                            ) : (
                                                <button className="bg-slate-200 dark:bg-slate-800 text-slate-450 dark:text-slate-500 text-xs py-2 px-4 rounded-xl cursor-not-allowed">
                                                    Details Offline
                                                </button>
                                            )}
                                        </div>
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
                    className="absolute bottom-24 right-5 copilot-3d-orb text-slate-900 w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-30"
                >
                    <span className="material-icons-round text-2xl text-slate-950 font-bold">smart_toy</span>
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
