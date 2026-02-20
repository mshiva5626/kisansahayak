import React, { useState, useEffect } from 'react';
import { locationAPI } from '../api';

const SatelliteImagery = ({ onBack, farmId }) => {
    const [satelliteUrl, setSatelliteUrl] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSatellite = async () => {
            try {
                // In a real app, we'd use farmId to get lat/lon. 
                // For now, we use default or mock.
                const { data } = await locationAPI.getSatelliteImage(18.5204, 73.8567);
                setSatelliteUrl(data.url);
            } catch (error) {
                console.error('Satellite Error:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSatellite();
    }, [farmId]);

    return (
        <div className="bg-background-dark text-white font-display min-h-screen flex flex-col antialiased">
            {/* Header */}
            <header className="px-6 pt-12 pb-4 flex items-center justify-between sticky top-0 bg-background-dark/80 backdrop-blur-md z-10 border-b border-white/5">
                <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-white/5 transition-colors">
                    <span className="material-icons-round">arrow_back</span>
                </button>
                <div className="text-center">
                    <h1 className="text-lg font-bold tracking-tight">Satellite Analysis</h1>
                    <p className="text-[10px] text-primary uppercase font-bold tracking-widest">Field Health View</p>
                </div>
                <button className="p-2 rounded-full hover:bg-white/5 transition-colors text-primary">
                    <span className="material-icons-round">layers</span>
                </button>
            </header>

            <main className="flex-1 overflow-y-auto no-scrollbar relative">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-[60vh] opacity-50">
                        <span className="material-icons animate-spin text-4xl mb-4 text-primary">sync</span>
                        <p className="text-sm font-medium">Fetching satellite data...</p>
                    </div>
                ) : (
                    <div className="animate-fade-in">
                        {/* Map View */}
                        <div className="w-full h-[65vh] relative overflow-hidden">
                            <img
                                src={satelliteUrl}
                                alt="Satellite View"
                                className="w-full h-full object-cover scale-110"
                            />
                            {/* Overlay Indicators */}
                            <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent opacity-40"></div>

                            {/* Heatmap Simulation Overlay */}
                            <div className="absolute inset-0 bg-green-500/10 mix-blend-overlay"></div>

                            {/* Field Boundary Simulation */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
                                <path
                                    d="M30,30 L70,35 L75,70 L25,65 Z"
                                    fill="rgba(19, 236, 109, 0.2)"
                                    stroke="#13ec6d"
                                    strokeWidth="0.5"
                                    strokeDasharray="2,1"
                                />
                            </svg>

                            {/* NDVI Legend */}
                            <div className="absolute top-6 right-6 bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/10 text-[10px]">
                                <p className="font-bold mb-2 uppercase opacity-60">NDVI Health</p>
                                <div className="space-y-1.5 font-medium">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-[#13ec6d]"></div>
                                        <span>High Health</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                                        <span>Stressed</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                        <span>Soil/Gap</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Analysis Card */}
                        <div className="px-6 -mt-12 relative z-10">
                            <div className="bg-white/10 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold">Health Index: 0.84</h2>
                                    <span className="bg-primary/20 text-primary text-[10px] font-bold px-2 py-1 rounded-full uppercase">Optimal</span>
                                </div>
                                <p className="text-sm text-gray-400 leading-relaxed mb-6">
                                    The vegetation index shows consistent growth across 85% of your plot. Minor stress detected in the south-east corner (needs water).
                                </p>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center">
                                        <p className="text-[10px] uppercase text-gray-500 font-bold mb-1">Chlorophyll</p>
                                        <p className="text-lg font-bold text-primary">82%</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] uppercase text-gray-500 font-bold mb-1">Moisture</p>
                                        <p className="text-lg font-bold text-blue-400">65%</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] uppercase text-gray-500 font-bold mb-1">Organic</p>
                                        <p className="text-lg font-bold text-orange-400">2.4%</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Actions Bar */}
            <div className="p-6 pb-10">
                <button className="w-full bg-primary text-black font-bold py-4 rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-transform flex items-center justify-center gap-2">
                    <span className="material-icons-round">analytics</span>
                    Detailed Soil Report
                </button>
            </div>
        </div>
    );
};

export default SatelliteImagery;
