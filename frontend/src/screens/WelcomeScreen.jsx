import farmerImg from '../assets/farmer.jpg';

const WelcomeScreen = ({ onGetStarted, onLogin }) => {
    return (
        <div className="mx-auto max-w-md h-screen flex flex-col bg-white overflow-hidden relative font-sans">
            {/* Top App Bar - Solid Green */}
            <div className="bg-[#0B4324] w-full pt-10 pb-4 px-6 flex justify-between items-center z-20 shrink-0">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-[#08331a] flex items-center justify-center shadow-inner">
                        <svg className="w-[18px] h-[18px] text-[#86d8b6]" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17,8C8,10,5.9,16.17,3.82,21.34L5.71,22l1-2.3A4.49,4.49,0,0,0,8,20C19,20,22,3,22,3,21,5,14,5.25,9,6.25S2,11.5,2,13.5a6.22,6.22,0,0,0,1.75,3.75C7,8,17,8,17,8Z"></path>
                        </svg>
                    </div>
                    <span className="text-white font-bold text-[18px] tracking-wide">Kisan Sahayak</span>
                </div>
                <button
                    onClick={onGetStarted}
                    className="flex items-center space-x-1.5 bg-[#185e3a] px-3.5 py-1.5 rounded-full border border-white/5 shadow-sm transition active:scale-95 hover:bg-[#1a6b42]"
                >
                    <span className="material-icons text-white/90 text-[18px]">translate</span>
                    <span className="text-[13px] font-medium text-white/90">English</span>
                    <span className="material-icons text-white/70 text-[18px]">expand_more</span>
                </button>
            </div>

            {/* Hero Image Group */}
            <div className="relative z-10 w-full h-[35vh] min-h-[260px] rounded-b-[48px] overflow-hidden shadow-md shrink-0 bg-slate-100">
                <img
                    alt="Indian Farmer working in field"
                    className="absolute inset-0 w-full h-full object-cover"
                    src={farmerImg}
                    style={{ objectPosition: 'center 30%' }}
                />
                {/* Slight green tint/gradient over image to match the provided screenshot */}
                <div className="absolute inset-0 bg-[#0c472c]/20"></div>
                <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-[#0c472c]/40 to-transparent"></div>
            </div>

            {/* Bottom Content Area */}
            <div className="flex-1 flex flex-col items-center justify-between px-6 pt-5 pb-4 bg-white z-0 relative">

                {/* Text Content */}
                <div className="flex flex-col items-center text-center mt-2 w-full">
                    <h1 className="text-[22px] font-bold tracking-tight text-[#0f172a] leading-[1.2] mb-3">
                        Intelligent Farm<br />
                        Operations at your<br />
                        fingertips
                    </h1>
                    <p className="text-[13px] text-[#64748b] leading-[1.5] max-w-[280px]">
                        Manage crops, soil health, and<br />finances in one secure place.<br />Experience the future of farming today.
                    </p>
                </div>

                {/* Bottom Actions */}
                <div className="w-full flex items-center flex-col mt-auto pt-2">
                    <button
                        onClick={onLogin}
                        className="w-full bg-[#0ED054] hover:bg-[#0bc24d] text-white font-bold text-[15px] py-[12px] px-6 rounded-full transition-all transform active:scale-[0.98] flex items-center justify-center mb-4"
                        style={{ boxShadow: '0 4px 14px 0 rgba(14,208,84,0.39)' }}
                    >
                        <span>Login / Register</span>
                    </button>

                    <div className="flex flex-col items-center w-full">
                        <div className="flex items-center space-x-2 mb-3">
                            <div className="w-4 h-4 rounded-full bg-[#0ED054] flex items-center justify-center">
                                <span className="material-icons text-white text-[11px] font-bold">check</span>
                            </div>
                            <span className="text-[10px] font-bold text-[#94a3b8] tracking-widest uppercase">
                                Empowering Indian Agriculture
                            </span>
                        </div>

                        <div className="text-[12px] text-[#94a3b8] flex items-center space-x-2">
                            <span>Made for Indian Farmers</span>
                            <span className="text-[15px]">🇮🇳</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WelcomeScreen;
