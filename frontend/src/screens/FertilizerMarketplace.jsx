import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const FertilizerMarketplace = ({ onBack, userProfile, selectedFarmId }) => {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef(null);

    // Initial greeting
    useEffect(() => {
        setMessages([{
            id: 1,
            text: `Welcome to the Fertilizer Marketplace${userProfile?.name ? `, ${userProfile.name.split(' ')[0]}` : ''}! I am your AI Market Assistant powered by Liquid. Ask me about live prices, fertilizer recommendations for your crops, or organic alternatives!`,
            isAI: true,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
    }, [userProfile]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

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
            // Extract history without welcome message
            const messageHistory = newMessages.slice(1).map(m => ({
                role: m.isAI ? 'assistant' : 'user',
                content: m.text
            }));

            // Fetch from our new backend route
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/fertilizer/ask`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                },
                body: JSON.stringify({
                    messages: messageHistory,
                    context: { farmId: selectedFarmId }
                })
            });

            if (!response.ok) {
                throw new Error('Failed to reach AI API');
            }

            const data = await response.json();
            
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
            <header className="bg-gradient-to-r from-blue-700 to-sky-600 dark:from-blue-900 dark:to-sky-800 text-white px-4 py-4 !pt-12 shrink-0 shadow-md z-10 sticky top-0">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-white/20 transition-colors active:scale-95">
                        <span className="material-icons">arrow_back_ios_new</span>
                    </button>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Fertilizer Market</h1>
                        <p className="text-xs text-blue-100 flex items-center font-medium">
                            <span className="w-2 h-2 rounded-full bg-green-400 mr-1.5 animate-pulse"></span>
                            Liquid AI Engine • Online
                        </p>
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 stylized-scrollbar pb-6 bg-[#f8fafc] dark:bg-black/40" ref={scrollRef}>
                <div className="flex justify-center mb-6">
                    <span className="text-xs text-slate-500 bg-slate-200/50 dark:bg-slate-800/50 px-3 py-1 rounded-full font-medium">
                        Live Market Connection Established
                    </span>
                </div>

                {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.isAI ? 'justify-start' : 'justify-end'} animate-fade-in`}>
                        {msg.isAI && (
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 flex items-center justify-center mr-2 shrink-0 mt-1 shadow-sm">
                                <span className="material-symbols-outlined text-[18px] text-blue-600 dark:text-blue-300">shopping_bag</span>
                            </div>
                        )}
                        <div className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-md ${msg.isAI ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-sm border border-slate-100 dark:border-slate-700/50' : 'bg-blue-600 dark:bg-blue-700 text-white rounded-tr-sm'}`}>
                            <div className="text-[14px] leading-relaxed markdown-override">
                                {msg.isAI ? (
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                                ) : (
                                    msg.text
                                )}
                            </div>
                            <div className={`text-[10px] mt-1.5 flex justify-end ${msg.isAI ? 'text-slate-400' : 'text-blue-200'}`}>
                                {msg.time} {msg.isAI && <span className="material-symbols-outlined text-[11px] ml-1">verified</span>}
                            </div>
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="flex justify-start">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 flex items-center justify-center mr-2 shrink-0 mt-1">
                            <span className="material-symbols-outlined text-[18px] text-blue-600 dark:text-blue-300 animate-pulse">local_florist</span>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-1.5">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0 pb-6 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)]">
                <div className="flex gap-2 mb-3 overflow-x-auto hide-scrollbar">
                    <button onClick={() => setInputText("What's the current price of Urea?")} className="shrink-0 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs px-4 py-2 rounded-full font-medium transition-colors border border-slate-200 dark:border-slate-700 whitespace-nowrap">Price of Urea</button>
                    <button onClick={() => setInputText("Recommend a fertilizer for Wheat")} className="shrink-0 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs px-4 py-2 rounded-full font-medium transition-colors border border-slate-200 dark:border-slate-700 whitespace-nowrap">Wheat Fertilizer</button>
                    <button onClick={() => setInputText("Organic alternatives to DAP?")} className="shrink-0 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs px-4 py-2 rounded-full font-medium transition-colors border border-slate-200 dark:border-slate-700 whitespace-nowrap">Organic Alternatives</button>
                </div>

                <form onSubmit={handleSend} className="relative flex items-center">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Ask market prices or recommendations..."
                        className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-full pl-5 pr-14 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium placeholder:text-slate-400 shadow-inner"
                        disabled={isTyping}
                    />
                    <button 
                        type="submit" 
                        disabled={!inputText.trim() || isTyping}
                        className="absolute right-1.5 h-10 w-10 flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-full transition-all active:scale-95 shadow-md"
                    >
                        <span className="material-icons text-lg pr-0.5">send</span>
                    </button>
                </form>
            </div>
            
            <style jsx>{`
                .markdown-override p:last-child { margin-bottom: 0; }
                .markdown-override p { margin-bottom: 0.5em; }
                .markdown-override ul { list-style-type: disc; padding-left: 1.5em; margin-bottom: 0.5em; }
                .markdown-override h3 { font-weight: bold; font-size: 1.1em; color: inherit; margin-bottom: 0.4em; }
                .markdown-override strong { font-weight: 800; color: inherit; }
            `}</style>
        </div>
    );
};

export default FertilizerMarketplace;
