import React, { useState, useRef, useEffect } from 'react';
import { schemeAPI } from '../api';

const SchemeChatModal = ({ isOpen, onClose, schemesContext, userProfile }) => {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef(null);

    // Initial greeting when opened
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([{
                id: 1,
                text: `Welcome${userProfile?.name ? ' ' + userProfile.name.split(' ')[0] : ''}! I am your Government Schemes Assistant. I have analyzed the ${schemesContext.length} schemes available to you. Ask me about eligibility, benefits, or how to apply!`,
                isAI: true,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        }
    }, [isOpen, messages.length, schemesContext.length, userProfile]);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    if (!isOpen) return null;

    const handleSend = async () => {
        if (!inputText.trim() || isTyping) return;

        const userMsg = {
            id: Date.now(),
            text: inputText,
            isAI: false,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInputText('');
        setIsTyping(true);

        // Format history for backend OpenRouter API
        const apiMessages = newMessages.map(m => ({
            role: m.isAI ? 'assistant' : 'user',
            content: m.text
        }));

        try {
            const { data } = await schemeAPI.chatSchemes(apiMessages, schemesContext);
            const aiMsg = {
                id: Date.now() + 1,
                text: data.response,
                isAI: true,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error('Scheme AI Error:', error);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                text: "I'm having trouble connecting right now. Please test your internet connection and try again.",
                isAI: true,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    // Render simple markdown response
    const renderContent = (text) => {
        if (!text) return null;
        return text.split('\n').map((line, idx) => {
            if (line.trim().startsWith('- ')) {
                return <p key={idx} className="ml-2 mb-1">• {line.substring(2)}</p>;
            }
            if (line.includes('**')) {
                const parts = line.split('**');
                return (
                    <p key={idx} className="mb-1">
                        {parts.map((p, i) => i % 2 === 1 ? <strong key={i}>{p}</strong> : p)}
                    </p>
                );
            }
            if (!line.trim()) return <br key={idx} />;
            return <p key={idx} className="mb-2">{line}</p>;
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/60 backdrop-blur-sm animate-fade-in font-display">
            {/* Modal Container */}
            <div className="flex-1 mt-20 bg-background-light dark:bg-background-dark rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-[slideUp_0.3s_ease-out]">
                {/* Header */}
                <header className="bg-primary px-4 py-4 flex items-center justify-between z-10 shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <span className="material-icons-round text-white">account_balance</span>
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-lg leading-tight">Scheme Assistant</h2>
                            <p className="text-xs text-white/80 font-medium">Powered by StepFun AI</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-black/10 rounded-full hover:bg-black/20 transition text-white">
                        <span className="material-icons-round text-xl">close</span>
                    </button>
                </header>

                {/* Chat Area */}
                <main ref={scrollRef} className="flex-1 overflow-y-auto w-full p-4 space-y-4">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex max-w-[85%] ${msg.isAI ? 'mr-auto items-start' : 'ml-auto flex-row-reverse items-start gap-2'}`}>
                            {msg.isAI && (
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-2 shrink-0">
                                    <span className="material-icons-round text-primary text-sm">psychology</span>
                                </div>
                            )}
                            <div className="flex flex-col gap-1">
                                <div className={`p-3.5 rounded-2xl text-[14px] leading-relaxed shadow-sm
                                    ${msg.isAI ? 'bg-white dark:bg-white/5 text-gray-800 dark:text-gray-100 rounded-tl-sm border border-gray-100 dark:border-white/10' : 'bg-primary text-white rounded-tr-sm'}`}>
                                    {renderContent(msg.text)}
                                </div>
                                <span className={`text-[10px] text-gray-500 font-medium ${msg.isAI ? 'ml-1 text-left' : 'mr-1 text-right'}`}>
                                    {msg.time}
                                </span>
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex mr-auto items-start max-w-[85%]">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-2 shrink-0">
                                <span className="material-icons-round text-primary text-sm">psychology</span>
                            </div>
                            <div className="p-4 rounded-2xl rounded-tl-sm bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10">
                                <div className="flex gap-1.5 align-middle">
                                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></span>
                                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                </div>
                            </div>
                        </div>
                    )}
                </main>

                {/* Input Area */}
                <div className="bg-white dark:bg-surface-dark border-t border-gray-100 dark:border-white/10 p-3 mb-[76px] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                    <div className="flex gap-2">
                        <textarea
                            className="flex-1 bg-gray-50 dark:bg-background-dark border-none rounded-xl px-4 py-3 text-sm focus:ring-0 text-gray-800 dark:text-gray-200 placeholder-gray-400 resize-none max-h-24"
                            rows="1"
                            placeholder="e.g. Determine my eligibility for PM-KISAN..."
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!inputText.trim() || isTyping}
                            className="bg-primary hover:bg-green-500 text-black w-12 h-12 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-50 disabled:scale-100 active:scale-95 transition-all shadow-md"
                        >
                            <span className="material-icons-round">send</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SchemeChatModal;
