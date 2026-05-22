import farmerImg from '../assets/farmer.jpg';

const WelcomeScreen = ({ onGetStarted, onLogin }) => {
    return (
        <div className="w-full min-h-full flex flex-col bg-gradient-to-b from-[#03140A] via-[#082212] to-[#010904] overflow-x-hidden relative font-sans text-white">
            {/* Top Curved Ambient Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-[#0ED054]/10 rounded-full blur-[80px] z-0 pointer-events-none"></div>

            {/* Top App Bar - Premium Translucent Glass */}
            <div className="bg-[#0B4324]/60 backdrop-blur-md border-b border-white/10 w-full pt-10 pb-4 px-6 flex justify-between items-center z-20 shrink-0">
                <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#083D20] to-[#0ED054] flex items-center justify-center shadow-lg border border-white/10">
                        <svg className="w-[20px] h-[20px] text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17,8C8,10,5.9,16.17,3.82,21.34L5.71,22l1-2.3A4.49,4.49,0,0,0,8,20C19,20,22,3,22,3,21,5,14,5.25,9,6.25S2,11.5,2,13.5a6.22,6.22,0,0,0,1.75,3.75C7,8,17,8,17,8Z"></path>
                        </svg>
                    </div>
                    <span className="text-white font-bold text-[19px] tracking-wide bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Kisan Sahayak</span>
                </div>
                <button
                    onClick={onGetStarted}
                    className="flex items-center space-x-1.5 bg-white/10 border border-white/20 px-3.5 py-1.5 rounded-full shadow-sm transition-all duration-300 active:scale-95 hover:bg-white/20 text-white"
                >
                    <span className="material-icons text-white/90 text-[18px]">translate</span>
                    <span className="text-[13px] font-semibold text-white/90">English</span>
                    <span className="material-icons text-white/70 text-[18px]">expand_more</span>
                </button>
            </div>

            {/* Hero Image Group with 3D Depth Card Overlay */}
            <div className="relative z-10 w-full h-[32vh] min-h-[240px] rounded-b-[40px] overflow-hidden shadow-2xl shrink-0 bg-slate-900 border-b border-white/10">
                <img
                    alt="Indian Farmer working in field"
                    className="absolute inset-0 w-full h-full object-cover scale-105 hover:scale-100 transition-transform duration-1000"
                    src={farmerImg}
                    style={{ objectPosition: 'center 30%' }}
                />
                {/* Subtle dark green vignette overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#03140A] via-transparent to-[#0B4324]/30"></div>
            </div>

            {/* Bottom Content Area */}
            <div className="flex-1 flex flex-col items-center justify-between px-6 pt-6 pb-6 z-10 relative">

                {/* Glassmorphic 3D Welcome Card */}
                <div className="w-full krishi-glass rounded-3xl p-6 border border-white/10 shadow-2xl tilt-card mt-[-40px] relative z-20 flex flex-col items-center text-center">
                    {/* Tiny Decorative Badge */}
                    <div className="inline-flex items-center space-x-1 bg-[#0ED054]/10 border border-[#0ED054]/25 px-3 py-1 rounded-full mb-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0ED054] animate-pulse"></span>
                        <span className="text-[10px] font-bold tracking-widest text-[#0ED054] uppercase">AI Powered</span>
                    </div>

                    <h1 className="text-[23px] font-extrabold tracking-tight text-white leading-[1.25] mb-3 bg-gradient-to-b from-white to-gray-200 bg-clip-text text-transparent">
                        Intelligent Farm<br />
                        Operations at your<br />
                        fingertips
                    </h1>
                    
                    <p className="text-[13px] text-gray-300 leading-[1.6] max-w-[280px]">
                        Manage crops, analyze soil health, and get live mandi prices in one secure place.
                    </p>
                </div>

                {/* Bottom Actions */}
                <div className="w-full flex items-center flex-col mt-auto pt-6">
                    <button
                        onClick={onLogin}
                        className="w-full tactile-btn bg-gradient-to-r from-[#0ED054] to-[#0aa140] text-white font-bold text-[16px] py-[14px] px-6 rounded-2xl shadow-lg border border-[#0ED054]/20 hover:brightness-110 flex items-center justify-center mb-5"
                        style={{ boxShadow: '0 8px 24px rgba(14,208,84,0.35)' }}
                    >
                        <span>Login / Register</span>
                    </button>

                    <div className="flex flex-col items-center w-full">
                        <div className="flex items-center space-x-2 mb-3 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full">
                            <div className="w-4 h-4 rounded-full bg-[#0ED054] flex items-center justify-center">
                                <span className="material-icons text-white text-[10px] font-bold">check</span>
                            </div>
                            <span className="text-[9px] font-bold text-gray-400 tracking-widest uppercase">
                                Empowering Indian Agriculture
                            </span>
                        </div>

                        <div className="text-[12px] text-gray-400 flex items-center space-x-1.5">
                            <span>Made for Indian Farmers</span>
                            <span className="text-[14px]">🇮🇳</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WelcomeScreen;

