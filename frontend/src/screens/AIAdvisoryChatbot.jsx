import React, { useState, useEffect, useRef, useCallback } from 'react';
import { aiAPI, farmAPI } from '../api';

// ============================================================================
// PURE UTILITY FUNCTIONS (OUTSIDE COMPONENT TO AVOID RE-CREATION / MEMORY LAG)
// ============================================================================
function renderBoldText(str) {
    if (!str || !str.includes('**')) return str;
    const parts = str.split('**');
    return parts.map((part, i) =>
        i % 2 === 1 ? (
            <strong key={i} className="font-bold text-white bg-primary/20 px-1 py-0.5 rounded">
                {part}
            </strong>
        ) : part
    );
}

function renderAgronomicMarkdown(text, isAI) {
    if (!isAI) {
        return <p className="drop-shadow-sm text-sm leading-relaxed whitespace-pre-wrap">{text}</p>;
    }

    const lines = (text || '').split('\n');
    return lines.map((line, idx) => {
        const trimmed = line.trim();

        if (trimmed.startsWith('###') || (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length < 60) || /^\d+\.\s+\*\*.*?\*\*/.test(trimmed)) {
            const headerText = trimmed.replace(/^###\s*/, '').replace(/^\d+\.\s*/, '').replace(/\*\*/g, '');
            return (
                <div key={idx} className="mt-3.5 mb-1.5 flex items-center gap-2 border-b border-emerald-500/20 pb-1">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                    <h4 className="font-bold text-sm md:text-base text-emerald-300 tracking-tight">{headerText}</h4>
                </div>
            );
        }

        if (trimmed.toLowerCase().includes('caution') || trimmed.toLowerCase().includes('safety') || trimmed.toLowerCase().includes('warning') || trimmed.toLowerCase().includes('phi:')) {
            return (
                <div key={idx} className="my-2 p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-xs text-amber-300 shadow-sm">
                    <span className="material-icons-round text-amber-400 text-sm shrink-0 mt-0.5">gpp_maybe</span>
                    <span className="leading-relaxed">{trimmed.replace(/\*\*/g, '')}</span>
                </div>
            );
        }

        if (trimmed.toLowerCase().includes('cost per acre') || trimmed.toLowerCase().includes('estimated cost') || trimmed.toLowerCase().includes('₹/acre')) {
            return (
                <div key={idx} className="my-2 p-2 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300 font-bold">
                    <span className="material-icons-round text-emerald-400 text-sm">currency_rupee</span>
                    <span>{trimmed.replace(/^[-*•]\s*/, '').replace(/\*\*/g, '')}</span>
                </div>
            );
        }

        if (/^\d+\./.test(trimmed)) {
            const parts = trimmed.split(/^(?:\d+\.)\s*/);
            const stepNum = trimmed.match(/^(\d+)\./)?.[1] || '•';
            const content = parts[1] || trimmed;
            return (
                <div key={idx} className="flex items-start gap-2.5 my-1.5 ml-0.5 text-sm">
                    <span className="w-5 h-5 rounded-full bg-primary/20 text-emerald-400 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                        {stepNum}
                    </span>
                    <div className="flex-1 leading-relaxed text-slate-200">
                        {renderBoldText(content)}
                    </div>
                </div>
            );
        }

        if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
            const content = trimmed.substring(2);
            return (
                <div key={idx} className="flex items-start gap-2 my-1 ml-1.5 text-sm text-slate-200">
                    <span className="text-primary font-bold text-sm shrink-0 mt-0.5">•</span>
                    <div className="flex-1 leading-relaxed">{renderBoldText(content)}</div>
                </div>
            );
        }

        if (!trimmed) {
            return <div key={idx} className="h-1.5" />;
        }

        return (
            <p key={idx} className="text-sm leading-relaxed text-slate-200 my-1">
                {renderBoldText(line)}
            </p>
        );
    });
}

// ============================================================================
// 1. HARDWARE-ACCELERATED 3D AMBIENT CANVAS BACKGROUND
// ============================================================================
const Interactive3DBackground = React.memo(() => {
    const canvasRef = useRef(null);
    const mousePos = useRef({ x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 });
    const isVisibleRef = useRef(true);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: true });
        let animationFrameId;

        let width = (canvas.width = canvas.offsetWidth || window.innerWidth);
        let height = (canvas.height = canvas.offsetHeight || window.innerHeight);

        const handleResize = () => {
            if (!canvas) return;
            width = canvas.width = canvas.offsetWidth || window.innerWidth;
            height = canvas.height = canvas.offsetHeight || window.innerHeight;
        };

        const handleVisibilityChange = () => {
            isVisibleRef.current = !document.hidden;
        };

        let lastMove = 0;
        const handleMouseMove = (e) => {
            const now = performance.now();
            if (now - lastMove < 16) return;
            lastMove = now;
            const rect = canvas.getBoundingClientRect();
            mousePos.current.targetX = (e.clientX - rect.left) / width;
            mousePos.current.targetY = (e.clientY - rect.top) / height;
        };

        window.addEventListener('resize', handleResize, { passive: true });
        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        document.addEventListener('visibilitychange', handleVisibilityChange);

        const particleCount = 20;
        const particles = Array.from({ length: particleCount }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            z: Math.random() * 0.7 + 0.3,
            vx: (Math.random() - 0.5) * 0.35,
            vy: (Math.random() - 0.5) * 0.35,
            radius: Math.random() * 2.0 + 1.0,
            baseHue: Math.random() > 0.25 ? 142 : 45,
            pulse: Math.random() * Math.PI * 2
        }));

        const render = () => {
            if (!isVisibleRef.current) {
                animationFrameId = requestAnimationFrame(render);
                return;
            }

            mousePos.current.x += (mousePos.current.targetX - mousePos.current.x) * 0.06;
            mousePos.current.y += (mousePos.current.targetY - mousePos.current.y) * 0.06;

            const offsetX = (mousePos.current.x - 0.5) * 35;
            const offsetY = (mousePos.current.y - 0.5) * 35;

            ctx.clearRect(0, 0, width, height);

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                p.x += p.vx * p.z;
                p.y += p.vy * p.z;
                p.pulse += 0.02;

                if (p.x < 0) p.x = width;
                if (p.x > width) p.x = 0;
                if (p.y < 0) p.y = height;
                if (p.y > height) p.y = 0;

                const drawX = p.x + offsetX * p.z;
                const drawY = p.y + offsetY * p.z;
                const dynamicRadius = p.radius * p.z;
                const alpha = 0.28 * p.z;

                ctx.beginPath();
                ctx.arc(drawX, drawY, dynamicRadius, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${p.baseHue}, 85%, 55%, ${alpha})`;
                ctx.fill();

                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const p2DrawX = p2.x + offsetX * p2.z;
                    const p2DrawY = p2.y + offsetY * p2.z;
                    const dx = drawX - p2DrawX;
                    const dy = drawY - p2DrawY;
                    const distSq = dx * dx + dy * dy;

                    if (distSq < 5625) {
                        const lineAlpha = (1 - distSq / 5625) * 0.12 * p.z;
                        ctx.beginPath();
                        ctx.moveTo(drawX, drawY);
                        ctx.lineTo(p2DrawX, p2DrawY);
                        ctx.strokeStyle = `hsla(142, 80%, 60%, ${lineAlpha})`;
                        ctx.lineWidth = 0.75;
                        ctx.stroke();
                    }
                }
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-75 will-change-transform"
        />
    );
});

Interactive3DBackground.displayName = 'Interactive3DBackground';

// ============================================================================
// 2. MEMOIZED CHAT MESSAGE ITEM FOR HIGH FRAME RATES
// ============================================================================
const ChatMessageItem = React.memo(({
    msg,
    onOpenSources,
    onCopy,
    onPlayback,
    onRegenerate,
    onReaction,
    isPlaying,
    isCopied,
    reaction
}) => {
    return (
        <div className={`flex gap-3 items-end ${msg.isAI ? '' : 'flex-row-reverse'}`}>
            {msg.isAI && (
                <div className="w-8 h-8 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center self-end mb-1 text-primary shrink-0">
                    <span className="material-icons-round text-sm">smart_toy</span>
                </div>
            )}

            <div className={`flex flex-col gap-1 max-w-[88%] md:max-w-[78%] ${msg.isAI ? '' : 'items-end'}`}>
                <div className={`${
                    msg.isAI 
                        ? 'bg-[#0c2415]/90 border border-white/10 text-slate-100 rounded-3xl rounded-bl-sm shadow-xl backdrop-blur-md' 
                        : 'bg-gradient-to-r from-[#0ED054] to-[#0A9E3E] text-white rounded-3xl rounded-br-sm shadow-[0_4px_16px_rgba(14,208,84,0.3)] font-semibold'
                } p-4 md:p-5 relative transition-all`}>
                    
                    {msg.attachment && (
                        <div className="mb-3 p-2 rounded-2xl bg-black/30 border border-white/20 flex items-center gap-3">
                            {msg.attachment.previewUrl ? (
                                <img 
                                    src={msg.attachment.previewUrl} 
                                    alt="Sample" 
                                    className="w-14 h-14 object-cover rounded-xl border border-white/30"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                                    <span className="material-icons-round text-xl">description</span>
                                </div>
                            )}
                            <div className="overflow-hidden text-xs">
                                <p className="font-bold truncate text-white">{msg.attachment.name}</p>
                                <p className="text-[10px] text-white/75">{msg.attachment.sizeKb} KB • Uploaded for Diagnosis</p>
                            </div>
                        </div>
                    )}

                    <div>{renderAgronomicMarkdown(msg.text, msg.isAI)}</div>

                    {msg.isAI && (
                        <div className="mt-3.5 pt-2.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                                {msg.sources && msg.sources.length > 0 && (
                                    <button
                                        onClick={() => onOpenSources(msg.sources)}
                                        className="px-2.5 py-1 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                                        title="View multi-source verified intelligence"
                                    >
                                        <span className="material-icons-round text-xs">verified</span>
                                        <span>{msg.sources.length} Sources Analyzed</span>
                                    </button>
                                )}

                                <button
                                    onClick={() => onCopy(msg)}
                                    className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                                    title="Copy text"
                                >
                                    <span className="material-icons-round text-sm">
                                        {isCopied ? 'check' : 'content_copy'}
                                    </span>
                                    {isCopied && <span className="text-primary font-bold">Copied!</span>}
                                </button>

                                <button
                                    onClick={() => onPlayback(msg)}
                                    className={`p-1.5 rounded-xl transition-all cursor-pointer text-[11px] ${
                                        isPlaying
                                            ? 'bg-primary text-slate-900 font-bold animate-pulse'
                                            : 'bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white'
                                    }`}
                                    title={isPlaying ? 'Stop audio' : 'Listen audio'}
                                >
                                    <span className="material-icons-round text-sm">
                                        {isPlaying ? 'stop' : 'volume_up'}
                                    </span>
                                </button>

                                <button
                                    onClick={() => onRegenerate(msg.id)}
                                    className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors cursor-pointer"
                                    title="Regenerate"
                                >
                                    <span className="material-icons-round text-sm">refresh</span>
                                </button>
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => onReaction(msg.id, 'like')}
                                    className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                                        reaction === 'like'
                                            ? 'bg-emerald-500/25 text-emerald-400 border border-emerald-500/40'
                                            : 'bg-white/5 hover:bg-white/15 text-slate-400 hover:text-slate-200'
                                    }`}
                                    title="Like"
                                >
                                    <span className="material-icons-round text-sm">thumb_up</span>
                                </button>
                                <button
                                    onClick={() => onReaction(msg.id, 'dislike')}
                                    className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                                        reaction === 'dislike'
                                            ? 'bg-red-500/25 text-red-400 border border-red-500/40'
                                            : 'bg-white/5 hover:bg-white/15 text-slate-400 hover:text-slate-200'
                                    }`}
                                    title="Dislike"
                                >
                                    <span className="material-icons-round text-sm">thumb_down</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mx-1">
                    {msg.time}
                </span>
            </div>
        </div>
    );
});

ChatMessageItem.displayName = 'ChatMessageItem';

// ============================================================================
// 3. MAIN AI COPILOT CHATBOT CONTAINER
// ============================================================================
const AIAdvisoryChatbot = ({ onBack, selectedFarmId, userProfile, chatContext, clearContext }) => {
    const [sessionId, setSessionId] = useState(() => 'sess_' + Date.now().toString(36));
    const [savedSessions, setSavedSessions] = useState([]);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [farmData, setFarmData] = useState(null);

    // Attachments
    const [attachment, setAttachment] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    // Audio & Speech
    const [isListening, setIsListening] = useState(false);
    const [playingMessageId, setPlayingMessageId] = useState(null);

    // Citations & Reactions
    const [activeSourcesModal, setActiveSourcesModal] = useState(null);
    const [copiedMessageId, setCopiedMessageId] = useState(null);
    const [messageReactions, setMessageReactions] = useState({});
    const [reactionToast, setReactionToast] = useState('');

    // Refs
    const scrollRef = useRef(null);
    const recognitionRef = useRef(null);
    const hasProcessedContext = useRef(false);
    const latestInputRef = useRef('');
    const shouldAutoSendRef = useRef(false);

    // Load Sessions
    const loadSessions = useCallback(async () => {
        try {
            const { data } = await aiAPI.getSessions();
            if (data?.sessions && data.sessions.length > 0) {
                setSavedSessions(data.sessions);
                return;
            }
        } catch {
            // LocalStorage fallback
        }

        try {
            const local = localStorage.getItem('kisan_chat_sessions');
            if (local) setSavedSessions(JSON.parse(local));
        } catch {
            // Ignore
        }
    }, []);

    const persistCurrentSession = useCallback((newMessages, currentSessionId) => {
        if (!newMessages || newMessages.length === 0) return;
        const firstUserMsg = newMessages.find(m => !m.isAI);
        const title = firstUserMsg ? firstUserMsg.text.substring(0, 40) : 'Agricultural Advisory';
        
        setSavedSessions(prev => {
            const updated = [...prev];
            const idx = updated.findIndex(s => (s.sessionId === currentSessionId || s._id === currentSessionId));
            const now = new Date();
            const sessionData = {
                sessionId: currentSessionId,
                _id: currentSessionId,
                title,
                messages: newMessages,
                crop: farmData?.crop_type || 'General Farm',
                updatedAt: now.toISOString(),
                createdAt: idx !== -1 ? updated[idx].createdAt : now.toISOString()
            };

            if (idx !== -1) {
                updated[idx] = sessionData;
            } else {
                updated.unshift(sessionData);
            }

            try {
                localStorage.setItem('kisan_chat_sessions', JSON.stringify(updated.slice(0, 30)));
            } catch {
                // Ignore
            }

            return updated;
        });
    }, [farmData]);

    const handleSelectSession = useCallback((session) => {
        setSessionId(session.sessionId || session._id);
        setMessages(session.messages || []);
        setIsDrawerOpen(false);
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        setPlayingMessageId(null);
    }, []);

    const handleNewChat = useCallback(() => {
        const newId = 'sess_' + Date.now().toString(36);
        setSessionId(newId);
        setMessages([{
            id: 1,
            text: `Namaste${userProfile?.name ? `, ${userProfile.name.split(' ')[0]}` : ''}! I am your AI Farming Copilot. How can I assist you with crop diagnosis, soil health cards, mandi rates, or fertilizer schedules today?`,
            isAI: true,
            sources: [
                {
                    id: 'icar-welcome',
                    title: 'ICAR Package of Practices & Agronomy Standards',
                    org: 'Indian Council of Agricultural Research',
                    type: 'Official Research Standard',
                    detail: 'Field-tested agronomic practices, crop calendars, and integrated pest management.'
                }
            ],
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
        setAttachment(null);
        setIsDrawerOpen(false);
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        setPlayingMessageId(null);
    }, [userProfile]);

    const handleDeleteSession = useCallback(async (e, sid) => {
        e.stopPropagation();
        try {
            await aiAPI.deleteSession(sid);
        } catch {
            // Ignore
        }

        setSavedSessions(prev => {
            const filtered = prev.filter(s => (s.sessionId !== sid && s._id !== sid));
            try {
                localStorage.setItem('kisan_chat_sessions', JSON.stringify(filtered));
            } catch {
                // Ignore
            }
            return filtered;
        });

        if (sessionId === sid) {
            handleNewChat();
        }
    }, [sessionId, handleNewChat]);

    // Speech Output
    const togglePlayback = useCallback((msg) => {
        if (!('speechSynthesis' in window)) return;

        if (playingMessageId === msg.id) {
            window.speechSynthesis.cancel();
            setPlayingMessageId(null);
            return;
        }

        window.speechSynthesis.cancel();
        const textToRead = (msg.text || '').replace(/[*#_`~•]/g, '').trim();
        const utterance = new SpeechSynthesisUtterance(textToRead);
        
        const langMap = {
            'hi': 'hi-IN', 'mr': 'mr-IN', 'ta': 'ta-IN', 'te': 'te-IN',
            'en': 'en-IN', 'gu': 'gu-IN', 'bn': 'bn-IN', 'pa': 'pa-IN'
        };
        utterance.lang = langMap[userProfile?.preferred_language] || 'hi-IN';

        utterance.onstart = () => setPlayingMessageId(msg.id);
        utterance.onend = () => setPlayingMessageId(null);
        utterance.onerror = () => setPlayingMessageId(null);

        window.speechSynthesis.speak(utterance);
    }, [playingMessageId, userProfile]);

    // Message Actions
    const handleCopy = useCallback((msg) => {
        const cleanText = (msg.text || '').replace(/\*\*/g, '').trim();
        navigator.clipboard.writeText(cleanText).then(() => {
            setCopiedMessageId(msg.id);
            setTimeout(() => setCopiedMessageId(null), 2000);
        });
    }, []);

    const handleReaction = useCallback((msgId, type) => {
        setMessageReactions(prev => {
            const next = prev[msgId] === type ? null : type;
            setReactionToast(next === 'like' ? '👍 Thank you! Glad this helped.' : '👎 Feedback noted.');
            setTimeout(() => setReactionToast(''), 2000);
            return { ...prev, [msgId]: next };
        });
    }, []);

    // File Upload Handler
    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const fileName = file.name;
        const sizeKb = Math.round(file.size / 1024);
        const isImage = file.type.startsWith('image/');
        const isTextDoc = file.name.endsWith('.txt') || file.name.endsWith('.csv');

        const reader = new FileReader();
        if (isImage) {
            reader.onload = (event) => {
                setAttachment({
                    name: fileName,
                    type: 'image',
                    mimeType: file.type,
                    base64: event.target.result,
                    previewUrl: event.target.result,
                    sizeKb
                });
                setIsUploading(false);
            };
            reader.readAsDataURL(file);
        } else if (isTextDoc) {
            reader.onload = (event) => {
                setAttachment({
                    name: fileName,
                    type: 'document',
                    mimeType: file.type || 'text/plain',
                    textContent: event.target.result,
                    sizeKb
                });
                setIsUploading(false);
            };
            reader.readAsText(file);
        } else {
            reader.onload = (event) => {
                setAttachment({
                    name: fileName,
                    type: 'document',
                    mimeType: file.type || 'application/octet-stream',
                    base64: event.target.result,
                    textContent: `[Document: ${fileName} (${sizeKb} KB) attached for analysis]`,
                    sizeKb
                });
                setIsUploading(false);
            };
            reader.readAsDataURL(file);
        }

        e.target.value = '';
    };

    // Send Handler
    const handleSend = async () => {
        const text = (inputText.trim() ? inputText : latestInputRef.current).trim();
        if (!text && !attachment) return;

        if (window.speechSynthesis) window.speechSynthesis.cancel();
        setPlayingMessageId(null);

        const currentAttachment = attachment;
        setAttachment(null);

        const userMsg = {
            id: Date.now(),
            text: text || (currentAttachment ? `Analyzed file: ${currentAttachment.name}` : ''),
            isAI: false,
            attachment: currentAttachment ? {
                name: currentAttachment.name,
                type: currentAttachment.type,
                previewUrl: currentAttachment.previewUrl,
                sizeKb: currentAttachment.sizeKb
            } : null,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setInputText('');
        latestInputRef.current = '';
        setIsTyping(true);

        const messageHistory = updatedMessages.map(m => ({
            role: m.isAI ? 'assistant' : 'user',
            content: m.text
        }));

        const attachmentsPayload = currentAttachment ? [{
            name: currentAttachment.name,
            type: currentAttachment.type,
            mimeType: currentAttachment.mimeType,
            base64: currentAttachment.base64,
            textContent: currentAttachment.textContent
        }] : [];

        try {
            const { data } = await aiAPI.chat(
                messageHistory,
                selectedFarmId,
                userProfile?.preferred_language || 'en',
                userProfile?.personalization_mode || 'farmer',
                attachmentsPayload,
                sessionId
            );

            const aiMsg = {
                id: Date.now() + 1,
                text: data.response,
                isAI: true,
                sources: data.sources || [],
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            setMessages(prev => {
                const finalMessages = [...prev, aiMsg];
                persistCurrentSession(finalMessages, sessionId);
                return finalMessages;
            });
        } catch (error) {
            console.error('AI Chat Error:', error);
            const msgText = error.response?.data?.message || "I am having trouble connecting right now. Please check your network and try again.";
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                text: msgText,
                isAI: true,
                sources: [],
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleRegenerate = useCallback(async (lastAIMsgId) => {
        const msgIdx = messages.findIndex(m => m.id === lastAIMsgId);
        if (msgIdx <= 0) return;

        const subHistory = messages.slice(0, msgIdx);
        setMessages(subHistory);
        setIsTyping(true);

        const messageHistory = subHistory.map(m => ({
            role: m.isAI ? 'assistant' : 'user',
            content: m.text
        }));

        try {
            const { data } = await aiAPI.chat(
                messageHistory,
                selectedFarmId,
                userProfile?.preferred_language || 'en',
                userProfile?.personalization_mode || 'farmer',
                [],
                sessionId
            );

            const aiMsg = {
                id: Date.now() + 1,
                text: data.response,
                isAI: true,
                sources: data.sources || [],
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            setMessages(prev => {
                const updated = [...prev, aiMsg];
                persistCurrentSession(updated, sessionId);
                return updated;
            });
        } catch (err) {
            console.error('Regenerate error:', err);
        } finally {
            setIsTyping(false);
        }
    }, [messages, selectedFarmId, userProfile, sessionId, persistCurrentSession]);

    // Initial context load
    useEffect(() => {
        loadSessions();

        const loadContext = async () => {
            if (selectedFarmId) {
                try {
                    const { data } = await farmAPI.getFarmById(selectedFarmId);
                    setFarmData(data.farm);
                    setMessages([{
                        id: 1,
                        text: `Namaste${userProfile?.name ? `, ${userProfile.name.split(' ')[0]}` : ''}! I have loaded your **${data.farm.crop_type || 'Crop'}** farm data${data.farm.state ? ` from **${data.farm.state}**` : ''}. You can ask questions, upload lab test reports, or share crop photos for instant analysis.`,
                        isAI: true,
                        sources: [
                            {
                                id: 'icar-farm',
                                title: 'ICAR Package of Practices for ' + (data.farm.crop_type || 'Crops'),
                                org: 'Indian Council of Agricultural Research (ICAR)',
                                type: 'Agronomic Research Benchmark',
                                detail: 'Verified agronomic schedules, soil-water-crop relations, and IPM guidelines.'
                            }
                        ],
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }]);
                } catch {
                    setMessages([{
                        id: 1,
                        text: "Namaste! I am your AI Farming Copilot. How can I help you with crops, lab soil tests, or mandi rates today?",
                        isAI: true,
                        sources: [],
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }]);
                }
            } else {
                setMessages([{
                    id: 1,
                    text: "Namaste! I am your AI Farming Copilot. Please feel free to ask any agriculture question, upload a Soil Health Card report, or attach a leaf photo for pathology diagnosis.",
                    isAI: true,
                    sources: [],
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }]);
            }
        };

        loadContext();
    }, [selectedFarmId, userProfile, loadSessions]);

    // Handle Incoming Scan Context
    useEffect(() => {
        if (chatContext?.type === 'crop_scan' && chatContext.data && farmData && !hasProcessedContext.current) {
            hasProcessedContext.current = true;
            const timer = setTimeout(() => {
                const scan = chatContext.data;
                const indicators = scan.indicators?.length > 0 ? scan.indicators.join(', ') : 'None';
                const assessment = scan.analysis?.overall_assessment || scan.analysis?.raw_analysis || 'Unknown issue';

                const autoPrompt = `I just scanned my ${farmData.crop_type || 'crop'}. Diagnostic assessment: "${assessment}". Primary indicators: ${indicators}. Please give me a step-by-step treatment protocol and chemical/organic dosages per acre.`;

                setInputText(autoPrompt);
                setTimeout(() => {
                    document.getElementById('send-btn')?.click();
                }, 50);

                if (clearContext) clearContext();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [chatContext, farmData, clearContext]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (window.speechSynthesis) window.speechSynthesis.cancel();
        };
    }, []);

    // Speech Recognition
    const toggleListening = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert("Voice input is not supported in your browser.");
            return;
        }

        if (!recognitionRef.current) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;

            const langMap = {
                'hi': 'hi-IN', 'mr': 'mr-IN', 'ta': 'ta-IN', 'te': 'te-IN',
                'en': 'en-IN', 'gu': 'gu-IN', 'bn': 'bn-IN', 'pa': 'pa-IN'
            };
            recognition.lang = langMap[userProfile?.preferred_language] || 'hi-IN';

            recognition.onstart = () => setIsListening(true);
            recognition.onresult = (event) => {
                let transcript = '';
                for (let i = 0; i < event.results.length; i++) {
                    transcript += event.results[i][0].transcript;
                }
                setInputText(transcript);
                latestInputRef.current = transcript;
            };
            recognition.onerror = () => setIsListening(false);
            recognition.onend = () => setIsListening(false);

            recognitionRef.current = recognition;
        }

        if (isListening) {
            recognitionRef.current.stop();
        } else {
            shouldAutoSendRef.current = true;
            recognitionRef.current.start();
        }
    };

    useEffect(() => {
        if (!isListening && shouldAutoSendRef.current && latestInputRef.current.trim()) {
            shouldAutoSendRef.current = false;
            setInputText(latestInputRef.current);
            setTimeout(() => {
                document.getElementById('send-btn')?.click();
            }, 50);
        }
    }, [isListening]);

    return (
        <div className="relative w-full h-screen bg-[#07130c] text-slate-100 font-display antialiased flex flex-col overflow-hidden selection:bg-primary/30">
            {/* 1. Hardware-Accelerated 3D Reactive Ambient Canvas */}
            <Interactive3DBackground />

            {/* 2. Side Drawer (3-Lines Hamburger Menu) */}
            {isDrawerOpen && (
                <div className="fixed inset-0 z-50 flex">
                    <div 
                        onClick={() => setIsDrawerOpen(false)}
                        className="fixed inset-0 bg-black/75 backdrop-blur-sm animate-fade-in"
                    />

                    <div className="relative w-80 max-w-[85vw] h-full bg-[#0c1f14]/95 border-r border-white/10 p-5 flex flex-col shadow-2xl z-10 backdrop-blur-xl animate-slide-in-left">
                        <div className="flex items-center justify-between pb-4 border-b border-white/10">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center border border-primary/30">
                                    <span className="material-icons-round text-lg">history_edu</span>
                                </div>
                                <h3 className="font-bold text-sm text-white">Chat Memory</h3>
                            </div>
                            <button
                                onClick={() => setIsDrawerOpen(false)}
                                className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                            >
                                <span className="material-icons-round text-lg">close</span>
                            </button>
                        </div>

                        <button
                            onClick={handleNewChat}
                            className="mt-4 w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#0ED054] to-[#0A9E3E] text-white font-bold text-xs shadow-lg shadow-primary/25 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                        >
                            <span className="material-icons-round text-base">add</span>
                            <span>Start New Conversation</span>
                        </button>

                        {farmData && (
                            <div className="mt-4 p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                                    <span className="material-icons-round text-lg">agriculture</span>
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-[11px] font-extrabold text-emerald-400 uppercase tracking-wider">Active Farm Context</p>
                                    <p className="text-xs font-bold text-white truncate">{farmData.farm_name || 'My Farm'} • {farmData.crop_type || 'Crop'}</p>
                                    <p className="text-[10px] text-slate-400 truncate">{farmData.district || farmData.state || 'India'}</p>
                                </div>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto no-scrollbar my-4 space-y-2 pr-0.5">
                            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-1">Past Conversations</p>
                            {savedSessions.length === 0 ? (
                                <div className="text-center py-8 text-slate-500 text-xs">
                                    No previous conversations yet. Start asking questions!
                                </div>
                            ) : (
                                savedSessions.map((s) => {
                                    const isCurrent = (s.sessionId === sessionId || s._id === sessionId);
                                    return (
                                        <div
                                            key={s.sessionId || s._id}
                                            onClick={() => handleSelectSession(s)}
                                            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                                                isCurrent 
                                                    ? 'bg-primary/20 border-primary/50 text-white shadow-[0_0_15px_rgba(19,236,19,0.15)]' 
                                                    : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10 hover:border-white/20'
                                            }`}
                                        >
                                            <div className="overflow-hidden pr-2 flex-1">
                                                <p className="text-xs font-bold truncate">{s.title || 'Agricultural Advisory'}</p>
                                                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                                                    <span>{s.crop || 'Farm'}</span>
                                                    <span>•</span>
                                                    <span>{new Date(s.updatedAt || s.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => handleDeleteSession(e, s.sessionId || s._id)}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all cursor-pointer"
                                                title="Delete conversation"
                                            >
                                                <span className="material-icons-round text-sm">delete_outline</span>
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div className="pt-3 border-t border-white/10 text-[10px] text-slate-400 text-center">
                            Grounded in ICAR, CIBRC, IMD & Agmarknet standards
                        </div>
                    </div>
                </div>
            )}

            {/* 3. Multi-Source Intelligence Modal */}
            {activeSourcesModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
                    <div className="bg-[#0c1f14] border border-white/15 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative max-h-[88vh] flex flex-col">
                        <div className="flex items-center justify-between pb-3 border-b border-white/10">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                                    <span className="material-icons-round text-xl">verified</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-base text-white">Multi-Source Intelligence</h3>
                                    <p className="text-[11px] text-emerald-400 font-semibold">6 Authoritative Agricultural Pillars Synthesized</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setActiveSourcesModal(null)}
                                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                            >
                                <span className="material-icons-round text-lg">close</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 my-4 pr-1">
                            {activeSourcesModal.map((src, i) => (
                                <div key={i} className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-all space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <h5 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                            <span>{src.title}</span>
                                        </h5>
                                        <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                            {src.type || 'Official'}
                                        </span>
                                    </div>
                                    <p className="text-[11px] font-semibold text-slate-200">{src.org}</p>
                                    <p className="text-[11px] text-slate-400 leading-relaxed bg-black/20 p-2 rounded-xl">{src.detail}</p>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => setActiveSourcesModal(null)}
                            className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 text-xs font-extrabold transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
                        >
                            Done Reviewing Sources
                        </button>
                    </div>
                </div>
            )}

            {/* Reaction Toast */}
            {reactionToast && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#0c2e17] border border-primary/40 text-emerald-300 px-4 py-2 rounded-2xl shadow-xl text-xs font-bold animate-bounce-short backdrop-blur-lg">
                    {reactionToast}
                </div>
            )}

            {/* 4. Top Navigation Bar */}
            <header className="sticky top-0 z-20 px-4 pt-12 pb-3.5 bg-[#07130c]/85 border-b border-white/10 backdrop-blur-xl shadow-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsDrawerOpen(true)}
                            className="p-2 -ml-2 rounded-2xl hover:bg-white/10 text-white transition-colors cursor-pointer relative"
                            title="Open Chat Memory"
                        >
                            <span className="material-icons-round text-2xl">menu</span>
                            {savedSessions.length > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary animate-ping"></span>
                            )}
                        </button>

                        <button
                            onClick={onBack}
                            className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                            title="Back"
                        >
                            <span className="material-icons-round text-lg">arrow_back</span>
                        </button>

                        <div className="flex items-center gap-2.5">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary/30 to-emerald-500/10 border border-primary/30 flex items-center justify-center text-primary shadow-lg shadow-primary/20">
                                    <span className="material-icons-round text-xl">smart_toy</span>
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-primary border-2 border-[#07130c] rounded-full"></div>
                            </div>
                            <div>
                                <h1 className="font-bold text-sm md:text-base text-white leading-tight flex items-center gap-1.5">
                                    <span>Kisan Copilot</span>
                                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">Ultra-Fast Pro</span>
                                </h1>
                                <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                                    <span>{farmData ? `${farmData.crop_type || 'Farm'} • ICAR + CIBRC + IMD` : 'Online • Instant Multi-Source'}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleNewChat}
                        className="p-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs font-bold flex items-center gap-1"
                        title="New Chat"
                    >
                        <span className="material-icons-round text-base text-primary">add</span>
                        <span className="hidden sm:inline">New</span>
                    </button>
                </div>
            </header>

            {/* 5. Main Chat Messages List */}
            <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 pb-44 space-y-5 scroll-smooth no-scrollbar relative z-10">
                {messages.map((msg) => (
                    <ChatMessageItem
                        key={msg.id}
                        msg={msg}
                        onOpenSources={setActiveSourcesModal}
                        onCopy={handleCopy}
                        onPlayback={togglePlayback}
                        onRegenerate={handleRegenerate}
                        onReaction={handleReaction}
                        isPlaying={playingMessageId === msg.id}
                        isCopied={copiedMessageId === msg.id}
                        reaction={messageReactions[msg.id]}
                    />
                ))}

                {isTyping && (
                    <div className="flex gap-3 items-center ml-11 animate-fade-in">
                        <div className="flex items-center gap-2.5 bg-[#0c2415]/90 border border-primary/30 py-2.5 px-4 rounded-2xl shadow-lg backdrop-blur-md">
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.15s]"></div>
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.3s]"></div>
                            <span className="text-xs font-extrabold text-emerald-300 ml-1">Cross-referencing ICAR, CIBRC, IMD & Agmarknet...</span>
                        </div>
                    </div>
                )}
            </main>

            {/* 6. Quick Real-World Agricultural Question Chips */}
            <div className="fixed bottom-24 left-0 w-full px-4 overflow-x-auto no-scrollbar flex space-x-2 z-20 pointer-events-auto">
                {[
                    '🧪 Analyze Soil Health Card & NPK',
                    '🌾 Today\'s Mandi Bhav & Selling Plan',
                    '🐛 Leaf Rust / Blast chemical dose',
                    '💧 Weather risk & spray window',
                    '💰 Govt Subsidies & Schemes'
                ].map((q) => (
                    <button
                        key={q}
                        onClick={() => {
                            setInputText(q);
                            setTimeout(() => {
                                document.getElementById('send-btn')?.click();
                            }, 50);
                        }}
                        className="px-3.5 py-2 rounded-2xl bg-[#0c2415]/90 border border-white/10 hover:border-primary text-xs font-bold text-slate-200 hover:text-primary whitespace-nowrap shadow-lg backdrop-blur-md active:scale-95 transition-all cursor-pointer"
                    >
                        {q}
                    </button>
                ))}
            </div>

            {/* 7. Bottom Input Bar */}
            <div className="fixed bottom-0 left-0 w-full bg-[#07130c]/90 border-t border-white/10 pb-6 pt-2.5 z-30 shadow-[0_-12px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
                {attachment && (
                    <div className="max-w-md mx-auto px-4 mb-2">
                        <div className="p-2.5 rounded-2xl bg-[#0e2a18] border border-primary/40 flex items-center justify-between gap-3 shadow-lg animate-fade-in">
                            <div className="flex items-center gap-2.5 overflow-hidden">
                                {attachment.previewUrl ? (
                                    <img 
                                        src={attachment.previewUrl} 
                                        alt="Preview" 
                                        className="w-10 h-10 object-cover rounded-xl border border-primary/30 shrink-0" 
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                                        <span className="material-icons-round text-xl">description</span>
                                    </div>
                                )}
                                <div className="overflow-hidden">
                                    <p className="text-xs font-bold text-white truncate">{attachment.name}</p>
                                    <p className="text-[10px] text-emerald-400 font-semibold">{attachment.sizeKb} KB • Multi-Source Lab & Image Analysis Ready</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setAttachment(null)}
                                className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                                title="Remove file"
                            >
                                <span className="material-icons-round text-base">close</span>
                            </button>
                        </div>
                    </div>
                )}

                <div className="max-w-md mx-auto px-4 flex items-end gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.txt,.csv"
                        className="hidden"
                    />

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading || isTyping}
                        className="flex-shrink-0 w-11 h-11 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-primary transition-all flex items-center justify-center cursor-pointer active:scale-95 disabled:opacity-50"
                        title="Upload Crop Photo, Lab Soil Report, Word/PDF Document, or Text File"
                    >
                        <span className="material-icons-round text-xl">
                            {isUploading ? 'sync' : 'attach_file'}
                        </span>
                    </button>

                    <div className={`flex-1 rounded-2xl px-3.5 py-2.5 flex items-center gap-2 border transition-all duration-200 ${
                        isListening 
                            ? 'border-red-500/50 ring-2 ring-red-500/20 bg-red-950/20' 
                            : 'bg-white/5 border-white/10 focus-within:border-primary/60 focus-within:bg-white/10'
                    }`}>
                        <textarea
                            className="w-full bg-transparent border-none p-0 text-sm text-white placeholder-slate-400 focus:outline-none resize-none max-h-24 font-normal"
                            placeholder={
                                isListening 
                                    ? 'Listening to speech...' 
                                    : attachment 
                                        ? 'Add instructions for analyzing this file...' 
                                        : (farmData ? `Ask about ${farmData.crop_type || 'crop'}, upload lab test, or crop photo...` : 'Ask anything or upload lab/crop file...')
                            }
                            rows="1"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                        />

                        <button
                            onClick={toggleListening}
                            className={`flex-shrink-0 p-1.5 rounded-full transition-colors cursor-pointer ${
                                isListening ? 'text-red-400 bg-red-500/20 animate-pulse' : 'text-slate-400 hover:text-white'
                            }`}
                            title={isListening ? 'Stop listening' : 'Voice search'}
                        >
                            <span className="material-icons-round text-xl">
                                {isListening ? 'mic' : 'mic_none'}
                            </span>
                        </button>
                    </div>

                    <button
                        id="send-btn"
                        onClick={handleSend}
                        disabled={(!inputText.trim() && !latestInputRef.current.trim() && !attachment) || isTyping}
                        className="flex-shrink-0 w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#0ED054] to-[#0A9E3E] text-white shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:scale-100 cursor-pointer"
                        title="Send Message"
                    >
                        <span className="material-icons-round text-xl translate-x-0.5">send</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIAdvisoryChatbot;
