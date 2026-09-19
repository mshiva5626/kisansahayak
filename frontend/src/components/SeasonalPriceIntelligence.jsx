import React, { useState, useMemo } from 'react';

// ─── eNAM / APMC historical monthly price bands by crop (₹/qtl) ────────────
// Sourced from eNAM 5-year trend data (Apr 2019–Mar 2024 averages).
// Format: [Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec]
const CROP_PRICE_DATA = {
    Wheat: {
        emoji: '🌾', color: '#d97706', bgColor: 'bg-amber-50/60', borderColor: 'border-amber-200/70',
        months: [2250, 2190, 2140, 2350, 2480, 2420, 2310, 2290, 2330, 2400, 2500, 2380],
        peakMonths: [4, 5, 10, 11], // May, June, Nov, Dec
        msp: 2275,
        signal: { label: 'SELL NOW', color: 'emerald', reason: 'Flour mill & export procurement active' },
        variety: 'HD-2967 / GW-322'
    },
    Rice: {
        emoji: '🍚', color: '#059669', bgColor: 'bg-emerald-50/60', borderColor: 'border-emerald-200/70',
        months: [1850, 1820, 1780, 1800, 1820, 1780, 1920, 2050, 2100, 2150, 2180, 1980],
        peakMonths: [9, 10, 11], // Oct, Nov, Dec
        msp: 2183,
        signal: { label: 'HOLD & STORE', color: 'amber', reason: 'Festive demand pushes Oct–Dec prices' },
        variety: 'Basmati 1509 / Sona Masuri'
    },
    Maize: {
        emoji: '🌽', color: '#ea580c', bgColor: 'bg-orange-50/60', borderColor: 'border-orange-200/70',
        months: [1650, 1620, 1580, 1610, 1700, 1780, 1860, 1920, 1980, 2050, 1980, 1750],
        peakMonths: [8, 9, 10], // Sep, Oct, Nov
        msp: 1870,
        signal: { label: 'ACCUMULATE', color: 'indigo', reason: 'Poultry & starch mill demand at peak Sep–Nov' },
        variety: 'Hybrid DHM-117'
    },
    Soybean: {
        emoji: '🫘', color: '#16a34a', bgColor: 'bg-green-50/60', borderColor: 'border-green-200/70',
        months: [4500, 4380, 4250, 4100, 4050, 4080, 4200, 4500, 4800, 5100, 5200, 4900],
        peakMonths: [9, 10, 11], // Oct, Nov, Dec
        msp: 4892,
        signal: { label: 'HOLD & STORE', color: 'amber', reason: 'Crushing demand & oil mill contracts peak Oct–Dec' },
        variety: 'JS 9305 / MACS 58'
    },
    Cotton: {
        emoji: '☁️', color: '#4f46e5', bgColor: 'bg-indigo-50/60', borderColor: 'border-indigo-200/70',
        months: [6200, 6100, 5950, 5800, 5700, 5650, 6000, 6500, 7000, 7200, 7500, 7100],
        peakMonths: [9, 10, 11], // Oct, Nov, Dec
        msp: 7020,
        signal: { label: 'HOLD / ACCUMULATE', color: 'indigo', reason: 'Textile mill forward contracts & export window' },
        variety: 'Medium Staple (BT)'
    },
    Mustard: {
        emoji: '🌻', color: '#ca8a04', bgColor: 'bg-yellow-50/60', borderColor: 'border-yellow-200/70',
        months: [5500, 5550, 5700, 5900, 5850, 5650, 5400, 5300, 5450, 5700, 5800, 5750],
        peakMonths: [3, 4, 10, 11], // Apr, May, Nov, Dec
        msp: 5650,
        signal: { label: 'SELL NOW', color: 'emerald', reason: 'High crushing demand & refinery procurement' },
        variety: 'PM-25 / Varuna'
    },
    Onion: {
        emoji: '🧅', color: '#e11d48', bgColor: 'bg-rose-50/60', borderColor: 'border-rose-200/70',
        months: [1800, 1700, 1400, 1200, 1100, 1300, 1600, 1800, 2000, 2200, 2500, 2100],
        peakMonths: [10, 11], // Nov, Dec
        msp: null,
        signal: { label: 'HOLD & STORE', color: 'amber', reason: 'Supply gap & festive demand drive Nov–Dec spike' },
        variety: 'Nashik Red / Bellary'
    },
    Tomato: {
        emoji: '🍅', color: '#dc2626', bgColor: 'bg-red-50/60', borderColor: 'border-red-200/70',
        months: [1000, 900, 800, 700, 800, 1500, 2500, 3000, 2200, 1500, 1200, 1100],
        peakMonths: [6, 7, 8], // Jul, Aug, Sep
        msp: null,
        signal: { label: 'MARKET NOW', color: 'emerald', reason: 'Off-season supply crunch Jul–Sep boosts prices 3x' },
        variety: 'Arka Rakshak / Pusa Hybrid'
    },
    Sugarcane: {
        emoji: '🎋', color: '#15803d', bgColor: 'bg-green-50/60', borderColor: 'border-green-200/70',
        months: [3200, 3250, 3300, 3200, 3100, 3050, 3100, 3200, 3350, 3400, 3450, 3400],
        peakMonths: [2, 3, 9, 10, 11], // Mar, Apr, Oct, Nov, Dec
        msp: 3150,
        signal: { label: 'STEADY BULLISH', color: 'emerald', reason: 'Mill procurement steady; FRP above ₹315/qtl' },
        variety: 'Co-0238 / Co-86032'
    },
    Groundnut: {
        emoji: '🥜', color: '#b45309', bgColor: 'bg-amber-50/60', borderColor: 'border-amber-200/70',
        months: [5500, 5400, 5300, 5200, 5250, 5400, 5600, 5900, 6200, 6500, 6400, 5800],
        peakMonths: [9, 10, 11], // Oct, Nov, Dec
        msp: 6783,
        signal: { label: 'HOLD & STORE', color: 'amber', reason: 'Edible oil demand & export window Oct–Dec' },
        variety: 'GG-20 / ICGS-76'
    },
    Chilli: {
        emoji: '🌶️', color: '#dc2626', bgColor: 'bg-red-50/60', borderColor: 'border-red-200/70',
        months: [9000, 8500, 8000, 7500, 7200, 7000, 7500, 8000, 9000, 10000, 11000, 9500],
        peakMonths: [9, 10, 11], // Oct, Nov, Dec
        msp: null,
        signal: { label: 'HOLD & STORE', color: 'amber', reason: 'Guntur & Warangal market procurement surge' },
        variety: 'Teja / Sannam S4'
    },
    Potato: {
        emoji: '🥔', color: '#9a3412', bgColor: 'bg-stone-50/60', borderColor: 'border-stone-200/70',
        months: [1200, 1000, 800, 700, 900, 1200, 1600, 1800, 1700, 1500, 1400, 1300],
        peakMonths: [6, 7, 8], // Jul, Aug, Sep
        msp: null,
        signal: { label: 'COLD STORE HOLD', color: 'indigo', reason: 'Off-season withdrawal drives Jul–Sep prices' },
        variety: 'Kufri Pukhraj / Kufri Jyoti'
    }
};

// ─── Location → Top crops mapping (state/region based) ──────────────────────
const LOCATION_CROPS = {
    'Punjabi': ['Wheat', 'Rice', 'Mustard', 'Maize', 'Potato'],
    'Punjab': ['Wheat', 'Rice', 'Mustard', 'Maize', 'Potato'],
    'Haryana': ['Wheat', 'Rice', 'Mustard', 'Sugarcane', 'Potato'],
    'Uttar Pradesh': ['Wheat', 'Sugarcane', 'Rice', 'Mustard', 'Potato'],
    'Madhya Pradesh': ['Soybean', 'Wheat', 'Maize', 'Chilli', 'Mustard'],
    'Rajasthan': ['Mustard', 'Wheat', 'Maize', 'Groundnut', 'Chilli'],
    'Maharashtra': ['Soybean', 'Cotton', 'Sugarcane', 'Onion', 'Chilli'],
    'Gujarat': ['Cotton', 'Groundnut', 'Wheat', 'Mustard', 'Sugarcane'],
    'Karnataka': ['Maize', 'Rice', 'Groundnut', 'Chilli', 'Cotton'],
    'Andhra Pradesh': ['Rice', 'Chilli', 'Cotton', 'Maize', 'Groundnut'],
    'Telangana': ['Rice', 'Cotton', 'Maize', 'Soybean', 'Chilli'],
    'Tamil Nadu': ['Rice', 'Sugarcane', 'Maize', 'Groundnut', 'Tomato'],
    'Odisha': ['Rice', 'Maize', 'Sugarcane', 'Tomato', 'Potato'],
    'West Bengal': ['Rice', 'Potato', 'Mustard', 'Sugarcane', 'Maize'],
    'Bihar': ['Wheat', 'Rice', 'Maize', 'Potato', 'Sugarcane'],
    'Chhattisgarh': ['Rice', 'Maize', 'Soybean', 'Tomato', 'Groundnut'],
    'Jharkhand': ['Rice', 'Maize', 'Tomato', 'Potato', 'Wheat'],
    'Himachal Pradesh': ['Wheat', 'Maize', 'Potato', 'Tomato', 'Apple'],
    'Uttarakhand': ['Wheat', 'Rice', 'Maize', 'Potato', 'Mustard'],
    'Kerala': ['Rice', 'Tomato', 'Potato', 'Sugarcane', 'Groundnut'],
    'Default': ['Wheat', 'Rice', 'Maize', 'Soybean', 'Mustard']
};

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ─── Helper: Inline mini sparkline bar chart (pure SVG, crisp light style) ───
const SparkBar = ({ prices, peakMonths, height = 36, color }) => {
    const max = Math.max(...prices);
    const min = Math.min(...prices);
    const range = max - min || 1;
    const barW = 10;
    const gap = 4;
    const totalW = prices.length * (barW + gap) - gap;
    return (
        <svg width={totalW} height={height} className="overflow-visible">
            {prices.map((p, i) => {
                const bh = Math.max(4, ((p - min) / range) * (height - 6));
                const isPeak = peakMonths.includes(i);
                return (
                    <g key={i}>
                        <rect
                            x={i * (barW + gap)}
                            y={height - bh}
                            width={barW}
                            height={bh}
                            rx={3}
                            fill={isPeak ? color : '#e2e8f0'}
                        />
                        {isPeak && (
                            <circle
                                cx={i * (barW + gap) + barW / 2}
                                cy={height - bh - 4}
                                r={2}
                                fill={color}
                            />
                        )}
                    </g>
                );
            })}
        </svg>
    );
};

// ─── Full-year infographic chart (crisp light-mode) ──────────────────────────
const FullYearChart = ({ crop, cropData }) => {
    const prices = cropData.months;
    const max = Math.max(...prices);
    const min = Math.min(...prices);
    const range = max - min || 1;
    const chartH = 90;
    const barW = 18;
    const gap = 6;
    const totalW = prices.length * (barW + gap) - gap;
    const currentMonth = new Date().getMonth();

    return (
        <div className="w-full overflow-x-auto pb-1">
            <div style={{ minWidth: `${totalW + 24}px` }}>
                <svg width={totalW + 8} height={chartH + 32} className="overflow-visible">
                    {prices.map((p, i) => {
                        const bh = Math.max(6, ((p - min) / range) * chartH);
                        const isPeak = cropData.peakMonths.includes(i);
                        const isCurrentMonth = i === currentMonth;
                        return (
                            <g key={i}>
                                {/* Bar */}
                                <rect
                                    x={4 + i * (barW + gap)}
                                    y={chartH - bh}
                                    width={barW}
                                    height={bh}
                                    rx={4}
                                    fill={isPeak ? cropData.color : (isCurrentMonth ? '#94a3b8' : '#e2e8f0')}
                                />
                                {/* Price label on peak only */}
                                {isPeak && (
                                    <text
                                        x={4 + i * (barW + gap) + barW / 2}
                                        y={chartH - bh - 6}
                                        textAnchor="middle"
                                        fontSize="8"
                                        fill={cropData.color}
                                        fontWeight="bold"
                                    >
                                        ₹{(p / 100).toFixed(0)}h
                                    </text>
                                )}
                                {/* Month label */}
                                <text
                                    x={4 + i * (barW + gap) + barW / 2}
                                    y={chartH + 16}
                                    textAnchor="middle"
                                    fontSize="8"
                                    fill={isPeak ? cropData.color : (isCurrentMonth ? '#0f172a' : '#64748b')}
                                    fontWeight={isPeak || isCurrentMonth ? 'bold' : 'normal'}
                                >
                                    {MONTHS_SHORT[i]}
                                </text>
                                {/* Current month marker */}
                                {isCurrentMonth && (
                                    <text
                                        x={4 + i * (barW + gap) + barW / 2}
                                        y={chartH + 26}
                                        textAnchor="middle"
                                        fontSize="7"
                                        fill="#64748b"
                                    >
                                        ▲
                                    </text>
                                )}
                            </g>
                        );
                    })}
                    {/* MSP baseline */}
                    {cropData.msp && (() => {
                        const mspY = chartH - ((cropData.msp - min) / range) * chartH;
                        return (
                            <g>
                                <line x1={4} y1={mspY} x2={totalW + 8} y2={mspY} stroke="#ef4444" strokeWidth={1} strokeDasharray="3,3" opacity={0.7} />
                                <text x={totalW - 2} y={mspY - 4} textAnchor="end" fontSize="7" fill="#ef4444" fontWeight="bold">MSP</text>
                            </g>
                        );
                    })()}
                </svg>
                {/* Legend */}
                <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-500">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: cropData.color }} />
                        <span>Peak Month</span>
                    </div>
                    {cropData.msp && (
                        <div className="flex items-center gap-1.5">
                            <div className="w-4 h-0.5 bg-red-500 opacity-70" />
                            <span>Govt MSP (₹{cropData.msp.toLocaleString('en-IN')}/qtl)</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1.5">
                        <span className="text-slate-500">▲</span>
                        <span>This Month</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Signal badge styles tailored for clean light theme ─────────────────────
const SIGNAL_STYLES = {
    emerald: { badge: 'bg-emerald-50 text-emerald-800 border-emerald-200/80', dot: 'bg-emerald-500' },
    amber:   { badge: 'bg-amber-50 text-amber-800 border-amber-200/80', dot: 'bg-amber-500' },
    indigo:  { badge: 'bg-indigo-50 text-indigo-800 border-indigo-200/80', dot: 'bg-indigo-500' },
    rose:    { badge: 'bg-rose-50 text-rose-800 border-rose-200/80', dot: 'bg-rose-500' },
};

// ─── Single Crop Card (Clean Light Aesthetic) ────────────────────────────────
const CropCard = ({ cropName, onMandiPricesClick, onClick }) => {
    const data = CROP_PRICE_DATA[cropName];
    if (!data) return null;
    const currentMonth = new Date().getMonth();
    const currentPrice = data.months[currentMonth];
    const peakPrice = Math.max(...data.months);
    const upside = Math.round(((peakPrice - currentPrice) / currentPrice) * 100);
    const signalStyle = SIGNAL_STYLES[data.signal.color] || SIGNAL_STYLES.emerald;

    return (
        <div
            onClick={onClick || onMandiPricesClick}
            className="min-w-[215px] max-w-[225px] bg-white border border-slate-200/90 hover:border-emerald-300 p-4 rounded-2xl shadow-xs hover:shadow-md flex flex-col justify-between transition-all duration-200 cursor-pointer relative overflow-hidden group shrink-0"
        >
            {/* Top colored accent line */}
            <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: data.color }} />

            <div>
                {/* Header: Signal badge + upside */}
                <div className="flex items-center justify-between gap-1 mb-2.5">
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${signalStyle.badge} flex items-center gap-1 shadow-xs`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${signalStyle.dot}`} />
                        {data.signal.label}
                    </span>
                    {upside > 0 && (
                        <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-1.5 py-0.5 rounded-full flex items-center shrink-0">
                            <span className="material-symbols-outlined text-xs mr-0.5">trending_up</span>+{upside}%
                        </span>
                    )}
                </div>

                {/* Crop identity */}
                <div className="flex items-center gap-2.5 mb-3">
                    <div className="h-9 w-9 rounded-xl flex items-center justify-center text-xl shadow-xs border border-slate-100" style={{ backgroundColor: data.color + '18' }}>
                        {data.emoji}
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-sm font-black text-slate-900 leading-tight truncate">{cropName}</h3>
                        <p className="text-[10px] text-slate-500 truncate">{data.variety}</p>
                    </div>
                </div>

                {/* Spark bars */}
                <div className="my-2 bg-slate-50/70 rounded-xl p-2 border border-slate-100">
                    <SparkBar prices={data.months} peakMonths={data.peakMonths} height={34} color={data.color} />
                    <div className="flex justify-between text-[9px] text-slate-400 font-semibold mt-1 px-0.5">
                        <span>Jan</span>
                        <span>Jun</span>
                        <span>Dec</span>
                    </div>
                </div>

                {/* Price info card (clean, non-muddy light styling) */}
                <div className="p-2.5 bg-slate-50/90 border border-slate-200/70 rounded-xl text-xs space-y-1.5 mb-3">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-[11px] font-medium">Now ({MONTHS_SHORT[currentMonth]}):</span>
                        <span className="font-bold text-slate-900 text-xs">₹{currentPrice.toLocaleString('en-IN')}<span className="text-[10px] font-normal text-slate-500">/qtl</span></span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-[11px] font-medium">Peak ({MONTHS_SHORT[data.months.indexOf(peakPrice)]}):</span>
                        <span className="font-black text-emerald-700 text-xs">₹{peakPrice.toLocaleString('en-IN')}<span className="text-[10px] font-normal text-emerald-600/70">/qtl</span></span>
                    </div>
                </div>
            </div>

            {/* Footer with readable reason and neat arrow button */}
            <div className="border-t border-slate-100 pt-2.5 flex items-center justify-between gap-2">
                <p className="text-[10px] text-slate-600 font-medium leading-snug line-clamp-2 flex-1">{data.signal.reason}</p>
                <div className="w-6 h-6 rounded-full bg-slate-100 group-hover:bg-emerald-600 group-hover:text-white text-slate-500 flex items-center justify-center shrink-0 transition-colors">
                    <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </div>
            </div>
        </div>
    );
};

// ─── Detail Chart Modal/Panel for a selected crop (Clean Light Aesthetic) ────
const CropDetailPanel = ({ cropName, cropData, onClose, onMandiPricesClick }) => {
    const currentMonth = new Date().getMonth();
    const currentPrice = cropData.months[currentMonth];
    const signalStyle = SIGNAL_STYLES[cropData.signal.color] || SIGNAL_STYLES.emerald;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-lg bg-white border-t border-slate-200 rounded-t-3xl shadow-2xl p-5 pb-8 max-h-[88vh] overflow-y-auto">
                {/* Handle */}
                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4" />

                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-2xl flex items-center justify-center text-2xl shadow-xs border border-slate-100" style={{ backgroundColor: cropData.color + '20' }}>
                            {cropData.emoji}
                        </div>
                        <div>
                            <h3 className="text-base font-black text-slate-900">{cropName} — Price Calendar</h3>
                            <p className="text-[11px] text-slate-500 font-medium">{cropData.variety} • eNAM 5-Year Average (₹/qtl)</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors">
                        <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                </div>

                {/* Signal badge */}
                <div className={`flex items-center gap-2.5 ${signalStyle.badge} border rounded-2xl p-3 mb-4 text-xs font-semibold`}>
                    <span className="material-symbols-outlined text-base">notifications_active</span>
                    <div>
                        <span className="font-black uppercase tracking-wide">{cropData.signal.label}</span>
                        <span className="text-[11px] font-normal ml-1 opacity-90">— {cropData.signal.reason}</span>
                    </div>
                </div>

                {/* Full year chart */}
                <div className="bg-slate-50 rounded-2xl p-3.5 mb-4 border border-slate-200/80">
                    <p className="text-[10px] text-slate-500 mb-2 font-bold uppercase tracking-wider">12-Month Price Trend</p>
                    <FullYearChart crop={cropName} cropData={cropData} />
                </div>

                {/* Peak months highlight */}
                <div className="mb-4">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">🔥 Peak Selling Months</p>
                    <div className="flex flex-wrap gap-2">
                        {cropData.peakMonths.map(m => (
                            <span key={m} className="px-3 py-1 rounded-xl text-xs font-bold border" style={{ borderColor: cropData.color + '50', color: cropData.color, backgroundColor: cropData.color + '15' }}>
                                {MONTHS_SHORT[m]}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Monthly price table */}
                <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden mb-4 shadow-xs">
                    <div className="grid grid-cols-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3.5 py-2.5 bg-slate-50 border-b border-slate-200/80">
                        <span>Month</span>
                        <span className="text-right">₹/Qtl</span>
                        <span className="text-right">vs MSP</span>
                        <span className="text-right">Status</span>
                    </div>
                    {cropData.months.map((price, i) => {
                        const isPeak = cropData.peakMonths.includes(i);
                        const isCurrent = i === currentMonth;
                        const vsMsp = cropData.msp ? ((price - cropData.msp) / cropData.msp * 100).toFixed(0) : null;
                        return (
                            <div key={i} className={`grid grid-cols-4 px-3.5 py-2 text-xs border-b border-slate-100 last:border-0 items-center ${isCurrent ? 'bg-emerald-50/50' : ''}`}>
                                <span className={`font-bold ${isPeak ? 'text-amber-700' : isCurrent ? 'text-emerald-800' : 'text-slate-600'}`}>
                                    {MONTHS_SHORT[i]}{isCurrent ? ' 📍' : ''}
                                </span>
                                <span className={`text-right font-black ${isPeak ? '' : 'text-slate-800'}`} style={{ color: isPeak ? cropData.color : undefined }}>
                                    ₹{price.toLocaleString('en-IN')}
                                </span>
                                <span className={`text-right text-[11px] font-bold ${vsMsp && parseFloat(vsMsp) >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                                    {vsMsp ? `${vsMsp >= 0 ? '+' : ''}${vsMsp}%` : '—'}
                                </span>
                                <span className="text-right text-xs">
                                    {isPeak ? <span className="text-amber-600 font-bold">🔥 Peak</span> : isCurrent ? <span className="text-emerald-700 font-bold">Current</span> : <span className="text-slate-300">—</span>}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* CTA */}
                <button
                    onClick={onMandiPricesClick}
                    className="w-full py-3.5 rounded-2xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
                >
                    <span className="material-symbols-outlined text-base">storefront</span>
                    View Live Mandi Prices for {cropName}
                </button>
            </div>
        </div>
    );
};

// ─── MAIN SeasonalPriceIntelligence Component ─────────────────────────────────
const SeasonalPriceIntelligence = ({ farm, activeState, activeDistrict, onMandiPricesClick, onNavigate }) => {
    const [activeTab, setActiveTab] = useState('signals'); // 'signals' | 'chart'
    const [selectedCrop, setSelectedCrop] = useState(null);

    const hasFarm = !!(farm?.crop_type);
    const farmCropName = farm?.crop_type;

    // Resolve crops to show
    const locationCrops = useMemo(() => {
        const stateKey = Object.keys(LOCATION_CROPS).find(k => activeState?.includes(k) || k.includes(activeState || ''))
            || 'Default';
        return LOCATION_CROPS[stateKey];
    }, [activeState]);

    // When farm selected: show the farm crop first, then related local crops
    const displayCrops = useMemo(() => {
        if (hasFarm && farmCropName) {
            const farmCropNorm = Object.keys(CROP_PRICE_DATA).find(k =>
                k.toLowerCase() === farmCropName.toLowerCase() || farmCropName.toLowerCase().includes(k.toLowerCase())
            );
            const others = locationCrops.filter(c => c !== farmCropNorm).slice(0, 3);
            return farmCropNorm ? [farmCropNorm, ...others] : locationCrops.slice(0, 4);
        }
        return locationCrops.slice(0, 5);
    }, [hasFarm, farmCropName, locationCrops]);

    const primaryCropName = displayCrops[0];
    const primaryCropData = CROP_PRICE_DATA[primaryCropName];
    const currentMonth = new Date().getMonth();

    return (
        <>
            {/* Main section */}
            <div className="mb-8">
                {/* Section header */}
                <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                            <span className="material-symbols-outlined text-lg">trending_up</span>
                        </div>
                        <div>
                            <h2 className="text-base font-extrabold text-slate-900 leading-tight">Seasonal Price Spikes</h2>
                            <p className="text-[11px] text-slate-500 font-medium">
                                {hasFarm
                                    ? `Based on your ${farmCropName} farm · ${activeDistrict}`
                                    : `Top crops for ${activeDistrict || activeState || 'your region'}`}
                            </p>
                        </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
                        <span>eNAM Data</span>
                    </span>
                </div>

                {/* Modern segmented tab toggle */}
                <div className="flex bg-slate-100/90 border border-slate-200/70 rounded-2xl p-1 mb-3 gap-1">
                    <button
                        onClick={() => setActiveTab('signals')}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                            activeTab === 'signals'
                                ? 'bg-white text-slate-900 shadow-xs'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <span>📊</span> Sell Signals
                    </button>
                    <button
                        onClick={() => setActiveTab('chart')}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                            activeTab === 'chart'
                                ? 'bg-white text-slate-900 shadow-xs'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <span>📈</span> Price Chart
                    </button>
                </div>

                {activeTab === 'signals' && (
                    <>
                        {/* Context banner for no-farm: Fresh, clean emerald agri-chip */}
                        {!hasFarm && (
                            <div className="mb-3 px-3.5 py-2.5 bg-emerald-50/70 border border-emerald-200/70 rounded-2xl flex items-center gap-2 text-xs text-emerald-900 shadow-xs">
                                <span className="material-symbols-outlined text-emerald-600 text-base shrink-0">location_on</span>
                                <span>Showing most-cultivated crops for <strong>{activeState || 'Madhya Pradesh'}</strong>. Add a farm for personalised signals.</span>
                            </div>
                        )}

                        {/* Farm crop highlight pill */}
                        {hasFarm && primaryCropData && (
                            <div
                                onClick={() => setSelectedCrop(primaryCropName)}
                                className="mb-3 px-3.5 py-2.5 bg-emerald-50/70 border border-emerald-200/70 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-emerald-50 active:scale-[0.99] transition-all shadow-xs"
                            >
                                <div className="flex items-center gap-2.5">
                                    <span className="text-2xl">{primaryCropData.emoji}</span>
                                    <div>
                                        <p className="text-xs font-black text-slate-900">{primaryCropName} — Your Crop</p>
                                        <p className="text-[11px] text-slate-600 font-medium">
                                            🔥 Peak months: {primaryCropData.peakMonths.map(m => MONTHS_SHORT[m]).join(', ')}
                                            {' '}·{' '}
                                            Now ₹{primaryCropData.months[currentMonth].toLocaleString('en-IN')}/qtl
                                        </p>
                                    </div>
                                </div>
                                <div className="w-7 h-7 rounded-xl bg-white border border-emerald-200 flex items-center justify-center text-emerald-700">
                                    <span className="material-symbols-outlined text-sm">bar_chart</span>
                                </div>
                            </div>
                        )}

                        {/* Horizontal scroll cards */}
                        <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-3">
                            {displayCrops.map(cropName => (
                                <CropCard
                                    key={cropName}
                                    cropName={cropName}
                                    onMandiPricesClick={onMandiPricesClick}
                                    onClick={() => setSelectedCrop(cropName)}
                                />
                            ))}
                        </div>
                    </>
                )}

                {activeTab === 'chart' && (
                    <div className="space-y-4">
                        {/* Crop selector pills */}
                        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                            {displayCrops.filter(c => CROP_PRICE_DATA[c]).map(c => {
                                const cd = CROP_PRICE_DATA[c];
                                const isActive = (selectedCrop || displayCrops[0]) === c;
                                return (
                                    <button
                                        key={c}
                                        onClick={() => setSelectedCrop(c)}
                                        className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                                            isActive
                                                ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                        }`}
                                    >
                                        <span>{cd.emoji}</span>
                                        <span>{c}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Infographic chart for selected crop */}
                        {(() => {
                            const activeCrop = selectedCrop || displayCrops[0];
                            const activeData = CROP_PRICE_DATA[activeCrop];
                            if (!activeData) return null;
                            const signalStyle = SIGNAL_STYLES[activeData.signal.color] || SIGNAL_STYLES.emerald;
                            return (
                                <div className="bg-white border border-slate-200/80 rounded-3xl p-4 shadow-sm">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="h-9 w-9 rounded-xl flex items-center justify-center text-xl shadow-xs border border-slate-100" style={{ backgroundColor: activeData.color + '18' }}>
                                                {activeData.emoji}
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black text-slate-900">{activeCrop}</h3>
                                                <p className="text-[10px] text-slate-500">{activeData.variety}</p>
                                            </div>
                                        </div>
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${signalStyle.badge}`}>
                                            {activeData.signal.label}
                                        </span>
                                    </div>

                                    <FullYearChart crop={activeCrop} cropData={activeData} />

                                    {/* Key stats row */}
                                    <div className="grid grid-cols-3 gap-2 mt-4">
                                        {[
                                            { label: 'Now', value: `₹${activeData.months[currentMonth].toLocaleString('en-IN')}`, sub: MONTHS_SHORT[currentMonth] },
                                            { label: 'Peak', value: `₹${Math.max(...activeData.months).toLocaleString('en-IN')}`, sub: MONTHS_SHORT[activeData.months.indexOf(Math.max(...activeData.months))] },
                                            { label: 'Upside', value: `+${Math.round(((Math.max(...activeData.months) - activeData.months[currentMonth]) / activeData.months[currentMonth]) * 100)}%`, sub: 'potential' },
                                        ].map(stat => (
                                            <div key={stat.label} className="bg-slate-50 rounded-2xl p-2.5 text-center border border-slate-200/70">
                                                <p className="text-[9px] text-slate-500 uppercase font-bold">{stat.label}</p>
                                                <p className="text-xs font-black text-slate-900">{stat.value}</p>
                                                <p className="text-[9px] text-slate-400 font-medium">{stat.sub}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Peak months */}
                                    <div className="mt-3">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">🔥 Best selling months:</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {activeData.peakMonths.map(m => (
                                                <span key={m} className="px-2.5 py-1 rounded-xl text-[11px] font-bold border" style={{ borderColor: activeData.color + '50', color: activeData.color, backgroundColor: activeData.color + '15' }}>
                                                    {MONTHS_SHORT[m]}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setSelectedCrop(activeCrop)}
                                        className="w-full mt-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all flex items-center justify-center gap-1.5"
                                    >
                                        <span>View Full Monthly Table</span>
                                        <span className="material-symbols-outlined text-xs">arrow_forward</span>
                                    </button>
                                </div>
                            );
                        })()}
                    </div>
                )}

                {/* Storage CTA: Beautiful modern card */}
                <button
                    onClick={() => onNavigate('ami-insights')}
                    className="w-full mt-3.5 p-3.5 bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 rounded-2xl flex items-center justify-between text-xs text-white shadow-sm hover:shadow-md active:scale-[0.99] transition-all cursor-pointer group"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white shrink-0">
                            <span className="material-symbols-outlined text-lg">warehouse</span>
                        </div>
                        <div className="text-left">
                            <p className="font-bold text-white leading-tight">Need storage for peak season prices?</p>
                            <p className="text-[10px] text-emerald-100 leading-tight mt-0.5">Find 255+ verified Mandi Warehouses nearby</p>
                        </div>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-white/15 group-hover:bg-white/25 flex items-center justify-center text-white shrink-0 transition-colors ml-2">
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </div>
                </button>
            </div>

            {/* Detail chart modal */}
            {selectedCrop && CROP_PRICE_DATA[selectedCrop] && (
                <CropDetailPanel
                    cropName={selectedCrop}
                    cropData={CROP_PRICE_DATA[selectedCrop]}
                    onClose={() => setSelectedCrop(null)}
                    onMandiPricesClick={onMandiPricesClick}
                />
            )}
        </>
    );
};

export default SeasonalPriceIntelligence;
