import React, { useState, useMemo } from 'react';
import { 
    CROP_AGRONOMY_DATABASE, 
    estimateSoilNPKFromSensor, 
    calculateFertilizerPrescription 
} from '../utils/npkAgronomyModel';
import { useCart } from '../context/CartContext';

const NPKReportCard = ({ moisture = null, defaultCrop = 'wheat', onNavigate }) => {
    const { addMultipleToCart, setIsCartOpen } = useCart();

    const [selectedCrop, setSelectedCrop] = useState(defaultCrop || 'wheat');
    const [acres, setAcres] = useState(1);
    const [activeTab, setActiveTab] = useState('prescription'); // 'prescription' | 'balance' | 'schedule'
    const [addedFeedback, setAddedFeedback] = useState(false);

    const hasLiveSensor = moisture !== null && moisture !== undefined && !isNaN(Number(moisture));

    // 1. Calculate soil NPK from sensor moisture or standard ICAR agronomy baseline
    const soilReport = useMemo(() => {
        return estimateSoilNPKFromSensor(moisture, selectedCrop);
    }, [moisture, selectedCrop]);

    // 2. Calculate exact fertilizer requirements & bag count
    const prescription = useMemo(() => {
        return calculateFertilizerPrescription(soilReport, selectedCrop, acres);
    }, [soilReport, selectedCrop, acres]);

    const handleAddToCart = () => {
        addMultipleToCart(prescription.recommendedBags);
        setAddedFeedback(true);
        setTimeout(() => setAddedFeedback(false), 2000);
    };

    return (
        <div className="krishi-glass border border-emerald-500/20 dark:border-white/10 rounded-3xl p-5 mb-6 shadow-xl relative overflow-hidden font-display antialiased">
            {/* Ambient subtle glow background */}
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* ── Header ── */}
            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                        <span className="material-symbols-outlined text-lg">science</span>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-black text-gray-900 dark:text-white leading-tight">
                                Soil NPK & Fertilizer Prescription
                            </h2>
                            {hasLiveSensor ? (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                                    Sensor: {moisture}%
                                </span>
                            ) : (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/25">
                                    ICAR Baseline
                                </span>
                            )}
                        </div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">
                            {hasLiveSensor 
                                ? `Dynamically tuned with live root moisture (${moisture}%)`
                                : 'ICAR Recommended Dose of Fertilizers (RDF) • Connect sensor for live telemetry'}
                        </p>
                    </div>
                </div>

                {onNavigate && (
                    <button
                        onClick={() => onNavigate('soil-health')}
                        className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 hover:underline"
                    >
                        Full Lab Card
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                )}
            </div>

            {/* ── Crop & Acreage Selector Controls ── */}
            <div className="bg-slate-100/70 dark:bg-white/5 border border-slate-200/80 dark:border-white/5 rounded-2xl p-3 mb-4 space-y-2.5">
                {/* Crop Select */}
                <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300 flex items-center gap-1 shrink-0">
                        <span className="material-symbols-outlined text-xs text-emerald-500">potted_plant</span>
                        Target Crop:
                    </span>
                    <select
                        value={selectedCrop}
                        onChange={(e) => setSelectedCrop(e.target.value)}
                        className="flex-1 max-w-[200px] text-xs font-bold bg-white dark:bg-[#1a2e22] text-gray-900 dark:text-emerald-300 border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-emerald-500/30"
                    >
                        {Object.values(CROP_AGRONOMY_DATABASE).map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                {/* Acreage Chips */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-white/5">
                    <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs text-emerald-500">straighten</span>
                        Land Area:
                    </span>
                    <div className="flex items-center gap-1">
                        {[0.5, 1, 2, 5].map((val) => (
                            <button
                                key={val}
                                type="button"
                                onClick={() => setAcres(val)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all ${
                                    acres === val
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'bg-white/60 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-white/80'
                                }`}
                            >
                                {val} {val === 1 ? 'Acre' : 'Acres'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── 3 Core N-P-K Sensor Indicators (Limited Calibrated Range) ── */}
            <div className="grid grid-cols-3 gap-2.5 mb-4">
                {/* Nitrogen (N) */}
                <div className="bg-white/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-2xl p-2.5 text-center shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-extrabold text-gray-500 dark:text-gray-400">Nitrogen (N)</span>
                        <span className={`px-1.5 py-0.2 rounded text-[8px] font-black uppercase ${soilReport.n.bg} ${soilReport.n.color}`}>
                            {soilReport.n.label}
                        </span>
                    </div>
                    <div className="text-base font-black text-gray-900 dark:text-white leading-tight">
                        {soilReport.n.value} <span className="text-[9px] font-normal text-gray-400">kg/ha</span>
                    </div>
                    <p className="text-[9px] text-gray-500 dark:text-gray-400 mt-0.5">
                        {soilReport.n.acreValue} kg/acre
                    </p>
                    <div className="w-full h-1 bg-slate-200 dark:bg-white/10 rounded-full mt-1.5 overflow-hidden">
                        <div 
                            className="h-full bg-amber-500 rounded-full" 
                            style={{ width: `${Math.min(100, (soilReport.n.value / 400) * 100)}%` }} 
                        />
                    </div>
                </div>

                {/* Phosphorus (P) */}
                <div className="bg-white/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-2xl p-2.5 text-center shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-extrabold text-gray-500 dark:text-gray-400">Phos (P₂O₅)</span>
                        <span className={`px-1.5 py-0.2 rounded text-[8px] font-black uppercase ${soilReport.p.bg} ${soilReport.p.color}`}>
                            {soilReport.p.label}
                        </span>
                    </div>
                    <div className="text-base font-black text-gray-900 dark:text-white leading-tight">
                        {soilReport.p.value} <span className="text-[9px] font-normal text-gray-400">kg/ha</span>
                    </div>
                    <p className="text-[9px] text-gray-500 dark:text-gray-400 mt-0.5">
                        {soilReport.p.acreValue} kg/acre
                    </p>
                    <div className="w-full h-1 bg-slate-200 dark:bg-white/10 rounded-full mt-1.5 overflow-hidden">
                        <div 
                            className="h-full bg-emerald-500 rounded-full" 
                            style={{ width: `${Math.min(100, (soilReport.p.value / 30) * 100)}%` }} 
                        />
                    </div>
                </div>

                {/* Potassium (K) */}
                <div className="bg-white/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-2xl p-2.5 text-center shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-extrabold text-gray-500 dark:text-gray-400">Potash (K₂O)</span>
                        <span className={`px-1.5 py-0.2 rounded text-[8px] font-black uppercase ${soilReport.k.bg} ${soilReport.k.color}`}>
                            {soilReport.k.label}
                        </span>
                    </div>
                    <div className="text-base font-black text-gray-900 dark:text-white leading-tight">
                        {soilReport.k.value} <span className="text-[9px] font-normal text-gray-400">kg/ha</span>
                    </div>
                    <p className="text-[9px] text-gray-500 dark:text-gray-400 mt-0.5">
                        {soilReport.k.acreValue} kg/acre
                    </p>
                    <div className="w-full h-1 bg-slate-200 dark:bg-white/10 rounded-full mt-1.5 overflow-hidden">
                        <div 
                            className="h-full bg-emerald-500 rounded-full" 
                            style={{ width: `${Math.min(100, (soilReport.k.value / 300) * 100)}%` }} 
                        />
                    </div>
                </div>
            </div>

            {/* ── Tab Switcher ── */}
            <div className="flex rounded-xl bg-slate-100 dark:bg-white/5 p-1 mb-3.5 text-xs font-bold">
                <button
                    type="button"
                    onClick={() => setActiveTab('prescription')}
                    className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                        activeTab === 'prescription'
                            ? 'bg-white dark:bg-emerald-600 text-emerald-700 dark:text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                >
                    Fertilizer Bags
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('balance')}
                    className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                        activeTab === 'balance'
                            ? 'bg-white dark:bg-emerald-600 text-emerald-700 dark:text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                >
                    Soil vs Crop Balance
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('schedule')}
                    className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                        activeTab === 'schedule'
                            ? 'bg-white dark:bg-emerald-600 text-emerald-700 dark:text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                >
                    Split Schedule
                </button>
            </div>

            {/* ── TAB 1: Recommended Fertilizer Bags ── */}
            {activeTab === 'prescription' && (
                <div className="space-y-2.5">
                    {prescription.recommendedBags.map((item) => (
                        <div 
                            key={item.fertilizer.id}
                            className="flex items-center justify-between p-3 rounded-2xl bg-white/70 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-sm"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm shrink-0">
                                    {item.bags}x
                                </div>
                                <div>
                                    <h4 className="text-xs font-black text-gray-900 dark:text-white leading-tight">
                                        {item.fertilizer.name}
                                    </h4>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                        {item.totalKg} kg total ({item.fertilizer.bagWeightKg} kg/bag) • {item.role}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 block">
                                    ₹{item.subtotal.toFixed(2)}
                                </span>
                                <span className="text-[9px] text-gray-400">
                                    ₹{item.fertilizer.mrp}/bag (NBS)
                                </span>
                            </div>
                        </div>
                    ))}

                    {/* Total Cost and Commission Banner */}
                    <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between mt-3">
                        <div>
                            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 block">
                                Total Subsidized Investment ({acres} Acre)
                            </span>
                            <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                                ₹{prescription.economics.totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                        </div>

                        <div className="text-right">
                            <span className="text-[9px] text-blue-600 dark:text-blue-400 font-bold block">
                                Partner Commission
                            </span>
                            <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                                +₹{prescription.economics.platformCommission} (3.5%)
                            </span>
                        </div>
                    </div>

                    {/* Action button */}
                    <button
                        type="button"
                        onClick={handleAddToCart}
                        className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-emerald-600/25 cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-base">
                            {addedFeedback ? 'check' : 'add_shopping_cart'}
                        </span>
                        {addedFeedback 
                            ? 'Added to Fertilizer Cart!' 
                            : `Add Recommended Fertilizers to Cart (${prescription.recommendedBags.reduce((s, b) => s + b.bags, 0)} Bags)`
                        }
                    </button>
                </div>
            )}

            {/* ── TAB 2: Land vs Crop Nutrient Balance Sheet ── */}
            {activeTab === 'balance' && (
                <div className="space-y-3 text-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-white/10 text-[10px] text-gray-400 uppercase">
                                    <th className="py-2">Nutrient</th>
                                    <th className="py-2 text-center">In Soil</th>
                                    <th className="py-2 text-center">Crop Need</th>
                                    <th className="py-2 text-right">To Put (Deficit)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-medium">
                                <tr>
                                    <td className="py-2.5 font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                                        Nitrogen (N)
                                    </td>
                                    <td className="py-2.5 text-center text-gray-600 dark:text-gray-400">
                                        {prescription.balanceSheet.nitrogen.presentInSoil} kg
                                    </td>
                                    <td className="py-2.5 text-center text-gray-600 dark:text-gray-400">
                                        {prescription.balanceSheet.nitrogen.cropRequired} kg
                                    </td>
                                    <td className="py-2.5 text-right font-black text-amber-600 dark:text-amber-400">
                                        {prescription.balanceSheet.nitrogen.deficit} kg
                                    </td>
                                </tr>
                                <tr>
                                    <td className="py-2.5 font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                        Phosphorus (P₂O₅)
                                    </td>
                                    <td className="py-2.5 text-center text-gray-600 dark:text-gray-400">
                                        {prescription.balanceSheet.phosphorus.presentInSoil} kg
                                    </td>
                                    <td className="py-2.5 text-center text-gray-600 dark:text-gray-400">
                                        {prescription.balanceSheet.phosphorus.cropRequired} kg
                                    </td>
                                    <td className="py-2.5 text-right font-black text-emerald-600 dark:text-emerald-400">
                                        {prescription.balanceSheet.phosphorus.deficit} kg
                                    </td>
                                </tr>
                                <tr>
                                    <td className="py-2.5 font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-teal-500" />
                                        Potash (K₂O)
                                    </td>
                                    <td className="py-2.5 text-center text-gray-600 dark:text-gray-400">
                                        {prescription.balanceSheet.potassium.presentInSoil} kg
                                    </td>
                                    <td className="py-2.5 text-center text-gray-600 dark:text-gray-400">
                                        {prescription.balanceSheet.potassium.cropRequired} kg
                                    </td>
                                    <td className="py-2.5 text-right font-black text-teal-600 dark:text-teal-400">
                                        {prescription.balanceSheet.potassium.deficit} kg
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed">
                        <strong className="text-gray-900 dark:text-white block mb-1">
                            📖 S.R. Reddy Agronomic Note:
                        </strong>
                        Soil test values represent the available nutrient pool. Because only 20–30% of applied fertilizers are absorbed in the first crop cycle (the rest fixes to soil clay or leaches), chemical dosage is calibrated to replace crop withdrawal without over-fertilizing.
                    </div>
                </div>
            )}

            {/* ── TAB 3: S.R. Reddy Application Schedule ── */}
            {activeTab === 'schedule' && (
                <div className="space-y-3">
                    {prescription.applicationPlan.map((stage, idx) => (
                        <div 
                            key={idx}
                            className="bg-white/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-3 shadow-sm"
                        >
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-black text-gray-900 dark:text-white">
                                    {stage.stage}
                                </span>
                                <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                    {stage.timing}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 mb-2 text-[11px] font-bold text-gray-700 dark:text-gray-300">
                                {stage.dapBags > 0 && <span className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded">DAP: {stage.dapBags} Bag</span>}
                                {stage.mopBags > 0 && <span className="bg-teal-500/15 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded">MOP: {stage.mopBags} Bag</span>}
                                {stage.ureaBags > 0 && <span className="bg-amber-500/15 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded">Urea: {stage.ureaBags} Bag</span>}
                            </div>

                            <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-snug">
                                {stage.instructions}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NPKReportCard;
