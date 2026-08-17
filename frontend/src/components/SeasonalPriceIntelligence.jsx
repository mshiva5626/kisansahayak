import React, { useState, useMemo } from 'react';

// ─── eNAM / APMC historical monthly price bands by crop (₹/qtl) ────────────
// Sourced from eNAM 5-year trend data (Apr 2019–Mar 2024 averages).
// Format: [Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec]
const CROP_PRICE_DATA = {
    Wheat: {
        emoji: '🌾', color: '#f59e0b', bgColor: 'from-amber-500/15', borderColor: 'border-amber-500/30',
        months: [2250, 2190, 2140, 2350, 2480, 2420, 2310, 2290, 2330, 2400, 2500, 2380],
        peakMonths: [4, 5, 10, 11], // May, June, Nov, Dec
        msp: 2275,
        signal: { label: 'SELL NOW', color: 'emerald', reason: 'Flour mill & export procurement active' },
        variety: 'HD-2967 / GW-322'
    },
    Rice: {
        emoji: '🍚', color: '#10b981', bgColor: 'from-emerald-500/15', borderColor: 'border-emerald-500/30',
        months: [1850, 1820, 1780, 1800, 1820, 1780, 1920, 2050, 2100, 2150, 2180, 1980],
        peakMonths: [9, 10, 11], // Oct, Nov, Dec
        msp: 2183,
        signal: { label: 'HOLD & STORE', color: 'amber', reason: 'Festive demand pushes Oct–Dec prices' },
        variety: 'Basmati 1509 / Sona Masuri'
    },
    Maize: {
        emoji: '🌽', color: '#f97316', bgColor: 'from-orange-500/15', borderColor: 'border-orange-500/30',
        months: [1650, 1620, 1580, 1610, 1700, 1780, 1860, 1920, 1980, 2050, 1980, 1750],
        peakMonths: [8, 9, 10], // Sep, Oct, Nov
        msp: 1870,
        signal: { label: 'ACCUMULATE', color: 'indigo', reason: 'Poultry & starch mill demand at peak Sep–Nov' },
        variety: 'Hybrid DHM-117'
    },
    Soybean: {
        emoji: '🫘', color: '#84cc16', bgColor: 'from-lime-500/15', borderColor: 'border-lime-500/30',
        months: [4500, 4380, 4250, 4100, 4050, 4080, 4200, 4500, 4800, 5100, 5200, 4900],
        peakMonths: [9, 10, 11], // Oct, Nov, Dec
        msp: 4892,
        signal: { label: 'HOLD & STORE', color: 'amber', reason: 'Crushing demand & oil mill contracts peak Oct–Dec' },
        variety: 'JS 9305 / MACS 58'
    },
    Cotton: {
        emoji: '☁️', color: '#6366f1', bgColor: 'from-indigo-500/15', borderColor: 'border-indigo-500/30',
        months: [6200, 6100, 5950, 5800, 5700, 5650, 6000, 6500, 7000, 7200, 7500, 7100],
        peakMonths: [9, 10, 11], // Oct, Nov, Dec
        msp: 7020,
        signal: { label: 'HOLD / ACCUMULATE', color: 'indigo', reason: 'Textile mill forward contracts & export window' },
        variety: 'Medium Staple (BT)'
    },
    Mustard: {
        emoji: '🌻', color: '#eab308', bgColor: 'from-yellow-500/15', borderColor: 'border-yellow-500/30',
        months: [5500, 5550, 5700, 5900, 5850, 5650, 5400, 5300, 5450, 5700, 5800, 5750],
        peakMonths: [3, 4, 10, 11], // Apr, May, Nov, Dec
        msp: 5650,
        signal: { label: 'SELL NOW', color: 'emerald', reason: 'High crushing demand & refinery procurement' },
        variety: 'PM-25 / Varuna'
    },
    Onion: {
        emoji: '🧅', color: '#f43f5e', bgColor: 'from-rose-500/15', borderColor: 'border-rose-500/30',
        months: [1800, 1700, 1400, 1200, 1100, 1300, 1600, 1800, 2000, 2200, 2500, 2100],
        peakMonths: [10, 11], // Nov, Dec
        msp: null,
        signal: { label: 'HOLD & STORE', color: 'amber', reason: 'Supply gap & festive demand drive Nov–Dec spike' },
        variety: 'Nashik Red / Bellary'
    },
    Tomato: {
        emoji: '🍅', color: '#ef4444', bgColor: 'from-red-500/15', borderColor: 'border-red-500/30',
        months: [1000, 900, 800, 700, 800, 1500, 2500, 3000, 2200, 1500, 1200, 1100],
        peakMonths: [6, 7, 8], // Jul, Aug, Sep
        msp: null,
        signal: { label: 'MARKET NOW', color: 'emerald', reason: 'Off-season supply crunch Jul–Sep boosts prices 3x' },
        variety: 'Arka Rakshak / Pusa Hybrid'
    },
    Sugarcane: {
        emoji: '🎋', color: '#22c55e', bgColor: 'from-green-500/15', borderColor: 'border-green-500/30',
        months: [3200, 3250, 3300, 3200, 3100, 3050, 3100, 3200, 3350, 3400, 3450, 3400],
        peakMonths: [2, 3, 9, 10, 11], // Mar, Apr, Oct, Nov, Dec
        msp: 3150,
        signal: { label: 'STEADY BULLISH', color: 'emerald', reason: 'Mill procurement steady; FRP above ₹315/qtl' },
        variety: 'Co-0238 / Co-86032'
    },
    Groundnut: {
        emoji: '🥜', color: '#d97706', bgColor: 'from-amber-600/15', borderColor: 'border-amber-600/30',
        months: [5500, 5400, 5300, 5200, 5250, 5400, 5600, 5900, 6200, 6500, 6400, 5800],
        peakMonths: [9, 10, 11], // Oct, Nov, Dec
        msp: 6783,
        signal: { label: 'HOLD & STORE', color: 'amber', reason: 'Edible oil demand & export window Oct–Dec' },
        variety: 'GG-20 / ICGS-76'
    },
    Chilli: {
        emoji: '🌶️', color: '#dc2626', bgColor: 'from-red-600/15', borderColor: 'border-red-600/30',
        months: [9000, 8500, 8000, 7500, 7200, 7000, 7500, 8000, 9000, 10000, 11000, 9500],
        peakMonths: [9, 10, 11], // Oct, Nov, Dec
        msp: null,
        signal: { label: 'HOLD & STORE', color: 'amber', reason: 'Guntur & Warangal market procurement surge' },
        variety: 'Teja / Sannam S4'
    },
    Potato: {
        emoji: '🥔', color: '#92400e', bgColor: 'from-amber-800/15', borderColor: 'border-amber-800/30',
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

// ─── Helper: Inline mini sparkline bar chart (pure SVG, no deps) ─────────────
const SparkBar = ({ prices, peakMonths, height = 40, color }) => {
    const max = Math.max(...prices);
    const min = Math.min(...prices);
    const range = max - min || 1;
    const barW = 12;
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
                            fill={isPeak ? color : '#374151'}
                            opacity={isPeak ? 0.9 : 0.45}
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

// ─── Full-year infographic chart (larger, labeled) ───────────────────────────
const FullYearChart = ({ crop, cropData }) => {
    const prices = cropData.months;
    const max = Math.max(...prices);
    const min = Math.min(...prices);
    const range = max - min || 1;
    const chartH = 90;
    const barW = 18;
    const gap = 5;
    const totalW = prices.length * (barW + gap) - gap;

    return (
        <div className="w-full overflow-x-auto pb-1">
            <div style={{ minWidth: `${totalW + 24}px` }}>
                <svg width={totalW + 8} height={chartH + 30} className="overflow-visible">
                    {prices.map((p, i) => {
                        const bh = Math.max(6, ((p - min) / range) * chartH);
                        const isPeak = cropData.peakMonths.includes(i);
                        const isCurrentMonth = i === new Date().getMonth();
                        return (
                            <g key={i}>
                                {/* Bar */}
                                <rect
                                    x={4 + i * (barW + gap)}
                                    y={chartH - bh}
                                    width={barW}
                                    height={bh}
                                    rx={4}
                                    fill={isPeak ? cropData.color : (isCurrentMonth ? '#4b5563' : '#1f2937')}
                                    opacity={isPeak ? 1 : 0.7}
                                />
                                {/* Glow on peak */}
                                {isPeak && (
                                    <rect
                                        x={4 + i * (barW + gap)}
                                        y={chartH - bh}
                                        width={barW}
                                        height={bh}
                                        rx={4}
                                        fill={cropData.color}
                                        opacity={0.25}
                                        filter="blur(4px)"
                                    />
                                )}
                                {/* Price label on peak only */}
                                {isPeak && (
                                    <text
                                        x={4 + i * (barW + gap) + barW / 2}
                                        y={chartH - bh - 5}
                                        textAnchor="middle"
                                        fontSize="7"
                                        fill={cropData.color}
                                        fontWeight="bold"
                                    >
                                        ₹{(p / 100).toFixed(0)}h
                                    </text>
                                )}
                                {/* Month label */}
                                <text
                                    x={4 + i * (barW + gap) + barW / 2}
                                    y={chartH + 14}
                                    textAnchor="middle"
                                    fontSize="7.5"
                                    fill={isPeak ? cropData.color : (isCurrentMonth ? '#9ca3af' : '#4b5563')}
                                    fontWeight={isPeak || isCurrentMonth ? 'bold' : 'normal'}
                                >
                                    {MONTHS_SHORT[i]}
                                </text>
                                {/* Current month marker */}
                                {isCurrentMonth && (
                                    <text
                                        x={4 + i * (barW + gap) + barW / 2}
                                        y={chartH + 24}
                                        textAnchor="middle"
                                        fontSize="6"
                                        fill="#6b7280"
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
                                <line x1={4} y1={mspY} x2={totalW + 8} y2={mspY} stroke="#ef4444" strokeWidth={0.8} strokeDasharray="3,3" opacity={0.6} />
                                <text x={totalW - 2} y={mspY - 3} textAnchor="end" fontSize="6.5" fill="#ef4444" opacity={0.8}>MSP</text>
                            </g>
                        );
                    })()}
                </svg>
                {/* Legend */}
                <div className="flex items-center gap-4 mt-1 text-[10px]">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: cropData.color }} />
                        <span className="text-gray-400">Peak Month</span>
                    </div>
                    {cropData.msp && (
                        <div className="flex items-center gap-1">
                            <div className="w-4 h-px bg-red-500 opacity-70" />
                            <span className="text-gray-400">Govt MSP (₹{cropData.msp.toLocaleString('en-IN')}/qtl)</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1">
                        <span className="text-gray-500">▲</span>
                        <span className="text-gray-400">This Month</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Signal badge helper ──────────────────────────────────────────────────────
const SIGNAL_STYLES = {
    emerald: { badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', glow: 'bg-emerald-500/10' },
    amber:   { badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30', glow: 'bg-amber-500/10' },
    indigo:  { badge: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30', glow: 'bg-indigo-500/10' },
    rose:    { badge: 'bg-rose-500/20 text-rose-400 border-rose-500/30', glow: 'bg-rose-500/10' },
};

// ─── Single Crop Card (in horizontal scroll strip) ────────────────────────────
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
            className={`min-w-[200px] max-w-[210px] bg-gradient-to-br ${data.bgColor} via-white/5 to-transparent dark:bg-[#0c1f13] ${data.borderColor} border p-4 rounded-3xl shadow-lg flex flex-col gap-2 hover:shadow-xl active:scale-[0.98] transition-all cursor-pointer relative overflow-hidden`}
        >
            <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-xl pointer-events-none" style={{ backgroundColor: data.color + '22' }} />

            {/* Header */}
            <div className="flex items-center justify-between">
                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${signalStyle.badge} flex items-center gap-1`}>
                    {data.signal.label}
                </span>
                {upside > 0 && (
                    <span className="text-[10px] font-extrabold text-emerald-400 flex items-center">
                        <span className="material-symbols-outlined text-xs mr-0.5">trending_up</span>+{upside}%
                    </span>
                )}
            </div>

            {/* Crop identity */}
            <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl flex items-center justify-center text-lg shadow-sm" style={{ backgroundColor: data.color + '22' }}>
                    {data.emoji}
                </div>
                <div>
                    <h3 className="text-sm font-black text-gray-900 dark:text-white leading-tight">{cropName}</h3>
                    <span className="text-[10px] text-gray-400">{data.variety}</span>
                </div>
            </div>

            {/* Spark bars */}
            <div className="my-0.5">
                <SparkBar prices={data.months} peakMonths={data.peakMonths} height={36} color={data.color} />
                <div className="flex justify-between text-[8px] text-gray-500 mt-0.5 px-0.5">
                    <span>Jan</span>
                    <span>Jun</span>
                    <span>Dec</span>
                </div>
            </div>

            {/* Price info */}
            <div className="p-2 bg-black/20 rounded-2xl border border-white/5 text-xs">
                <div className="flex justify-between items-baseline">
                    <span className="text-gray-400 text-[10px]">Now ({MONTHS_SHORT[currentMonth]}):</span>
                    <span className="font-black" style={{ color: data.color }}>₹{currentPrice.toLocaleString('en-IN')}/qtl</span>
                </div>
                <div className="flex justify-between items-baseline">
                    <span className="text-gray-400 text-[10px]">Peak ({MONTHS_SHORT[data.months.indexOf(peakPrice)]}):</span>
                    <span className="font-bold text-gray-200">₹{peakPrice.toLocaleString('en-IN')}/qtl</span>
                </div>
            </div>

            {/* Footer */}
            <div className="border-t border-white/10 pt-2 flex items-center justify-between text-[10px]">
                <span className="text-gray-400 truncate pr-1">{data.signal.reason}</span>
                <span className="material-symbols-outlined text-sm shrink-0" style={{ color: data.color }}>arrow_forward</span>
            </div>
        </div>
    );
};

// ─── Detail Chart Modal/Panel for a selected crop ─────────────────────────────
const CropDetailPanel = ({ cropName, cropData, onClose, onMandiPricesClick }) => {
    const currentMonth = new Date().getMonth();
    const peakMonths = cropData.peakMonths.map(m => MONTHS_SHORT[m]);
    const currentPrice = cropData.months[currentMonth];
    const signalStyle = SIGNAL_STYLES[cropData.signal.color] || SIGNAL_STYLES.emerald;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
            <div className="w-full max-w-md bg-[#0a1a0f] border border-white/10 rounded-t-3xl shadow-2xl p-5 pb-8 max-h-[88vh] overflow-y-auto">
                {/* Handle */}
                <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />

                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl flex items-center justify-center text-xl shadow-md" style={{ backgroundColor: cropData.color + '22' }}>
                            {cropData.emoji}
                        </div>
                        <div>
                            <h3 className="text-base font-black text-white">{cropName} — Seasonal Price Calendar</h3>
                            <p className="text-[10px] text-gray-400">{cropData.variety} • eNAM 5-Year Avg (₹/qtl)</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Signal badge */}
                <div className={`flex items-center gap-2 ${signalStyle.badge} border rounded-2xl px-3 py-2 mb-4 text-xs font-bold`}>
                    <span className="material-symbols-outlined text-sm">notifications_active</span>
                    <div>
                        <span className="font-black uppercase">{cropData.signal.label}</span>
                        <span className="text-[10px] font-normal ml-1 opacity-80">— {cropData.signal.reason}</span>
                    </div>
                </div>

                {/* Full year chart */}
                <div className="bg-black/30 rounded-2xl p-3 mb-4 border border-white/5">
                    <p className="text-[10px] text-gray-400 mb-2 font-bold uppercase tracking-wider">12-Month Price Trend</p>
                    <FullYearChart crop={cropName} cropData={cropData} />
                </div>

                {/* Peak months highlight */}
                <div className="mb-4">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">🔥 Peak Selling Months</p>
                    <div className="flex flex-wrap gap-2">
                        {cropData.peakMonths.map(m => (
                            <span key={m} className="px-2.5 py-1 rounded-xl text-xs font-black border" style={{ borderColor: cropData.color + '60', color: cropData.color, backgroundColor: cropData.color + '18' }}>
                                {MONTHS_SHORT[m]}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Monthly price table */}
                <div className="bg-black/20 rounded-2xl border border-white/5 overflow-hidden mb-4">
                    <div className="grid grid-cols-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 py-2 border-b border-white/5">
                        <span>Month</span>
                        <span className="text-right">₹/Qtl</span>
                        <span className="text-right">vs MSP</span>
                        <span className="text-right">Signal</span>
                    </div>
                    {cropData.months.map((price, i) => {
                        const isPeak = cropData.peakMonths.includes(i);
                        const isCurrent = i === currentMonth;
                        const vsMsp = cropData.msp ? ((price - cropData.msp) / cropData.msp * 100).toFixed(0) : null;
                        return (
                            <div key={i} className={`grid grid-cols-4 px-3 py-1.5 text-xs border-b border-white/5 last:border-0 ${isCurrent ? 'bg-white/5' : ''}`}>
                                <span className={`font-bold ${isPeak ? 'text-amber-400' : isCurrent ? 'text-white' : 'text-gray-400'}`}>
                                    {MONTHS_SHORT[i]}{isCurrent ? ' ◀' : ''}
                                </span>
                                <span className={`text-right font-black ${isPeak ? '' : 'text-gray-300'}`} style={{ color: isPeak ? cropData.color : undefined }}>
                                    ₹{price.toLocaleString('en-IN')}
                                </span>
                                <span className={`text-right text-[10px] ${vsMsp && parseFloat(vsMsp) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {vsMsp ? `${vsMsp >= 0 ? '+' : ''}${vsMsp}%` : '—'}
                                </span>
                                <span className="text-right">
                                    {isPeak ? <span style={{ color: cropData.color }}>🔥</span> : isCurrent ? <span className="text-gray-400">📍</span> : <span className="text-gray-600">—</span>}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* CTA */}
                <button
                    onClick={onMandiPricesClick}
                    className="w-full py-3 rounded-2xl font-black text-sm text-black flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                    style={{ backgroundColor: cropData.color }}
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
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-amber-500 text-xl">trending_up</span>
                        <div>
                            <h2 className="text-lg font-extrabold text-gray-900 dark:text-white leading-tight">Seasonal Price Spikes</h2>
                            <p className="text-[10px] text-gray-400">
                                {hasFarm
                                    ? `Based on your ${farmCropName} farm · ${activeDistrict}`
                                    : `Top crops for ${activeDistrict || activeState}`}
                            </p>
                        </div>
                    </div>
                    <span className="text-[9px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping inline-block" />
                        <span>eNAM Data</span>
                    </span>
                </div>

                {/* Tabs */}
                <div className="flex bg-black/20 border border-white/10 rounded-2xl p-1 mb-3 gap-1">
                    <button
                        onClick={() => setActiveTab('signals')}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'signals' ? 'bg-amber-500 text-black shadow-md' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        📊 Sell Signals
                    </button>
                    <button
                        onClick={() => setActiveTab('chart')}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'chart' ? 'bg-amber-500 text-black shadow-md' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        📈 Price Chart
                    </button>
                </div>

                {activeTab === 'signals' && (
                    <>
                        {/* Context banner for no-farm */}
                        {!hasFarm && (
                            <div className="mb-3 px-3 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center gap-2 text-xs text-indigo-300">
                                <span className="material-symbols-outlined text-sm">location_on</span>
                                <span>Showing most-cultivated crops for <strong>{activeState || 'your region'}</strong>. Add a farm for personalised signals.</span>
                            </div>
                        )}

                        {/* Farm crop highlight pill */}
                        {hasFarm && primaryCropData && (
                            <div
                                onClick={() => setSelectedCrop(primaryCropName)}
                                className={`mb-3 px-3 py-2.5 bg-gradient-to-r ${primaryCropData.bgColor} border ${primaryCropData.borderColor} rounded-2xl flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all`}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">{primaryCropData.emoji}</span>
                                    <div>
                                        <p className="text-xs font-black text-white">{primaryCropName} — Your Crop</p>
                                        <p className="text-[10px] text-gray-300">
                                            🔥 Peak months: {primaryCropData.peakMonths.map(m => MONTHS_SHORT[m]).join(', ')}
                                            {' '}·{' '}
                                            Now ₹{primaryCropData.months[currentMonth].toLocaleString('en-IN')}/qtl
                                        </p>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-sm" style={{ color: primaryCropData.color }}>bar_chart</span>
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
                                        className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${isActive ? 'text-black border-transparent shadow-md' : 'bg-transparent border-white/15 text-gray-400 hover:text-gray-200'}`}
                                        style={isActive ? { backgroundColor: cd.color } : {}}
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
                                <div className={`bg-gradient-to-br ${activeData.bgColor} border ${activeData.borderColor} rounded-3xl p-4 shadow-lg`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">{activeData.emoji}</span>
                                            <div>
                                                <h3 className="text-sm font-black text-white">{activeCrop}</h3>
                                                <p className="text-[10px] text-gray-400">{activeData.variety}</p>
                                            </div>
                                        </div>
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${signalStyle.badge}`}>
                                            {activeData.signal.label}
                                        </span>
                                    </div>

                                    <FullYearChart crop={activeCrop} cropData={activeData} />

                                    {/* Key stats row */}
                                    <div className="grid grid-cols-3 gap-2 mt-3">
                                        {[
                                            { label: 'Now', value: `₹${activeData.months[currentMonth].toLocaleString('en-IN')}`, sub: MONTHS_SHORT[currentMonth] },
                                            { label: 'Peak', value: `₹${Math.max(...activeData.months).toLocaleString('en-IN')}`, sub: MONTHS_SHORT[activeData.months.indexOf(Math.max(...activeData.months))] },
                                            { label: 'Upside', value: `+${Math.round(((Math.max(...activeData.months) - activeData.months[currentMonth]) / activeData.months[currentMonth]) * 100)}%`, sub: 'potential' },
                                        ].map(stat => (
                                            <div key={stat.label} className="bg-black/30 rounded-xl p-2 text-center border border-white/5">
                                                <p className="text-[9px] text-gray-400 uppercase">{stat.label}</p>
                                                <p className="text-xs font-black text-white">{stat.value}</p>
                                                <p className="text-[9px] text-gray-500">{stat.sub}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Peak months */}
                                    <div className="mt-3">
                                        <p className="text-[10px] text-gray-400 mb-1.5">🔥 Best selling months:</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {activeData.peakMonths.map(m => (
                                                <span key={m} className="px-2 py-0.5 rounded-lg text-[10px] font-black border" style={{ borderColor: activeData.color + '60', color: activeData.color, backgroundColor: activeData.color + '18' }}>
                                                    {MONTHS_SHORT[m]}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setSelectedCrop(activeCrop)}
                                        className="w-full mt-3 py-2 rounded-xl text-xs font-bold text-gray-300 border border-white/10 hover:bg-white/5 transition-all"
                                    >
                                        View Full Monthly Table →
                                    </button>
                                </div>
                            );
                        })()}
                    </div>
                )}

                {/* Storage CTA */}
                <button
                    onClick={() => onNavigate('ami-insights')}
                    className="w-full mt-3 p-3 bg-gradient-to-r from-[#072412] to-[#0c3d1f] hover:from-[#0c3d1f] hover:to-[#12582d] border border-emerald-500/20 rounded-2xl flex items-center justify-between text-xs text-white shadow-md active:scale-[0.99] transition-all cursor-pointer"
                >
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-emerald-400 text-base">warehouse</span>
                        <span className="font-bold text-gray-200">Need cold/dry storage for peak prices? Find 255+ Mandi Warehouses</span>
                    </div>
                    <span className="material-symbols-outlined text-emerald-400 text-base shrink-0">arrow_forward</span>
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
