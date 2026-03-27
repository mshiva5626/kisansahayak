import React, { useState, useEffect, useRef } from 'react';
import { aiAPI, farmAPI, weatherAPI } from '../api';

const AIAdvisoryChatbot = ({ onBack, selectedFarmId, userProfile, chatContext, clearContext }) => {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [farmData, setFarmData] = useState(null);
    const [isListening, setIsListening] = useState(false);
    const scrollRef = useRef(null);
    const recognitionRef = useRef(null);
    const hasProcessedContext = useRef(false);
    const initialTextRef = useRef('');
    const ignoreResultRef = useRef(false);
    const latestInputRef = useRef('');
    const shouldAutoSendRef = useRef(false);
    
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [playingMessageId, setPlayingMessageId] = useState(null);
    const autoSpeakNext = useRef(false);

    // Stop speaking utility
    const stopSpeaking = () => {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            setPlayingMessageId(null);
        }
    };

    // Toggle playback for a message
    const togglePlayback = (msg) => {
        if (isSpeaking && playingMessageId === msg.id) {
            stopSpeaking();
            return;
        }
        
        stopSpeaking();
        if (!('speechSynthesis' in window)) return;
        
        // Strip out non-spoken markdown
        let textToRead = msg.text.replace(/\*\*/g, '').replace(/#/g, '').replace(/-/g, '').trim();
        const utterance = new SpeechSynthesisUtterance(textToRead);
        
        const langMap = {
            'hi': 'hi-IN', 'mr': 'mr-IN', 'ta': 'ta-IN', 'te': 'te-IN', 
            'en': 'en-IN', 'gu': 'gu-IN', 'bn': 'bn-IN', 'pa': 'pa-IN'
        };
        utterance.lang = langMap[userProfile?.preferred_language] || 'hi-IN';
        
        utterance.onstart = () => {
            setIsSpeaking(true);
            setPlayingMessageId(msg.id);
        };
        utterance.onend = () => {
            setIsSpeaking(false);
            setPlayingMessageId(null);
        };
        utterance.onerror = () => {
            setIsSpeaking(false);
            setPlayingMessageId(null);
        };

        window.speechSynthesis.speak(utterance);
    };

    // Cleanup speech on unmount
    useEffect(() => {
        return () => {
            if (window.speechSynthesis) window.speechSynthesis.cancel();
        };
    }, []);

    // Load farm data on mount
    useEffect(() => {
        const loadContext = async () => {
            if (selectedFarmId) {
                try {
                    const { data } = await farmAPI.getFarmById(selectedFarmId);
                    setFarmData(data.farm);
                    setMessages([{
                        id: 1,
                        text: `Namaste${userProfile?.name ? `, ${userProfile.name.split(' ')[0]}` : ''}! I have your ${data.farm.crop_type || 'farm'} data loaded${data.farm.state ? ` from ${data.farm.state}` : ''}. How can I help with your farming operations today?`,
                        isAI: true,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }]);
                } catch (e) {
                    console.error('Failed to load farm data:', e);
                    setMessages([{
                        id: 1,
                        text: "Namaste! I'm your farming assistant. I couldn't load your farm details, but I can still answer general agriculture questions.",
                        isAI: true,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }]);
                }
            } else {
                setMessages([{
                    id: 1,
                    text: "Namaste! I'm your farming assistant. No farm is currently selected — please select a farm from the dashboard for personalized recommendations. I can still answer general agriculture questions.",
                    isAI: true,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }]);
            }
        };

        const initChat = async () => {
            await loadContext();
        };
        initChat();
    }, [selectedFarmId, userProfile]);

    // Handle incoming external context (like Crop Scans)
    useEffect(() => {
        if (chatContext?.type === 'crop_scan' && chatContext.data && farmData && !hasProcessedContext.current) {
            hasProcessedContext.current = true;
            // Give the UI a tiny moment to render the greeting first
            setTimeout(() => {
                const scan = chatContext.data;
                const indicators = scan.indicators?.length > 0 ? scan.indicators.join(', ') : 'None';
                const assessment = scan.analysis?.overall_assessment || scan.analysis?.raw_analysis || 'Unknown issue';

                const autoPrompt = `I just scanned my ${farmData.crop_type || 'crop'} with the vision AI. It observed: "${assessment}". Primary indicators: ${indicators}. Please provide a detailed, step-by-step treatment plan and any necessary agronomic recommendations.`;

                // Simulate user sending this message
                const userMsg = {
                    id: Date.now(),
                    text: autoPrompt,
                    isAI: false,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };

                setMessages(prev => {
                    const newMessages = [...prev, userMsg];
                    // Trigger the API call
                    processAutoMessage(newMessages, autoPrompt);
                    return newMessages;
                });

                if (clearContext) clearContext();
            }, 800);
        }
    }, [chatContext, farmData, clearContext]);

    const processAutoMessage = async (history, newText) => {
        setIsTyping(true);
        const messageHistory = history.map(m => ({
            role: m.isAI ? 'assistant' : 'user',
            content: m.text
        }));

        try {
            const { data } = await aiAPI.chat(messageHistory, selectedFarmId);
            const aiMsg = {
                id: Date.now() + 1,
                text: data.response,
                isAI: true,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error('AI Error (Auto Context):', error);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                text: "I received your scan, but I'm having trouble analyzing the treatment plan right now. Please try asking again.",
                isAI: true,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const toggleListening = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert("Voice input is not supported in your browser.");
            return;
        }

        if (!recognitionRef.current) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.continuous = false; // Stop automatically when the user pauses
            recognition.interimResults = true;

            const langMap = {
                'hi': 'hi-IN',
                'mr': 'mr-IN',
                'ta': 'ta-IN',
                'te': 'te-IN',
                'en': 'en-IN',
                'gu': 'gu-IN',
                'bn': 'bn-IN',
                'pa': 'pa-IN'
            };
            // Defaulting to hi-IN as it supports mixed English/Hindi extremely well for Indian context
            recognition.lang = langMap[userProfile?.preferred_language] || 'hi-IN';

            recognition.onstart = () => setIsListening(true);

            recognition.onresult = (event) => {
                if (ignoreResultRef.current) return;
                let transcript = '';
                for (let i = 0; i < event.results.length; i++) {
                    transcript += event.results[i][0].transcript;
                }
                const newText = initialTextRef.current ? initialTextRef.current + ' ' + transcript : transcript;
                setInputText(newText);
                latestInputRef.current = newText;
            };

            recognition.onerror = (event) => {
                console.error("Speech Recognition Error:", event.error);
                setIsListening(false);
                shouldAutoSendRef.current = false;
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        }

        if (isListening) {
            recognitionRef.current.stop(); // This triggers onend which handles the auto-send
        } else {
            ignoreResultRef.current = false;
            shouldAutoSendRef.current = true;
            initialTextRef.current = inputText;
            latestInputRef.current = inputText;
            recognitionRef.current.start();
        }
    };

    // Auto-send effect when listening naturally or manually stops
    useEffect(() => {
        if (!isListening && shouldAutoSendRef.current && latestInputRef.current.trim()) {
            shouldAutoSendRef.current = false;
            autoSpeakNext.current = true;
            // Instantly sync the final text and trigger send
            setInputText(latestInputRef.current);
            setTimeout(() => {
                document.getElementById('send-btn')?.click();
            }, 50);
        }
    }, [isListening]);

    const handleSend = async () => {
        if (!inputText.trim() && !latestInputRef.current.trim()) return;

        const currentText = inputText.trim() ? inputText : latestInputRef.current;

        if (isListening && recognitionRef.current) {
            ignoreResultRef.current = true;
            shouldAutoSendRef.current = false;
            recognitionRef.current.stop();
            setIsListening(false);
            autoSpeakNext.current = true; // Auto-speak AI reply since user sent via voice
        } else {
            autoSpeakNext.current = false;
        }

        stopSpeaking(); // Stop any active playback when starting a new message

        const userMsg = {
            id: Date.now(),
            text: currentText,
            isAI: false,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInputText('');
        latestInputRef.current = '';
        setIsTyping(true);

        // Format history for backend OpenRouter API
        const messageHistory = newMessages.map(m => ({
            role: m.isAI ? 'assistant' : 'user',
            content: m.text
        }));

        // Ensure farm is loaded before sending
        if (!farmData || !farmData.crop_type) {
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    id: Date.now() + 1,
                    text: 'Insufficient farm data. Please ensure your farm has a crop selected to access the AI assistant.',
                    isAI: true,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }]);
                setIsTyping(false);
            }, 600);
            return;
        }

        try {
            const { data } = await aiAPI.chat(messageHistory, selectedFarmId);
            const aiMsg = {
                id: Date.now() + 1,
                text: data.response,
                isAI: true,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, aiMsg]);
            
            if (autoSpeakNext.current) {
                autoSpeakNext.current = false;
                setTimeout(() => togglePlayback(aiMsg), 200);
            }
        } catch (error) {
            console.error('AI Error:', error);
            const msgText = error.response?.data?.message || "I'm having trouble connecting right now. Please check your internet connection and try again.";
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                text: msgText,
                isAI: true,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    // Simple markdown-like rendering for AI responses
    const renderAIText = (text) => {
        if (!text) return null;
        const lines = text.split('\n');
        return lines.map((line, idx) => {
            // Bold headers
            if (line.startsWith('**') && line.endsWith('**')) {
                return <p key={idx} className="font-bold text-primary mt-3 mb-1">{line.replace(/\*\*/g, '')}</p>;
            }
            // Bold with content
            if (line.includes('**')) {
                const parts = line.split('**');
                return (
                    <p key={idx} className="mb-1">
                        {parts.map((part, i) =>
                            i % 2 === 1 ? <strong key={i} className="text-gray-900 dark:text-white">{part}</strong> : part
                        )}
                    </p>
                );
            }
            // Numbered list
            if (/^\d+\./.test(line.trim())) {
                return <p key={idx} className="ml-2 mb-0.5">{line}</p>;
            }
            // Bullet
            if (line.trim().startsWith('- ')) {
                return <p key={idx} className="ml-2 mb-0.5">• {line.trim().substring(2)}</p>;
            }
            // Empty line
            if (!line.trim()) return <br key={idx} />;
            // Normal
            return <p key={idx} className="mb-1">{line}</p>;
        });
    };

    return (
        <div className="bg-background-light dark:bg-background-dark text-neutral-text-light dark:text-neutral-text-dark font-display antialiased h-screen flex flex-col overflow-hidden selection:bg-primary/30">
            {/* Header */}
            <header className="bg-white/80 dark:bg-neutral-surface-dark/80 backdrop-blur-md border-b border-neutral-surface-light dark:border-white/5 sticky top-0 z-20 px-4 pt-12 pb-3 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onBack}
                            className="p-2 -ml-2 rounded-full hover:bg-neutral-surface-light dark:hover:bg-white/5 transition-colors text-neutral-muted-light dark:text-neutral-muted-dark"
                        >
                            <span className="material-icons-round">arrow_back_ios_new</span>
                        </button>
                        <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border border-primary/20">
                                <span className="material-icons-round text-primary text-xl">smart_toy</span>
                            </div>
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-primary border-2 border-white dark:border-neutral-surface-dark rounded-full"></div>
                        </div>
                        <div>
                            <h1 className="font-semibold text-lg leading-tight">Kisan Assistant</h1>
                            <div className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                                <p className="text-xs text-primary font-medium">
                                    {isTyping ? 'Analyzing...' : farmData ? `${farmData.crop_type || 'Farm'} context loaded` : 'Online'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Chat Area */}
            <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 pb-32 space-y-6 scroll-smooth">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-3 animate-fade-in items-end ${msg.isAI ? '' : 'flex-row-reverse'}`}>
                        {msg.isAI && (
                            <div className="w-8 h-8 flex-shrink-0 rounded-full bg-primary/20 flex items-center justify-center self-end mb-1">
                                <span className="material-icons-round text-primary text-sm">smart_toy</span>
                            </div>
                        )}
                        <div className={`flex flex-col gap-1 max-w-[85%] ${msg.isAI ? '' : 'items-end'}`}>
                            <div className={`${msg.isAI ? 'bg-white dark:bg-neutral-surface-dark rounded-bl-none text-neutral-text-light dark:text-neutral-text-dark border border-neutral-surface-light dark:border-white/5' : 'bg-primary rounded-br-none text-white dark:text-neutral-surface-dark font-medium'} p-4 rounded-2xl shadow-card text-[15px] leading-relaxed relative group`}>
                                {msg.isAI ? (
                                    <>
                                        <div className="text-sm leading-relaxed">{renderAIText(msg.text)}</div>
                                        <button 
                                            onClick={() => togglePlayback(msg)}
                                            className={`absolute -right-3 -bottom-3 p-1.5 rounded-full shadow-sm border transition-all ${playingMessageId === msg.id ? 'bg-primary text-white border-primary animate-pulse shadow-primary/30 z-10' : 'bg-white dark:bg-neutral-surface-dark text-neutral-muted-light dark:text-neutral-muted-dark border-neutral-surface-light dark:border-white/10 hover:bg-neutral-surface-light dark:hover:bg-white/5 opacity-0 group-hover:opacity-100 focus:opacity-100'}`}
                                            title={playingMessageId === msg.id ? "Stop Speaking" : "Listen to response"}
                                        >
                                            <span className="material-icons-round text-sm">{playingMessageId === msg.id ? 'stop' : 'volume_up'}</span>
                                        </button>
                                    </>
                                ) : (
                                    <p>{msg.text}</p>
                                )}
                            </div>
                            <span className="text-[11px] text-neutral-muted-light dark:text-neutral-muted-dark mx-1">{msg.time}</span>
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex gap-3 animate-pulse items-center ml-11">
                        <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-75"></div>
                            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-150"></div>
                        </div>
                    </div>
                )}
            </main>

            {/* Bottom Input Section */}
            <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-background-dark border-t border-neutral-surface-light dark:border-white/5 pb-10 pt-2 z-30">
                <div className="px-4 flex items-end gap-2">
                    <div className={`flex-1 rounded-2xl px-4 py-3 flex items-center gap-2 border transition-all duration-300 ${isListening ? 'border-red-500/50 ring-2 ring-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.15)] bg-red-50/50 dark:bg-red-900/10' : 'bg-neutral-surface-light dark:bg-neutral-surface-dark border-transparent focus-within:border-primary/50'}`}>
                        <textarea
                            className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 text-neutral-text-light dark:text-neutral-text-dark placeholder-neutral-muted-light dark:placeholder-neutral-muted-dark resize-none max-h-24"
                            placeholder={isListening ? 'Listening...' : (farmData ? `Ask about your ${farmData.crop_type || 'crop'}...` : 'Ask about crops, weather...')}
                            rows="1"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                        ></textarea>

                        <button
                            onClick={toggleListening}
                            className={`flex-shrink-0 p-2 rounded-full transition-colors ${isListening ? 'text-red-500 bg-red-500/10' : 'text-neutral-muted-light dark:text-neutral-muted-dark hover:bg-black/5 dark:hover:bg-white/5'}`}
                        >
                            <span className="material-icons-round text-[22px]">
                                {isListening ? 'mic' : 'mic_none'}
                            </span>
                        </button>
                    </div>
                    <button
                        id="send-btn"
                        onClick={handleSend}
                        disabled={(!inputText.trim() && !latestInputRef.current.trim()) || isTyping}
                        className="flex-shrink-0 w-12 h-12 mb-0 rounded-full bg-primary text-white dark:text-neutral-surface-dark shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:scale-100"
                    >
                        <span className="material-icons-round text-xl translate-x-0.5">send</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIAdvisoryChatbot;
