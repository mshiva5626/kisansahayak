import React, { useState, useEffect } from 'react';
import { amiAPI } from '../api';
import BottomNavbar from '../components/BottomNavbar';

const AMIInsightCenter = ({ onBack, onNavigate, userProfile }) => {
    const [summary, setSummary] = useState(null);
    const [statesAndDistricts, setStatesAndDistricts] = useState({});
    const [projects, setProjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter & Search states
    const [activeTab, setActiveTab] = useState('search'); // 'search' | 'odisha' | 'warehouses' | 'startups' | 'top-loans' | 'disbursed'
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedState, setSelectedState] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [selectedBeneficiaryType, setSelectedBeneficiaryType] = useState('');
    const [sortBy, setSortBy] = useState('loan_desc');

    const beneficiaryTypes = [
        'All',
        'Farmer',
        'Agri-Entrepreneur',
        'Startup',
        'Marketing Cooperative Society',
        'Agricultural Produce Market Committee (APMC)'
    ];

    // Load initial data (summary and states-districts map)
    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const [summaryRes, statesRes] = await Promise.all([
                    amiAPI.getSummary(),
                    amiAPI.getStatesAndDistricts()
                ]);
                setSummary(summaryRes.data.summary);
                setStatesAndDistricts(statesRes.data.statesAndDistricts);
            } catch (err) {
                console.error('Error loading AMI initial data:', err);
                setError('Failed to load database. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };
        loadInitialData();
    }, []);

    // Load projects list whenever tab, filters, search or sort parameters change
    useEffect(() => {
        const fetchProjects = async () => {
            setIsLoading(true);
            try {
                const params = {
                    search: searchQuery,
                    sortBy
                };

                // Apply filters based on selected tab or dropdown values
                if (activeTab === 'odisha') {
                    params.state = 'ODISHA';
                } else if (activeTab === 'warehouses') {
                    params.projectType = 'warehouse';
                } else if (activeTab === 'startups') {
                    params.beneficiaryType = 'Startup';
                } else if (activeTab === 'disbursed') {
                    params.status = 'disbursed';
                } else if (activeTab === 'top-loans') {
                    params.limit = 15;
                    params.sortBy = 'loan_desc';
                }

                // If in default search tab, apply custom select filters
                if (activeTab === 'search') {
                    if (selectedState) params.state = selectedState;
                    if (selectedDistrict) params.district = selectedDistrict;
                    if (selectedBeneficiaryType && selectedBeneficiaryType !== 'All') {
                        params.beneficiaryType = selectedBeneficiaryType;
                    }
                }

                const { data } = await amiAPI.getProjects(params);
                setProjects(data.projects || []);
            } catch (err) {
                console.error('Error fetching projects:', err);
                setError('Failed to fetch project listings.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProjects();
    }, [activeTab, searchQuery, selectedState, selectedDistrict, selectedBeneficiaryType, sortBy]);

    // Reset district if state changes
    const handleStateChange = (stateName) => {
        setSelectedState(stateName);
        setSelectedDistrict('');
    };

    // Indian style Currency formatter
    const formatINR = (value) => {
        if (!value) return '₹0';
        if (value >= 10000000) {
            return `₹${(value / 10000000).toFixed(2)} Cr`;
        }
        if (value >= 100000) {
            return `₹${(value / 100000).toFixed(2)} L`;
        }
        return `₹${value.toLocaleString('en-IN')}`;
    };

    const tabs = [
        { id: 'search', label: 'Explore All', icon: 'search' },
        { id: 'odisha', label: 'Odisha', icon: 'map' },
        { id: 'warehouses', label: 'Warehouses', icon: 'warehouse' },
        { id: 'startups', label: 'Startups', icon: 'rocket_launch' },
        { id: 'top-loans', label: 'Top Loans', icon: 'payments' },
        { id: 'disbursed', label: 'Disbursed', icon: 'task_alt' }
    ];

    return (
        <div className="relative flex h-screen w-full flex-col overflow-hidden max-w-md mx-auto bg-gradient-to-b from-[#fcfdfc] to-[#e3eae4] dark:from-[#03140A] dark:to-[#081d11] font-display text-slate-900 dark:text-slate-100 antialiased">
            {/* Header Section */}
            <header className="relative bg-gradient-to-b from-[#03140A] to-[#083D20] text-white pb-5 pt-12 px-5 rounded-b-[2rem] border-b border-emerald-500/10 shadow-lg z-10 overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl pointer-events-none"></div>

                <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="flex items-center gap-2 text-white">
                        <button onClick={onBack} className="mr-2 p-2 bg-white/10 hover:bg-white/20 active:scale-95 rounded-full transition-all flex items-center justify-center tactile-btn">
                            <span className="material-icons text-xl text-white">arrow_back</span>
                        </button>
                        <span className="material-icons text-2xl text-emerald-400">account_balance</span>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest">AIF Infrastructure</span>
                            <div className="flex items-center gap-1 font-extrabold text-base leading-none">
                                AIF Database Insights
                            </div>
                        </div>
                    </div>
                </div>

                <p className="text-xs text-emerald-300 font-medium mb-4 leading-normal relative z-10">
                    Explore official Agriculture Infrastructure Fund disbursements, agtech startups, and local infrastructure projects.
                </p>

                {/* Search Box */}
                <div className="relative z-10">
                    <div className="relative flex w-full items-center">
                        <div className="absolute left-4 flex items-center justify-center text-emerald-600 dark:text-emerald-500">
                            <span className="material-symbols-outlined text-[20px]">search</span>
                        </div>
                        <input
                            className="w-full rounded-2xl border-none bg-white dark:bg-white/10 backdrop-blur-md py-3 pl-12 pr-4 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-350 focus:ring-2 focus:ring-emerald-500/50 shadow-soft text-sm font-semibold outline-none transition-all"
                            placeholder="Search by beneficiary name or village..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            type="text"
                        />
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto no-scrollbar pb-24 z-20 relative">
                {/* Statistics Deck (Only show summary on loading success) */}
                {summary && !error && (
                    <div className="px-5 mt-5 grid grid-cols-2 gap-3 shrink-0">
                        {/* Funding Stats */}
                        <div className="krishi-glass dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-2xl p-4.5 shadow-sm text-left relative overflow-hidden group">
                            <div className="absolute -right-5 -bottom-5 text-emerald-500/5 dark:text-emerald-500/10 group-hover:scale-110 transition-transform">
                                <span className="material-icons text-[72px]">payments</span>
                            </div>
                            <span className="block text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">Total Loan Approved</span>
                            <span className="text-lg font-black text-emerald-600 dark:text-[#0ED054]">{formatINR(summary.totalApprovedLoanAmount)}</span>
                            <span className="block text-[9px] text-gray-400 mt-1 font-medium">For {summary.totalProjects} national projects</span>
                        </div>

                        {/* Odisha Stats */}
                        <div className="krishi-glass dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-2xl p-4.5 shadow-sm text-left relative overflow-hidden group">
                            <div className="absolute -right-5 -bottom-5 text-[#EAB308]/5 dark:text-[#EAB308]/10 group-hover:scale-110 transition-transform">
                                <span className="material-icons text-[72px]">map</span>
                            </div>
                            <span className="block text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">Odisha Projects</span>
                            <span className="text-lg font-black text-[#EAB308]">{summary.odishaCount} Active</span>
                            <span className="block text-[9px] text-gray-400 mt-1 font-medium">In Odisha State Registry</span>
                        </div>

                        {/* Warehouses Stats */}
                        <div className="krishi-glass dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-2xl p-4.5 shadow-sm text-left relative overflow-hidden group">
                            <div className="absolute -right-5 -bottom-5 text-blue-500/5 dark:text-blue-500/10 group-hover:scale-110 transition-transform">
                                <span className="material-icons text-[72px]">warehouse</span>
                            </div>
                            <span className="block text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">Warehouses / Storage</span>
                            <span className="text-lg font-black text-blue-600 dark:text-blue-400">{summary.warehousesCount} Units</span>
                            <span className="block text-[9px] text-gray-400 mt-1 font-medium">Securing local harvest</span>
                        </div>

                        {/* Startup Stats */}
                        <div className="krishi-glass dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-2xl p-4.5 shadow-sm text-left relative overflow-hidden group">
                            <div className="absolute -right-5 -bottom-5 text-purple-500/5 dark:text-purple-500/10 group-hover:scale-110 transition-transform">
                                <span className="material-icons text-[72px]">rocket_launch</span>
                            </div>
                            <span className="block text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">Agtech Startups</span>
                            <span className="text-lg font-black text-purple-600 dark:text-purple-400">{summary.startupsCount} Innovations</span>
                            <span className="block text-[9px] text-gray-400 mt-1 font-medium">With AIF Seed/Loan Capital</span>
                        </div>
                    </div>
                )}

                {/* Sublist Tabs Slider */}
                <div className="flex overflow-x-auto gap-2 px-5 py-4 no-scrollbar">
                    {tabs.map((tab) => {
                        const isSelected = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    // Reset sorting to default when changing tabs
                                    if (tab.id === 'top-loans') {
                                        setSortBy('loan_desc');
                                    }
                                }}
                                className={`snap-start shrink-0 px-4 py-2.5 rounded-full text-xs font-extrabold transition-all border flex items-center gap-1.5 tactile-btn ${
                                    isSelected
                                        ? 'bg-emerald-500 text-slate-900 border-emerald-400 shadow-sm ring-2 ring-emerald-500/25'
                                        : 'bg-white/40 dark:bg-white/5 text-slate-650 dark:text-slate-350 border-white/50 dark:border-white/10 hover:bg-white/60'
                                }`}
                            >
                                <span className="material-icons text-sm">{tab.icon}</span>
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Custom Filters (Only displayed on the "Explore All" tab) */}
                {activeTab === 'search' && !error && (
                    <div className="px-5 mb-5 space-y-3">
                        <div className="bg-white/40 dark:bg-white/5 border border-white/50 dark:border-white/10 rounded-3xl p-4 backdrop-blur-md">
                            <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-3">Filter Directory</span>
                            <div className="grid grid-cols-2 gap-3">
                                {/* State Select */}
                                <div className="text-left">
                                    <label className="block text-[9px] text-gray-400 font-bold mb-1 uppercase">State</label>
                                    <select
                                        className="w-full text-xs font-semibold bg-white/60 dark:bg-[#0c1e13] border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 outline-none text-slate-800 dark:text-slate-200"
                                        value={selectedState}
                                        onChange={(e) => handleStateChange(e.target.value)}
                                    >
                                        <option value="">All States</option>
                                        {Object.keys(statesAndDistricts).sort().map((stateName) => (
                                            <option key={stateName} value={stateName}>{stateName}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* District Select */}
                                <div className="text-left">
                                    <label className="block text-[9px] text-gray-400 font-bold mb-1 uppercase">District</label>
                                    <select
                                        className="w-full text-xs font-semibold bg-white/60 dark:bg-[#0c1e13] border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 outline-none text-slate-800 dark:text-slate-200 disabled:opacity-50"
                                        value={selectedDistrict}
                                        onChange={(e) => setSelectedDistrict(e.target.value)}
                                        disabled={!selectedState}
                                    >
                                        <option value="">All Districts</option>
                                        {selectedState && statesAndDistricts[selectedState] && 
                                            statesAndDistricts[selectedState].map((distName) => (
                                                <option key={distName} value={distName}>{distName}</option>
                                            ))
                                        }
                                    </select>
                                </div>

                                {/* Beneficiary Type Select */}
                                <div className="text-left col-span-2">
                                    <label className="block text-[9px] text-gray-400 font-bold mb-1 uppercase">Beneficiary Category</label>
                                    <select
                                        className="w-full text-xs font-semibold bg-white/60 dark:bg-[#0c1e13] border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 outline-none text-slate-800 dark:text-slate-200"
                                        value={selectedBeneficiaryType}
                                        onChange={(e) => setSelectedBeneficiaryType(e.target.value)}
                                    >
                                        {beneficiaryTypes.map((type) => (
                                            <option key={type} value={type === 'All' ? '' : type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Sort Toggle */}
                        <div className="flex items-center justify-between text-xs px-1">
                            <span className="text-slate-450 font-bold">Sort Listings</span>
                            <div className="flex bg-white/40 dark:bg-white/5 p-0.5 rounded-lg border border-white/50 dark:border-white/10">
                                <button
                                    onClick={() => setSortBy('loan_desc')}
                                    className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-wider transition-all ${
                                        sortBy === 'loan_desc'
                                            ? 'bg-emerald-500 text-slate-900 shadow-sm'
                                            : 'text-gray-400 hover:text-gray-200'
                                    }`}
                                >
                                    Max Loan
                                </button>
                                <button
                                    onClick={() => setSortBy('cost_desc')}
                                    className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-wider transition-all ${
                                        sortBy === 'cost_desc'
                                            ? 'bg-emerald-500 text-slate-900 shadow-sm'
                                            : 'text-gray-400 hover:text-gray-200'
                                    }`}
                                >
                                    Max Cost
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading / Error States */}
                {isLoading && projects.length === 0 && (
                    <div className="px-5 py-12 text-center flex flex-col items-center justify-center">
                        <div className="relative flex justify-center items-center w-16 h-16 mb-4">
                            <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin"></div>
                            <span className="material-icons-round text-emerald-400 text-2xl animate-pulse">account_balance</span>
                        </div>
                        <h3 className="font-extrabold text-slate-800 dark:text-white text-sm">Querying AIF Database</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[200px] leading-relaxed">
                            Loading official records matching your current filters...
                        </p>
                    </div>
                )}

                {error && (
                    <div className="mx-5 my-8 text-center krishi-glass rounded-3xl p-6 border border-rose-500/20 shadow-md">
                        <span className="material-icons text-4xl text-rose-500 mb-2 block">error_outline</span>
                        <p className="text-sm font-semibold text-slate-600 dark:text-slate-350">{error}</p>
                    </div>
                )}

                {/* Projects Listings */}
                {!error && (
                    <div className="px-5 space-y-4">
                        {projects.length === 0 ? (
                            !isLoading && (
                                <div className="text-center py-12 krishi-glass rounded-3xl border-dashed border-2 border-slate-350 dark:border-white/10">
                                    <span className="material-icons text-4xl text-slate-300 dark:text-slate-600 mb-2 block">search_off</span>
                                    <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">No records found matching filters</p>
                                </div>
                            )
                        ) : (
                            projects.map((proj, idx) => (
                                <div
                                    key={proj.loanApplicationNumber || idx}
                                    className="krishi-glass rounded-3xl p-5 border border-white/50 dark:border-white/10 relative overflow-hidden group shadow-soft text-left animate-fade-in"
                                >
                                    {/* Ambient glow decoration */}
                                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform pointer-events-none"></div>

                                    {/* Card Header badges */}
                                    <div className="flex justify-between items-start gap-2 mb-3.5">
                                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg">
                                            {proj.beneficiaryType}
                                        </span>
                                        {proj.status === 'Disbursed' ? (
                                            <span className="bg-green-500/10 text-green-500 border border-green-500/20 text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-0.5">
                                                <span className="material-icons text-[10px]">check_circle</span> Disbursed
                                            </span>
                                        ) : (
                                            <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-0.5">
                                                <span className="material-icons text-[10px]">pending</span> Pending Info
                                            </span>
                                        )}
                                    </div>

                                    {/* Project Name & Description */}
                                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-1 leading-snug group-hover:text-emerald-500 transition-colors">
                                        {proj.projectName}
                                    </h3>
                                    {proj.projectType && (
                                        <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1">
                                            <span className="material-icons text-xs text-emerald-400">agriculture</span>
                                            {proj.projectType}
                                        </p>
                                    )}

                                    {/* Funding Numbers Grid */}
                                    <div className="grid grid-cols-2 gap-3 border-t border-b border-slate-100 dark:border-white/5 py-3.5 mb-3">
                                        <div>
                                            <span className="block text-[9px] text-gray-450 font-bold uppercase tracking-wider mb-0.5">AIF Approved Loan</span>
                                            <span className="text-sm font-black text-slate-800 dark:text-slate-100">{formatINR(proj.approvedLoanAmount)}</span>
                                        </div>
                                        <div>
                                            <span className="block text-[9px] text-gray-450 font-bold uppercase tracking-wider mb-0.5">Total Project Cost</span>
                                            <span className="text-sm font-black text-slate-800 dark:text-slate-100">{formatINR(proj.projectCost)}</span>
                                        </div>
                                    </div>

                                    {/* Location Info */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-start gap-1 text-[11px] text-gray-650 dark:text-gray-350 leading-tight">
                                            <span className="material-icons text-[14px] text-emerald-400 mt-0.5">location_on</span>
                                            <span>
                                                {proj.village ? `${proj.village}, ` : ''}{proj.district}, <strong className="text-slate-750 dark:text-slate-200">{proj.state}</strong>
                                            </span>
                                        </div>
                                        {proj.termYear > 0 && (
                                            <div className="flex items-center gap-1 text-[11px] text-gray-500">
                                                <span className="material-icons text-[14px] text-emerald-400">schedule</span>
                                                <span>Term: {proj.termYear} Years {proj.termMonth > 0 ? `& ${proj.termMonth} Months` : ''}</span>
                                            </div>
                                        )}
                                        {proj.isGeoUpdated === 'Yes' && (
                                            <div className="flex items-center gap-1.5 pt-2">
                                                <span className="inline-flex items-center text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/15 shadow-sm">
                                                    <span className="material-icons text-[11px] mr-1">verified_user</span>
                                                    Verified via Krishi Mapper
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </main>

            {/* Bottom Nav */}
            <BottomNavbar activeTab="dashboard" onNavigate={onNavigate} />
        </div>
    );
};

export default AMIInsightCenter;
