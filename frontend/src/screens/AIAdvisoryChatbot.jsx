import React, { useState, useEffect, useRef, useCallback } from 'react';
import { aiAPI, farmAPI } from '../api';

// ============================================================================
// 1. REACTIVE 3D AMBIENT CANVAS BACKGROUND COMPONENT
// ============================================================================
const Interactive3DBackground = () => {
    const canvasRef = useRef(null);
    const mousePos = useRef({ x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        let width = (canvas.width = canvas.offsetWidth);
        let height = (canvas.height = canvas.offsetHeight);

        const handleResize = () => {
            if (!canvas) return;
            width = canvas.width = canvas.offsetWidth;
            height = canvas.height = canvas.offsetHeight;
        };
        window.addEventListener('resize', handleResize);

        const handleMouseMove = (e) => {
            const rect = canvas.getBoundingClientRect();
            mousePos.current.targetX = (e.clientX - rect.left) / width;
            mousePos.current.targetY = (e.clientY - rect.top) / height;
        };
        window.addEventListener('mousemove', handleMouseMove);

        // Generate 42 3D spatial particles with depth (z)
        const particleCount = 42;
        const particles = Array.from({ length: particleCount }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            z: Math.random() * 0.8 + 0.2, // Depth factor
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            radius: Math.random() * 2.5 + 1.2,
            baseHue: Math.random() > 0.2 ? 142 : 45, // 142 = Chlorophyll Green, 45 = Golden Amber
            pulse: Math.random() * Math.PI * 2
        }));

        const render = () => {
            // Smooth mouse interpolation
            mousePos.current.x += (mousePos.current.targetX - mousePos.current.x) * 0.05;
            mousePos.current.y += (mousePos.current.targetY - mousePos.current.y) * 0.05;

            const offsetX = (mousePos.current.x - 0.5) * 40;
            const offsetY = (mousePos.current.y - 0.5) * 40;

            ctx.clearRect(0, 0, width, height);

            // Subtle ambient energy gradient
            const ambientGrad = ctx.createRadialGradient(
                width * mousePos.current.x,
                height * mousePos.current.y,
                10,
                width * mousePos.current.x,
                height * mousePos.current.y,
                width * 0.65
            );
            ambientGrad.addColorStop(0, 'rgba(19, 236, 19, 0.06)');
            ambientGrad.addColorStop(0.5, 'rgba(14, 208, 84, 0.02)');
            ambientGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = ambientGrad;
            ctx.fillRect(0, 0, width, height);

            // Update and draw particles
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                p.x += p.vx * p.z;
                p.y += p.vy * p.z;
                p.pulse += 0.025;

                // Boundary wrapping
                if (p.x < 0) p.x = width;
                if (p.x > width) p.x = 0;
                if (p.y < 0) p.y = height;
                if (p.y > height) p.y = 0;

                // 3D Parallax coordinates
                const drawX = p.x + offsetX * p.z;
                const drawY = p.y + offsetY * p.z;
                const dynamicRadius = p.radius * p.z * (1 + Math.sin(p.pulse) * 0.25);
                const alpha = (0.25 + Math.sin(p.pulse) * 0.15) * p.z;

                ctx.beginPath();
                ctx.arc(drawX, drawY, dynamicRadius, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${p.baseHue}, 85%, 55%, ${alpha})`;
                ctx.fill();

                // Draw proximity geometric links
                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const p2DrawX = p2.x + offsetX * p2.z;
                    const p2DrawY = p2.y + offsetY * p2.z;
                    const dist = Math.hypot(drawX - p2DrawX, drawY - p2DrawY);

                    if (dist < 85) {
                        const lineAlpha = (1 - dist / 85) * 0.12 * Math.min(p.z, p2.z);
                        ctx.beginPath();
                        ctx.moveTo(drawX, drawY);
                        ctx.lineTo(p2DrawX, p2DrawY);
                        ctx.strokeStyle = `hsla(142, 80%, 60%, ${lineAlpha})`;
                        ctx.lineWidth = 0.8;
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
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-80"
        />
    );
};

// ============================================================================
// 2. MAIN AI ADVISORY CHATBOT COMPONENT
// ============================================================================
const AIAdvisoryChatbot = ({ onBack, selectedFarmId, userProfile, chatContext, clearContext }) => {
    // Session & Message State
    const [sessionId, setSessionId] = useState(() => 'sess_' + Date.now().toString(36));
    const [savedSessions, setSavedSessions] = useState([]);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [farmData, setFarmData] = useState(null);

    // Multimodal Attachment State
    const [attachment, setAttachment] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    // Speech & Audio State
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [playingMessageId, setPlayingMessageId] = useState(null);

    // Citations / Sources Modal State
    const [activeSourcesModal, setActiveSourcesModal] = useState(null);
    const [copiedMessageId, setCopiedMessageId] = useState(null);
    const [messageReactions, setMessageReactions] = useState({});
    const [reactionToast, setReactionToast] = useState('');

    // Refs
    const scrollRef = useRef(null);
    const recognitionRef = useRef(null);
    const hasProcessedContext = useRef(false);
    const initialTextRef = useRef('');
    const ignoreResultRef = useRef(false);
    const latestInputRef = useRef('');
    const shouldAutoSendRef = useRef(false);
    const autoSpeakNext = useRef(false);

    // ------------------------------------------------------------------------
    // Session Memory Management (Local + Backend sync)
    // ------------------------------------------------------------------------
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
            if (local) {
                setSavedSessions(JSON.parse(local));
            }
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

    const handleSelectSession = (session) => {
        setSessionId(session.sessionId || session._id);
        setMessages(session.messages || []);
        setIsDrawerOpen(false);
        stopSpeaking();
    };

    const handleNewChat = () => {
        const newId = 'sess_' + Date.now().toString(36);
        setSessionId(newId);
        setMessages([{
            id: 1,
            text: `Namaste${userProfile?.name ? `, ${userProfile.name.split(' ')[0]}` : ''}! I am your AI Farming Copilot. How can I help you with crop health, lab reports, mandi prices, or fertilizer plans today?`,
            isAI: true,
            sources: [
                {
                    id: 'icar-welcome',
                    title: 'ICAR Package of Practices & Agronomy Guidelines',
                    org: 'Indian Council of Agricultural Research',
                    type: 'Official Research Standard',
                    detail: 'Field-tested agronomic practices, crop calendars, and integrated management.'
                }
            ],
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
        setAttachment(null);
        setIsDrawerOpen(false);
        stopSpeaking();
    };

    const handleDeleteSession = async (e, sid) => {
        e.stopPropagation();
        try {
            await aiAPI.deleteSession(sid);
        } catch {
            // Ignore backend error and delete locally
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
    };

    // ------------------------------------------------------------------------
    // Speech Synthesis (Audio Output)
    // ------------------------------------------------------------------------
    const stopSpeaking = () => {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            setPlayingMessageId(null);
        }
    };

    const togglePlayback = (msg) => {
        if (isSpeaking && playingMessageId === msg.id) {
            stopSpeaking();
            return;
        }

        stopSpeaking();
        if (!('speechSynthesis' in window)) return;

        const textToRead = msg.text
            .replace(/[*#_`~]/g, '')
            .replace(/•/g, '')
            .replace(/https?:\/\/\S+/g, '')
            .trim();

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

    // ------------------------------------------------------------------------
    // Message Interactions: Copy, Reactions, Sources
    // ------------------------------------------------------------------------
    const handleCopy = (msg) => {
        const cleanText = msg.text.replace(/\*\*/g, '').trim();
        navigator.clipboard.writeText(cleanText).then(() => {
            setCopiedMessageId(msg.id);
            setTimeout(() => setCopiedMessageId(null), 2000);
        });
    };

    const handleReaction = (msgId, type) => {
        setMessageReactions(prev => {
            const current = prev[msgId];
            const next = current === type ? null : type;
            if (next === 'like') {
                setReactionToast('👍 Thank you! Glad this recommendation was helpful.');
            } else if (next === 'dislike') {
                setReactionToast('👎 Feedback noted. We will refine future advisory accuracy.');
            }
            setTimeout(() => setReactionToast(''), 2500);
            return { ...prev, [msgId]: next };
        });
    };

    // ------------------------------------------------------------------------
    // Multimodal Attachment File Handler
    // ------------------------------------------------------------------------
    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const fileName = file.name;
        const sizeKb = Math.round(file.size / 1024);
        const isImage = file.type.startsWith('image/');
        const isTextDoc = file.name.endsWith('.txt') || file.name.endsWith('.csv') || file.name.endsWith('.json');

        if (isImage) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target.result;
                setAttachment({
                    file,
                    name: fileName,
                    type: 'image',
                    mimeType: file.type,
                    base64,
                    previewUrl: base64,
                    sizeKb
                });
                setIsUploading(false);
            };
            reader.readAsDataURL(file);
        } else if (isTextDoc) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const textContent = event.target.result;
                setAttachment({
                    file,
                    name: fileName,
                    type: 'document',
                    mimeType: file.type || 'text/plain',
                    textContent,
                    sizeKb
                });
                setIsUploading(false);
            };
            reader.readAsText(file);
        } else {
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target.result;
                setAttachment({
                    file,
                    name: fileName,
                    type: 'document',
                    mimeType: file.type || 'application/octet-stream',
                    base64,
                    textContent: `[Document File: ${fileName} (${sizeKb} KB) attached for analysis]`,
                    sizeKb
                });
                setIsUploading(false);
            };
            reader.readAsDataURL(file);
        }

        e.target.value = '';
    };

    const removeAttachment = () => {
        setAttachment(null);
    };

    // ------------------------------------------------------------------------
    // Chat Dispatch & Multi-Turn AI Call
    // ------------------------------------------------------------------------
    const processAutoMessage = useCallback(async (history) => {
        setIsTyping(true);
        const messageHistory = history.map(m => ({
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
        } catch (error) {
            console.error('Auto message error:', error);
            const errorMsg = {
                id: Date.now() + 1,
                text: "I couldn't process the scan advisory right now. Please ask your question below.",
                isAI: true,
                sources: [],
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    }, [selectedFarmId, userProfile, sessionId, persistCurrentSession]);

    // Initial Load & Farm Context
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
                } catch (e) {
                    console.error('Failed to load farm data:', e);
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

    // Handle Incoming External Scan Context
    useEffect(() => {
        if (chatContext?.type === 'crop_scan' && chatContext.data && farmData && !hasProcessedContext.current) {
            hasProcessedContext.current = true;
            const timer = setTimeout(() => {
                const scan = chatContext.data;
                const indicators = scan.indicators?.length > 0 ? scan.indicators.join(', ') : 'None';
                const assessment = scan.analysis?.overall_assessment || scan.analysis?.raw_analysis || 'Unknown issue';

                const autoPrompt = `I just scanned my ${farmData.crop_type || 'crop'} with the computer vision tool. Diagnostic assessment: "${assessment}". Primary observed indicators: ${indicators}. Please give me a step-by-step treatment protocol and chemical/organic dosages per acre.`;

                const userMsg = {
                    id: Date.now(),
                    text: autoPrompt,
                    isAI: false,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };

                setMessages(prev => {
                    const newMessages = [...prev, userMsg];
                    processAutoMessage(newMessages);
                    return newMessages;
                });

                if (clearContext) clearContext();
            }, 700);
            return () => clearTimeout(timer);
        }
    }, [chatContext, farmData, clearContext, processAutoMessage]);

    // Auto-scroll on new message
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    // Cleanup speech on unmount
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
            recognition.onend = () => setIsListening(false);

            recognitionRef.current = recognition;
        }

        if (isListening) {
            recognitionRef.current.stop();
        } else {
            ignoreResultRef.current = false;
            shouldAutoSendRef.current = true;
            initialTextRef.current = inputText;
            latestInputRef.current = inputText;
            recognitionRef.current.start();
        }
    };

    // Auto-send after voice pause
    useEffect(() => {
        if (!isListening && shouldAutoSendRef.current && latestInputRef.current.trim()) {
            shouldAutoSendRef.current = false;
            autoSpeakNext.current = true;
            setInputText(latestInputRef.current);
            setTimeout(() => {
                document.getElementById('send-btn')?.click();
            }, 50);
        }
    }, [isListening]);

    // Send Message Handler
    const handleSend = async () => {
        const text = (inputText.trim() ? inputText : latestInputRef.current).trim();
        if (!text && !attachment) return;

        if (isListening && recognitionRef.current) {
            ignoreResultRef.current = true;
            shouldAutoSendRef.current = false;
            recognitionRef.current.stop();
            setIsListening(false);
            autoSpeakNext.current = true;
        } else {
            autoSpeakNext.current = false;
        }

        stopSpeaking();

        const currentAttachment = attachment;
        setAttachment(null);

        const userMsg = {
            id: Date.now(),
            text: text || (currentAttachment ? `Analyzed attachment: ${currentAttachment.name}` : ''),
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

            if (autoSpeakNext.current) {
                autoSpeakNext.current = false;
                setTimeout(() => togglePlayback(aiMsg), 200);
            }
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

    // Regenerate Response
    const handleRegenerate = async (lastAIMsgId) => {
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
    };

    // ------------------------------------------------------------------------
    // Rich Markdown Formatter for Agricultural Advisory
    // ------------------------------------------------------------------------
    const renderFormattedAIText = (text) => {
        if (!text) return null;
        const lines = text.split('\n');

        return lines.map((line, idx) => {
            const trimmed = line.trim();

            if (trimmed.startsWith('###') || (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length < 50)) {
                const headerText = trimmed.replace(/^###\s*/, '').replace(/\*\*/g, '');
                return (
                    <div key={idx} className="mt-4 mb-2 flex items-center gap-2 border-b border-primary/20 pb-1">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                        <h4 className="font-bold text-base text-slate-900 dark:text-emerald-300 tracking-tight">{headerText}</h4>
                    </div>
                );
            }

            if (trimmed.toLowerCase().includes('caution') || trimmed.toLowerCase().includes('safety') || trimmed.toLowerCase().includes('warning') || trimmed.toLowerCase().includes('phi:')) {
                return (
                    <div key={idx} className="my-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
                        <span className="material-icons-round text-amber-500 text-sm shrink-0 mt-0.5">gpp_maybe</span>
                        <span>{trimmed.replace(/\*\*/g, '')}</span>
                    </div>
                );
            }

            if (/^\d+\./.test(trimmed)) {
                const parts = trimmed.split(/^(?:\d+\.)\s*/);
                const stepNum = trimmed.match(/^(\d+)\./)?.[1] || '•';
                const content = parts[1] || trimmed;
                return (
                    <div key={idx} className="flex items-start gap-2.5 my-1.5 ml-1 text-sm">
                        <span className="w-5 h-5 rounded-full bg-primary/20 text-primary dark:text-emerald-400 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                            {stepNum}
                        </span>
                        <div className="flex-1 leading-relaxed text-slate-800 dark:text-slate-200">
                            {renderBoldSegments(content)}
                        </div>
                    </div>
                );
            }

            if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
                const content = trimmed.substring(2);
                return (
                    <div key={idx} className="flex items-start gap-2 my-1 ml-2 text-sm text-slate-800 dark:text-slate-200">
                        <span className="text-primary font-bold text-sm shrink-0 mt-0.5">•</span>
                        <div className="flex-1 leading-relaxed">{renderBoldSegments(content)}</div>
                    </div>
                );
            }

            if (!trimmed) {
                return <div key={idx} className="h-2" />;
            }

            return (
                <p key={idx} className="text-sm leading-relaxed text-slate-800 dark:text-slate-200 my-1">
                    {renderBoldSegments(line)}
                </p>
            );
        });
    };

    const renderBoldSegments = (str) => {
        if (!str.includes('**')) return str;
        const parts = str.split('**');
        return parts.map((part, i) =>
            i % 2 === 1 ? (
                <strong key={i} className="font-bold text-slate-900 dark:text-white bg-primary/10 dark:bg-primary/20 px-1 py-0.5 rounded">
                    {part}
                </strong>
            ) : part
        );
    };

    return (
        <div className="relative w-full h-screen bg-[#07130c] text-slate-100 font-display antialiased flex flex-col overflow-hidden selection:bg-primary/30">
            {/* 1. 3D Reactive Ambient Canvas */}
            <Interactive3DBackground />

            {/* 2. Chat History Side Drawer (3-Lines Hamburger Menu) */}
            {isDrawerOpen && (
                <div className="fixed inset-0 z-50 flex">
                    {/* Backdrop */}
                    <div 
                        onClick={() => setIsDrawerOpen(false)}
                        className="fixed inset-0 bg-black/75 backdrop-blur-sm animate-fade-in"
                    />

                    {/* Drawer Panel */}
                    <div className="relative w-80 max-w-[85vw] h-full bg-[#0c1f14]/95 border-r border-white/10 p-5 flex flex-col shadow-2xl z-10 backdrop-blur-xl animate-slide-in-left">
                        {/* Drawer Header */}
                        <div className="flex items-center justify-between pb-4 border-b border-white/10">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center border border-primary/30">
                                    <span className="material-icons-round text-lg">history_edu</span>
                                </div>
                                <h3 className="font-bold text-sm text-white">Chat Memory</h3>
                            </div>
                            <button
                                onClick={() => setIsDrawerOpen(false)}
                                className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                            >
                                <span className="material-icons-round text-lg">close</span>
                            </button>
                        </div>

                        {/* New Chat Button */}
                        <button
                            onClick={handleNewChat}
                            className="mt-4 w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#0ED054] to-[#0A9E3E] text-white font-bold text-xs shadow-lg shadow-primary/25 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                        >
                            <span className="material-icons-round text-base">add</span>
                            <span>Start New Conversation</span>
                        </button>

                        {/* Current Active Farm Context Badge */}
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

                        {/* Saved Session Threads List */}
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
                                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all"
                                                title="Delete conversation"
                                            >
                                                <span className="material-icons-round text-sm">delete_outline</span>
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Drawer Footer */}
                        <div className="pt-3 border-t border-white/10 text-[10px] text-slate-400 text-center">
                            Grounded in ICAR, Agmarknet & CIBRC standards
                        </div>
                    </div>
                </div>
            )}

            {/* 3. Citations & Sources Modal */}
            {activeSourcesModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
                    <div className="bg-[#0c1f14] border border-white/15 rounded-3xl p-6 w-full max-w-md shadow-2xl relative max-h-[85vh] flex flex-col">
                        <div className="flex items-center justify-between pb-3 border-b border-white/10">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                    <span className="material-icons-round text-lg">verified</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-base text-white">Verified Sources & Citations</h3>
                                    <p className="text-[11px] text-slate-400">Grounded scientific & government datasets</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setActiveSourcesModal(null)}
                                className="p-1 rounded-full text-slate-400 hover:text-white"
                            >
                                <span className="material-icons-round text-lg">close</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 my-4 pr-1">
                            {activeSourcesModal.map((src, i) => (
                                <div key={i} className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <h5 className="text-xs font-bold text-emerald-400">{src.title}</h5>
                                        <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                                            {src.type || 'Official'}
                                        </span>
                                    </div>
                                    <p className="text-[11px] font-semibold text-slate-300">{src.org}</p>
                                    <p className="text-[11px] text-slate-400 leading-relaxed">{src.detail}</p>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => setActiveSourcesModal(null)}
                            className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
                        >
                            Close Sources
                        </button>
                    </div>
                </div>
            )}

            {/* Reaction Feedback Toast */}
            {reactionToast && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#0c2e17] border border-primary/40 text-emerald-300 px-4 py-2 rounded-2xl shadow-xl text-xs font-bold animate-bounce-short backdrop-blur-lg">
                    {reactionToast}
                </div>
            )}

            {/* 4. Top Navigation Bar */}
            <header className="sticky top-0 z-20 px-4 pt-12 pb-3.5 bg-[#07130c]/85 border-b border-white/10 backdrop-blur-xl shadow-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Side Drawer Hamburger Menu (3-lines) */}
                        <button
                            onClick={() => setIsDrawerOpen(true)}
                            className="p-2 -ml-2 rounded-2xl hover:bg-white/10 text-white transition-colors cursor-pointer relative"
                            title="Open Chat Memory & History"
                        >
                            <span className="material-icons-round text-2xl">menu</span>
                            {savedSessions.length > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary animate-ping"></span>
                            )}
                        </button>

                        <button
                            onClick={onBack}
                            className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                            title="Back to Dashboard"
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
                                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">AI Pro</span>
                                </h1>
                                <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                                    <span>{farmData ? `${farmData.crop_type || 'Farm'} Context • Grounded` : 'Online • ICAR Standard'}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* New Chat Top Shortcut */}
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
                    <div key={msg.id} className={`flex gap-3 animate-fade-in items-end ${msg.isAI ? '' : 'flex-row-reverse'}`}>
                        {/* Avatar */}
                        {msg.isAI && (
                            <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-[#0ED054]/25 to-emerald-400/10 border border-[#0ED054]/30 flex items-center justify-center self-end mb-1 text-primary shrink-0">
                                <span className="material-icons-round text-sm">smart_toy</span>
                            </div>
                        )}

                        <div className={`flex flex-col gap-1.5 max-w-[88%] md:max-w-[78%] ${msg.isAI ? '' : 'items-end'}`}>
                            {/* Message Bubble */}
                            <div className={`${
                                msg.isAI 
                                    ? 'bg-[#0f2818]/80 border border-white/10 text-slate-100 rounded-3xl rounded-bl-sm shadow-xl backdrop-blur-md' 
                                    : 'bg-gradient-to-r from-[#0ED054] to-[#0A9E3E] text-white rounded-3xl rounded-br-sm shadow-[0_4px_16px_rgba(14,208,84,0.3)] font-semibold'
                            } p-4 md:p-5 relative group transition-all`}>
                                
                                {/* User Uploaded Attachment Preview */}
                                {msg.attachment && (
                                    <div className="mb-3 p-2 rounded-2xl bg-black/25 border border-white/20 flex items-center gap-3">
                                        {msg.attachment.previewUrl ? (
                                            <img 
                                                src={msg.attachment.previewUrl} 
                                                alt="Uploaded field sample" 
                                                className="w-16 h-16 object-cover rounded-xl border border-white/30"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white">
                                                <span className="material-icons-round text-2xl">description</span>
                                            </div>
                                        )}
                                        <div className="overflow-hidden text-xs">
                                            <p className="font-bold truncate text-white">{msg.attachment.name}</p>
                                            <p className="text-[10px] text-white/75">{msg.attachment.sizeKb} KB • Uploaded for AI Diagnostic</p>
                                        </div>
                                    </div>
                                )}

                                {/* Message Content */}
                                {msg.isAI ? (
                                    <div>{renderFormattedAIText(msg.text)}</div>
                                ) : (
                                    <p className="drop-shadow-sm text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                )}

                                {/* AI Message Action Bar (ChatGPT / Gemini Style) */}
                                {msg.isAI && (
                                    <div className="mt-3.5 pt-2.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                                        {/* Left action tools: Sources, Voice, Copy, Regenerate */}
                                        <div className="flex items-center gap-1.5">
                                            {/* Sources Chip */}
                                            {msg.sources && msg.sources.length > 0 && (
                                                <button
                                                    onClick={() => setActiveSourcesModal(msg.sources)}
                                                    className="px-2.5 py-1 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                                                    title="View verified sources & citations"
                                                >
                                                    <span className="material-icons-round text-xs">verified</span>
                                                    <span>{msg.sources.length} Sources</span>
                                                </button>
                                            )}

                                            {/* Copy Button */}
                                            <button
                                                onClick={() => handleCopy(msg)}
                                                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                                                title="Copy to clipboard"
                                            >
                                                <span className="material-icons-round text-sm">
                                                    {copiedMessageId === msg.id ? 'check' : 'content_copy'}
                                                </span>
                                                {copiedMessageId === msg.id && <span className="text-primary font-bold">Copied!</span>}
                                            </button>

                                            {/* Voice Text-To-Speech Button */}
                                            <button
                                                onClick={() => togglePlayback(msg)}
                                                className={`p-1.5 rounded-xl transition-all cursor-pointer text-[11px] flex items-center gap-1 ${
                                                    playingMessageId === msg.id
                                                        ? 'bg-primary text-slate-900 font-bold animate-pulse shadow-md shadow-primary/30'
                                                        : 'bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white'
                                                }`}
                                                title={playingMessageId === msg.id ? 'Stop audio' : 'Listen to answer'}
                                            >
                                                <span className="material-icons-round text-sm">
                                                    {playingMessageId === msg.id ? 'stop' : 'volume_up'}
                                                </span>
                                            </button>

                                            {/* Regenerate Button */}
                                            <button
                                                onClick={() => handleRegenerate(msg.id)}
                                                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors cursor-pointer"
                                                title="Regenerate alternative response"
                                            >
                                                <span className="material-icons-round text-sm">refresh</span>
                                            </button>
                                        </div>

                                        {/* Right action tools: Like / Dislike */}
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleReaction(msg.id, 'like')}
                                                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                                                    messageReactions[msg.id] === 'like'
                                                        ? 'bg-emerald-500/25 text-emerald-400 border border-emerald-500/40'
                                                        : 'bg-white/5 hover:bg-white/15 text-slate-400 hover:text-slate-200'
                                                }`}
                                                title="Good recommendation (Like)"
                                            >
                                                <span className="material-icons-round text-sm">thumb_up</span>
                                            </button>
                                            <button
                                                onClick={() => handleReaction(msg.id, 'dislike')}
                                                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                                                    messageReactions[msg.id] === 'dislike'
                                                        ? 'bg-red-500/25 text-red-400 border border-red-500/40'
                                                        : 'bg-white/5 hover:bg-white/15 text-slate-400 hover:text-slate-200'
                                                }`}
                                                title="Needs improvement (Dislike)"
                                            >
                                                <span className="material-icons-round text-sm">thumb_down</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Message Timestamp */}
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mx-1">
                                {msg.time}
                            </span>
                        </div>
                    </div>
                ))}

                {/* Typing / Analyzing Indicator */}
                {isTyping && (
                    <div className="flex gap-3 items-center ml-11 animate-fade-in">
                        <div className="flex items-center gap-2 bg-[#0c2415]/90 border border-primary/30 py-2.5 px-4 rounded-2xl shadow-lg backdrop-blur-md">
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.15s]"></div>
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.3s]"></div>
                            <span className="text-xs font-extrabold text-emerald-300 ml-1">Analyzing Agricultural Science & Sources...</span>
                        </div>
                    </div>
                )}
            </main>

            {/* 6. Quick Real-World Agricultural Question Chips */}
            <div className="fixed bottom-24 left-0 w-full px-4 overflow-x-auto no-scrollbar flex space-x-2 z-20 pointer-events-auto">
                {[
                    '🧪 Analyze Soil Health Card & NPK',
                    '🌾 Today\'s Mandi Bhav & Trends',
                    '🐛 Leaf pest / disease treatment',
                    '💧 Weather impact on irrigation',
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

            {/* 7. Bottom Input Bar with File Uploader */}
            <div className="fixed bottom-0 left-0 w-full bg-[#07130c]/90 border-t border-white/10 pb-6 pt-2.5 z-30 shadow-[0_-12px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
                
                {/* Active Attachment Preview Banner */}
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
                                    <p className="text-[10px] text-emerald-400 font-semibold">{attachment.sizeKb} KB • Ready for Lab & Agronomic Analysis</p>
                                </div>
                            </div>
                            <button
                                onClick={removeAttachment}
                                className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                title="Remove file"
                            >
                                <span className="material-icons-round text-base">close</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Input Controls */}
                <div className="max-w-md mx-auto px-4 flex items-end gap-2">
                    {/* Hidden Native File Input */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.txt,.csv"
                        className="hidden"
                    />

                    {/* Attachment Button */}
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

                    {/* Text Input Container */}
                    <div className={`flex-1 rounded-2xl px-3.5 py-2.5 flex items-center gap-2 border transition-all duration-300 ${
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

                        {/* Mic Voice Input */}
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

                    {/* Send Button */}
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
