import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FERTILIZER_CATALOG } from '../utils/npkAgronomyModel';
import { useCart } from '../context/CartContext';
import API from '../api';

const FertilizerMarketplace = ({ onBack, userProfile, selectedFarmId }) => {
    const { addToCart, cartCount, setIsCartOpen } = useCart();

    const [activeTab, setActiveTab] = useState('store'); // 'store' | 'chat'
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [quantities, setQuantities] = useState({
        urea: 1,
        dap: 1,
        mop: 1,
        ssp: 1,
        npk_10_26_26: 1
    });
    const [addedToast, setAddedToast] = useState(null);
    const scrollRef = useRef(null);

    // Initial greeting for chat
    useEffect(() => {
        setMessages([{
            id: 1,
            text: `Welcome to the Fertilizer Marketplace${userProfile?.name ? `, ${userProfile.name.split(' ')[0]}` : ''}! I am your Senior Agronomist powered by ICAR nutrient management guidelines. Ask me about crop doses, live NBS prices, or organic substitutes!`,
            isAI: true,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
    }, [userProfile]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping, activeTab]);

    const handleQuantityChange = (id, delta) => {
        setQuantities(prev => ({
            ...prev,
            [id]: Math.max(1, (prev[id] || 1) + delta)
        }));
    };

    const handleAddProductToCart = (product) => {
        const qty = quantities[product.id] || 1;
        addToCart(product, qty);
        setAddedToast(`Added ${qty} bag(s) of ${product.name} to Cart!`);
        setTimeout(() => setAddedToast(null), 2500);
    };

    const handleSend = async (e) => {
        e?.preventDefault();
        if (!inputText.trim() || isTyping) return;

        const userText = inputText.trim();
        setInputText('');
        
        const userMsg = {
            id: Date.now(),
            text: userText,
            isAI: false,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setIsTyping(true);

        try {
            const messageHistory = newMessages.slice(1).map(m => ({
                role: m.isAI ? 'assistant' : 'user',
                content: m.text
            }));

            const { data } = await API.post('/fertilizer/ask', {
                messages: messageHistory,
                context: { farmId: selectedFarmId }
            }, { timeout: 60000 });
            
            const aiMsg = {
                id: Date.now() + 1,
                text: data.response || "Sorry, I couldn't reach the fertilizer marketplace stream.",
                isAI: true,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error('Marketplace Chat Error:', error);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                text: "⚠️ Connection to the Marketplace server was lost. Please check your internet or try again later.",
                isAI: true,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto bg-slate-50 dark:bg-background-dark h-[100dvh] flex flex-col font-display antialiased relative">
            {/* ── Header ── */}
            <header className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white px-4 py-3 !pt-12 shrink-0 shadow-lg z-10 sticky top-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={onBack} 
                            className="p-2 -ml-2 rounded-full hover:bg-white/20 transition-colors active:scale-95"
                        >
                            <span className="material-symbols-outlined text-xl">arrow_back</span>
                        </button>
                        <div>
                            <h1 className="text-lg font-black tracking-tight leading-tight">Fertilizer Marketplace</h1>
                            <p className="text-[11px] text-emerald-200 flex items-center font-bold">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                                Subsidized GOI NBS Catalog
                            </p>
                        </div>
                    </div>

                    {/* Cart Trigger */}
                    <button
                        onClick={() => setIsCartOpen(true)}
                        className="relative p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all"
                        title="Open Cart"
                    >
                        <span className="material-symbols-outlined text-white text-xl">shopping_cart</span>
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 text-slate-900 text-[10px] font-black flex items-center justify-center shadow-md animate-pulse">
                                {cartCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* ── Sub-tabs ── */}
                <div className="flex rounded-xl bg-black/25 p-1 mt-3 text-xs font-bold">
                    <button
                        onClick={() => setActiveTab('store')}
                        className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                            activeTab === 'store'
                                ? 'bg-white text-emerald-900 shadow-md'
                                : 'text-emerald-100 hover:text-white'
                        }`}
                    >
                        <span className="material-symbols-outlined text-sm">storefront</span>
                        Buy Fertilizers
                    </button>
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                            activeTab === 'chat'
                                ? 'bg-white text-emerald-900 shadow-md'
                                : 'text-emerald-100 hover:text-white'
                        }`}
                    >
                        <span className="material-symbols-outlined text-sm">psychology</span>
                        AI Agronomist Chat
                    </button>
                </div>
            </header>

            {/* Added Toast */}
            {addedToast && (
                <div className="fixed top-28 left-4 right-4 max-w-md mx-auto z-40 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-2xl animate-fade-in">
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    <span>{addedToast}</span>
                </div>
            )}

            {/* ── TAB 1: PRODUCT STORE ── */}
            {activeTab === 'store' && (
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 pb-24 bg-[#f8fafc] dark:bg-black/30">
                    {/* Affiliate Commission & NBS Guarantee Notice */}
                    <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border border-emerald-500/25 rounded-2xl p-3.5 flex items-start gap-3 shadow-sm">
                        <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-2xl shrink-0 mt-0.5">
                            verified
                        </span>
                        <div>
                            <h3 className="text-xs font-black text-emerald-900 dark:text-emerald-300">
                                100% Genuine Subsidized Fertilizers
                            </h3>
                            <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-0.5 leading-relaxed">
                                Sourced directly through <strong>IFFCO & PACS Primary Cooperatives</strong> under Government of India NBS rates. KisanSahayak earns an affiliate referral commission directly from manufacturers.
                            </p>
                        </div>
                    </div>

                    {/* Product Cards List */}
                    {Object.values(FERTILIZER_CATALOG).map(product => {
                        const qty = quantities[product.id] || 1;
                        const subtotal = product.mrp * qty;
                        const commissionEarned = (subtotal * product.commissionRate).toFixed(2);

                        return (
                            <div 
                                key={product.id}
                                className="bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-3xl p-4 shadow-sm hover:shadow-md transition-all space-y-3"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                                            <span className="material-symbols-outlined text-2xl">
                                                {product.id === 'urea' ? 'grain' : product.id === 'dap' ? 'energy_savings_leaf' : 'compost'}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <h4 className="text-xs font-black text-gray-900 dark:text-white leading-snug">
                                                    {product.name}
                                                </h4>
                                                <span className="px-1.5 py-0.2 rounded text-[8px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                                    GOI NBS
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                                                {product.nutrientGrade} • {product.bagWeightKg} kg Bag
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                                            ₹{product.mrp.toFixed(2)}
                                        </div>
                                        <span className="text-[9px] text-gray-400">/ bag</span>
                                    </div>
                                </div>

                                <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-snug">
                                    {product.benefits}
                                </p>

                                {/* Action Controls */}
                                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5">
                                    {/* Quantity Stepper */}
                                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/10 rounded-xl px-2.5 py-1">
                                        <button 
                                            onClick={() => handleQuantityChange(product.id, -1)}
                                            className="text-gray-500 hover:text-emerald-500 active:scale-90 text-sm font-bold w-4 text-center"
                                        >
                                            -
                                        </button>
                                        <span className="text-xs font-extrabold text-gray-800 dark:text-white min-w-5 text-center">
                                            {qty}
                                        </span>
                                        <button 
                                            onClick={() => handleQuantityChange(product.id, 1)}
                                            className="text-gray-500 hover:text-emerald-500 active:scale-90 text-sm font-bold w-4 text-center"
                                        >
                                            +
                                        </button>
                                        <span className="text-[10px] text-gray-400 font-medium pl-1">Bags</span>
                                    </div>

                                    {/* Add to Cart Button */}
                                    <button
                                        onClick={() => handleAddProductToCart(product)}
                                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-xs flex items-center gap-1.5 active:scale-95 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-sm">add_shopping_cart</span>
                                        Add to Cart (₹{subtotal.toFixed(0)})
                                    </button>
                                </div>

                                {/* Commission Info */}
                                <div className="text-[9px] text-gray-400 flex items-center justify-between px-1">
                                    <span>Manufacturer: {product.manufacturer}</span>
                                    <span className="text-blue-500 font-bold">Partner Commission: ₹{commissionEarned} (3.5%)</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── TAB 2: AI AGRONOMIST CHAT ── */}
            {activeTab === 'chat' && (
                <>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 stylized-scrollbar pb-6 bg-[#f8fafc] dark:bg-black/40" ref={scrollRef}>
                        <div className="flex justify-center mb-4">
                            <span className="text-xs text-slate-500 bg-slate-200/50 dark:bg-slate-800/50 px-3 py-1 rounded-full font-medium">
                                ICAR Agronomy Guidelines Active
                            </span>
                        </div>

                        {messages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.isAI ? 'justify-start' : 'justify-end'} animate-fade-in`}>
                                {msg.isAI && (
                                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 border border-emerald-200 dark:border-emerald-700 flex items-center justify-center mr-2 shrink-0 mt-1 shadow-sm">
                                        <span className="material-symbols-outlined text-[18px] text-emerald-600 dark:text-emerald-300">psychiatry</span>
                                    </div>
                                )}
                                <div className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-md ${msg.isAI ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-sm border border-slate-100 dark:border-slate-700/50' : 'bg-emerald-600 text-white rounded-tr-sm'}`}>
                                    <div className="text-[13px] leading-relaxed markdown-override">
                                        {msg.isAI ? (
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                                        ) : (
                                            msg.text
                                        )}
                                    </div>
                                    <div className={`text-[10px] mt-1.5 flex justify-end ${msg.isAI ? 'text-slate-400' : 'text-emerald-200'}`}>
                                        {msg.time} {msg.isAI && <span className="material-symbols-outlined text-[11px] ml-1">verified</span>}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 border border-emerald-200 dark:border-emerald-700 flex items-center justify-center mr-2 shrink-0 mt-1">
                                    <span className="material-symbols-outlined text-[18px] text-emerald-600 dark:text-emerald-300 animate-pulse">local_florist</span>
                                </div>
                                <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-1.5">
                                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0 pb-6 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)]">
                        <div className="flex gap-2 mb-3 overflow-x-auto hide-scrollbar">
                            <button onClick={() => setInputText("What's the current price of Urea?")} className="shrink-0 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs px-3 py-1.5 rounded-full font-medium transition-colors border border-slate-200 dark:border-slate-700 whitespace-nowrap">Price of Urea</button>
                            <button onClick={() => setInputText("Recommend a fertilizer dose for Wheat")} className="shrink-0 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs px-3 py-1.5 rounded-full font-medium transition-colors border border-slate-200 dark:border-slate-700 whitespace-nowrap">Wheat Dose</button>
                            <button onClick={() => setInputText("How much DAP is needed per acre for Paddy?")} className="shrink-0 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs px-3 py-1.5 rounded-full font-medium transition-colors border border-slate-200 dark:border-slate-700 whitespace-nowrap">DAP for Paddy</button>
                        </div>

                        <form onSubmit={handleSend} className="relative flex items-center">
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Ask fertilizer doses, prices, or application..."
                                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-full pl-5 pr-14 py-3.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium placeholder:text-slate-400 shadow-inner text-xs"
                                disabled={isTyping}
                            />
                            <button 
                                type="submit" 
                                disabled={!inputText.trim() || isTyping}
                                className="absolute right-1.5 h-10 w-10 flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-full transition-all active:scale-95 shadow-md cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-lg">send</span>
                            </button>
                        </form>
                    </div>
                </>
            )}
        </div>
    );
};

export default FertilizerMarketplace;
