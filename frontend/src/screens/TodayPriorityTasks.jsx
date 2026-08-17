import React, { useState, useEffect, useCallback } from 'react';
import BottomNavbar from '../components/BottomNavbar';
import { aiAPI, farmAPI } from '../api';

const TodayPriorityTasks = ({ onBack, onNavigate, selectedFarmId, userProfile }) => {
    const [tasksData, setTasksData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'pending' | 'completed'
    
    // AI Field Survey State
    const [isSurveyOpen, setIsSurveyOpen] = useState(false);
    const [surveyData, setSurveyData] = useState(null);
    const [surveyAnswers, setSurveyAnswers] = useState({});
    const [isSubmittingSurvey, setIsSubmittingSurvey] = useState(false);
    const [isGeneratingSurvey, setIsGeneratingSurvey] = useState(false);

    // Sowing Date Adjustment State
    const [isSowingModalOpen, setIsSowingModalOpen] = useState(false);
    const [customSowingDate, setCustomSowingDate] = useState(new Date().toISOString().split('T')[0]);
    const [isUpdatingSowingDate, setIsUpdatingSowingDate] = useState(false);

    const farmId = selectedFarmId || 'default';
    const activeLanguage = userProfile?.preferred_language || localStorage.getItem('kisan_lang') || 'en';

    // 1. Fetch Today's Daily Tasks
    const loadDailyTasks = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { data } = await aiAPI.getDailyTasks(farmId, activeLanguage);
            if (data?.data) {
                setTasksData(data.data);
            }
        } catch (err) {
            console.error('Failed to load daily tasks:', err);
            setError('Could not fetch daily operations. Showing verified standard checkups.');
        } finally {
            setIsLoading(false);
        }
    }, [farmId, activeLanguage]);

    useEffect(() => {
        loadDailyTasks();
    }, [loadDailyTasks]);

    // Handle Quick Sowing Date Update
    const handleSetSowingDate = async (newDateStr) => {
        setIsUpdatingSowingDate(true);
        try {
            if (farmId && farmId !== 'default') {
                await farmAPI.updateFarm(farmId, { sowing_date: newDateStr });
            }
            setIsSowingModalOpen(false);
            // Refresh tasks immediately
            await loadDailyTasks();
        } catch (err) {
            console.error('Failed to update sowing date:', err);
            // If offline / demo mode, reload tasks anyway
            await loadDailyTasks();
            setIsSowingModalOpen(false);
        } finally {
            setIsUpdatingSowingDate(false);
        }
    };

    // 2. Handle Task Toggle (Tick / Completed)
    const handleToggleTask = async (taskId, currentCompleted) => {
        const newCompleted = !currentCompleted;

        // Optimistic UI update
        setTasksData(prev => {
            if (!prev || !prev.tasks) return prev;
            return {
                ...prev,
                tasks: prev.tasks.map(t => t.id === taskId ? { ...t, completed: newCompleted, dismissed: false } : t)
            };
        });

        try {
            await aiAPI.updateTaskStatus(farmId, taskId, { completed: newCompleted, dismissed: false });
        } catch (err) {
            console.warn('Failed to update task state on server:', err);
        }
    };

    // 3. Handle Task Dismiss (Cross / Skip)
    const handleDismissTask = async (taskId) => {
        // Optimistic UI update
        setTasksData(prev => {
            if (!prev || !prev.tasks) return prev;
            return {
                ...prev,
                tasks: prev.tasks.map(t => t.id === taskId ? { ...t, dismissed: true, completed: false } : t)
            };
        });

        try {
            await aiAPI.updateTaskStatus(farmId, taskId, { dismissed: true, completed: false });
        } catch (err) {
            console.warn('Failed to dismiss task on server:', err);
        }
    };

    // 4. Open and Load AI Field Survey
    const handleOpenSurvey = async () => {
        setIsSurveyOpen(true);
        setIsGeneratingSurvey(true);
        try {
            const { data } = await aiAPI.getDailySurvey(farmId, activeLanguage);
            if (data?.survey) {
                setSurveyData(data.survey);
                // Pre-populate with first option of each question
                const initial = {};
                (data.survey.questions || []).forEach(q => {
                    if (q.options && q.options.length > 0) {
                        initial[q.id] = q.options[0].label;
                    }
                });
                setSurveyAnswers(initial);
            }
        } catch (err) {
            console.error('Failed to load survey:', err);
        } finally {
            setIsGeneratingSurvey(false);
        }
    };

    // 5. Submit Survey Answers & Regenerate Tasks
    const handleSubmitSurvey = async () => {
        setIsSubmittingSurvey(true);
        try {
            const responses = (surveyData?.questions || []).map(q => ({
                id: q.id,
                question: q.question,
                selectedOption: surveyAnswers[q.id] || 'Standard'
            }));

            const { data } = await aiAPI.submitDailySurvey(farmId, responses, activeLanguage);
            if (data?.data) {
                setTasksData(data.data);
                setIsSurveyOpen(false);
            }
        } catch (err) {
            console.error('Failed to submit survey:', err);
            alert('Failed to update tasks from survey. Please try again.');
        } finally {
            setIsSubmittingSurvey(false);
        }
    };

    const tasksList = tasksData?.tasks || [];
    const activeTasks = tasksList.filter(t => !t.dismissed);
    const completedTasksCount = activeTasks.filter(t => t.completed).length;
    const totalActiveCount = activeTasks.length;
    const completionPercentage = totalActiveCount > 0 ? Math.round((completedTasksCount / totalActiveCount) * 100) : 0;

    const filteredTasks = activeTasks.filter(t => {
        if (activeFilter === 'pending') return !t.completed;
        if (activeFilter === 'completed') return t.completed;
        return true;
    });

    const getCategoryIcon = (cat) => {
        const c = (cat || '').toLowerCase();
        if (c.includes('irrigat') || c.includes('water')) return 'water_drop';
        if (c.includes('scout') || c.includes('pest') || c.includes('disease')) return 'bug_report';
        if (c.includes('nutrit') || c.includes('fert')) return 'compost';
        if (c.includes('protect')) return 'shield';
        return 'engineering';
    };

    const getPriorityBadgeClass = (priority) => {
        const p = (priority || '').toLowerCase();
        if (p.includes('high')) return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
        if (p.includes('medium')) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    };

    const formattedDate = new Date().toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    }).toUpperCase();

    return (
        <div className="bg-gradient-to-b from-[#fcfdfc] to-[#e3eae4] dark:from-[#03140A] dark:to-[#081d11] font-display text-gray-900 dark:text-gray-100 min-h-screen flex justify-center pb-24 antialiased">
            <div className="w-full max-w-md bg-transparent min-h-screen relative flex flex-col shadow-2xl overflow-hidden">
                
                {/* Top Header */}
                <header className="pt-12 px-6 pb-4 flex justify-between items-center bg-white/40 dark:bg-[#03140A]/40 backdrop-blur-xl sticky top-0 z-20 border-b border-gray-100 dark:border-white/5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={onBack} 
                            className="p-2 -ml-2 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors active:scale-95 flex items-center justify-center cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-xl text-gray-700 dark:text-gray-200">arrow_back</span>
                        </button>
                        <div>
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block leading-none">
                                Kisan Daily Checks
                            </span>
                            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight mt-0.5">
                                Operations & Tasks
                            </h1>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="inline-block text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-full shadow-sm">
                            {formattedDate}
                        </span>
                    </div>
                </header>

                <main className="flex-1 px-5 pt-4 flex flex-col gap-4 overflow-y-auto no-scrollbar">
                    
                    {/* Error / Offline Alert */}
                    {error && (
                        <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">info</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Crop & Field Stage Banner */}
                    <div className="bg-gradient-to-r from-[#072412] to-[#0d3d1e] text-white p-4 rounded-3xl shadow-xl border border-emerald-500/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#13ec6d]/10 rounded-full blur-2xl pointer-events-none"></div>
                        
                        <div className="flex items-center justify-between mb-2 relative z-10">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#13ec6d] animate-pulse shadow-[0_0_8px_#13ec6d]"></span>
                                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                                    {tasksData?.crop || 'Crop'} Field Intelligence
                                </span>
                            </div>
                            <span className="text-[10px] bg-black/40 text-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-medium">
                                {tasksData?.overall_field_status || 'Active Care'}
                            </span>
                        </div>

                        <h2 className="text-lg font-black text-white relative z-10 leading-tight mb-1">
                            {tasksData?.growth_stage || 'Active Growth Operations'}
                        </h2>

                        {/* Sowing Date & Age Indicator */}
                        <div className="flex items-center justify-between bg-black/30 rounded-2xl p-2.5 my-2 border border-emerald-500/20 relative z-10">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-emerald-400 text-lg">calendar_today</span>
                                <div>
                                    <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider block">
                                        Crop Age / Sowing
                                    </span>
                                    <span className="text-xs font-black text-white">
                                        {tasksData?.das === 0 ? 'Planted Today (Day 0)' : tasksData?.das ? `${tasksData.das} Days After Sowing (DAS)` : 'Stage Tracked'}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsSowingModalOpen(true)}
                                className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-bold px-2.5 py-1 rounded-xl border border-emerald-500/30 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                            >
                                <span className="material-symbols-outlined text-xs">edit_calendar</span>
                                <span>Change Age</span>
                            </button>
                        </div>

                        <p className="text-xs text-emerald-100/90 relative z-10 leading-relaxed mb-3">
                            {tasksData?.weather_headline || 'Favorable morning conditions. Complete stage-accurate checks.'}
                        </p>

                        {/* Interactive Survey Trigger Pill */}
                        <button
                            onClick={handleOpenSurvey}
                            className="w-full bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-bold text-xs py-2.5 px-4 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-base">quiz</span>
                            <span>Take Today's AI Field Survey for Custom Checks</span>
                            <span className="material-symbols-outlined text-base">arrow_forward</span>
                        </button>
                    </div>

                    {/* Progress HUD Bar */}
                    <div className="bg-white/70 dark:bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm flex flex-col gap-2">
                        <div className="flex justify-between items-center text-xs font-bold">
                            <span className="text-gray-700 dark:text-gray-300">Daily Operations Completed</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{completedTasksCount} / {totalActiveCount} ({completionPercentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
                            <div 
                                className="bg-gradient-to-r from-emerald-500 to-[#13ec6d] h-2.5 rounded-full transition-all duration-500 shadow-sm"
                                style={{ width: `${completionPercentage}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex gap-2 p-1 bg-gray-200/60 dark:bg-black/40 rounded-2xl">
                        {[
                            { id: 'all', label: `All Checks (${totalActiveCount})` },
                            { id: 'pending', label: `Pending (${totalActiveCount - completedTasksCount})` },
                            { id: 'completed', label: `Completed (${completedTasksCount})` }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveFilter(tab.id)}
                                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    activeFilter === tab.id
                                        ? 'bg-white dark:bg-emerald-600 text-gray-900 dark:text-white shadow-sm'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tasks Checklist */}
                    {isLoading ? (
                        <div className="py-12 flex flex-col items-center justify-center gap-3">
                            <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Synthesizing agronomic checks from farm context...</p>
                        </div>
                    ) : filteredTasks.length === 0 ? (
                        <div className="py-12 text-center bg-white/40 dark:bg-white/5 rounded-3xl p-6 border border-dashed border-gray-300 dark:border-gray-700">
                            <span className="material-symbols-outlined text-4xl text-emerald-500 mb-2">task_alt</span>
                            <h3 className="font-bold text-sm text-gray-800 dark:text-white mb-1">
                                {activeFilter === 'completed' ? 'No completed tasks yet' : 'All field checks completed!'}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto mb-4">
                                {activeFilter === 'completed' 
                                    ? 'Tick off the checks as you finish your daily field operations.' 
                                    : 'Great job maintaining your field today. You can take a custom survey to log new checks.'}
                            </p>
                            <button
                                onClick={loadDailyTasks}
                                className="px-4 py-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold hover:bg-emerald-500/25 transition-all"
                            >
                                Refresh Checks
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3.5">
                            {filteredTasks.map((task) => (
                                <div
                                    key={task.id}
                                    className={`relative bg-white dark:bg-[#071a0e] rounded-2xl p-4 shadow-sm border transition-all duration-300 ${
                                        task.completed 
                                            ? 'border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/20 opacity-80' 
                                            : 'border-gray-100 dark:border-white/10 hover:border-emerald-500/40 hover:shadow-md'
                                    }`}
                                >
                                    {/* Task Header: Category, Timing & Priority */}
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-base text-emerald-600 dark:text-emerald-400">
                                                {getCategoryIcon(task.category)}
                                            </span>
                                            <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                                                {task.category || 'Operation'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${getPriorityBadgeClass(task.priority)}`}>
                                                {task.priority || 'Routine'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Task Title & Timing */}
                                    <div className="mb-2">
                                        <h3 className={`text-base font-bold leading-snug ${
                                            task.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'
                                        }`}>
                                            {task.title}
                                        </h3>
                                        {task.timing && (
                                            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                                                <span className="material-symbols-outlined text-[13px]">schedule</span>
                                                {task.timing}
                                            </span>
                                        )}
                                    </div>

                                    {/* Task Description */}
                                    <p className={`text-xs leading-relaxed mb-3 ${
                                        task.completed ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-300'
                                    }`}>
                                        {task.description}
                                    </p>

                                    {/* Tip / Caution Alert Box */}
                                    {task.safety_or_tip && !task.completed && (
                                        <div className="mb-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2 text-[11px] text-amber-700 dark:text-amber-300">
                                            <span className="material-symbols-outlined text-amber-500 text-sm shrink-0 mt-0.5">lightbulb</span>
                                            <span className="leading-snug">{task.safety_or_tip}</span>
                                        </div>
                                    )}

                                    {/* Action Buttons (Tick / Complete and Cross / Dismiss) */}
                                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-white/5">
                                        <button
                                            onClick={() => handleToggleTask(task.id, task.completed)}
                                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm ${
                                                task.completed
                                                    ? 'bg-emerald-600 text-white shadow-emerald-500/30'
                                                    : 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25'
                                            }`}
                                        >
                                            <span className="material-symbols-outlined text-base">
                                                {task.completed ? 'check_circle' : 'radio_button_unchecked'}
                                            </span>
                                            <span>{task.completed ? 'Completed' : 'Mark as Done'}</span>
                                        </button>

                                        <button
                                            onClick={() => handleDismissTask(task.id)}
                                            className="text-gray-400 hover:text-rose-500 p-1.5 rounded-xl hover:bg-rose-500/10 transition-colors cursor-pointer text-[11px] font-semibold flex items-center gap-1"
                                            title="Skip this check for today"
                                        >
                                            <span className="material-symbols-outlined text-base">close</span>
                                            <span>Skip</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>

                {/* AI Field Survey Modal */}
                {isSurveyOpen && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                        <div className="w-full max-w-sm bg-[#041a0d] border border-emerald-500/30 rounded-3xl p-5 text-white shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-fade-in">
                            <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-emerald-400">psychology</span>
                                    <h3 className="font-extrabold text-sm text-white">AI Field Diagnostic Survey</h3>
                                </div>
                                <button 
                                    onClick={() => setIsSurveyOpen(false)}
                                    className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-gray-300"
                                >
                                    <span className="material-symbols-outlined text-base">close</span>
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto no-scrollbar py-4 space-y-4">
                                {isGeneratingSurvey ? (
                                    <div className="py-12 flex flex-col items-center justify-center gap-3">
                                        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                        <p className="text-xs text-emerald-300 text-center font-medium">
                                            Generating custom questions for your {tasksData?.crop || 'crop'} and soil...
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-xs text-gray-300 leading-relaxed">
                                            Answer these 3 quick observations from your field today. The AI will recalibrate today's action checklist.
                                        </p>

                                        {(surveyData?.questions || []).map((q, qIdx) => (
                                            <div key={q.id || qIdx} className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                                                        Check {qIdx + 1} • {q.category || 'Field Observation'}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-bold text-white leading-snug">
                                                    {q.question}
                                                </p>
                                                <div className="space-y-1.5 pt-1">
                                                    {(q.options || []).map((opt, optIdx) => {
                                                        const isSelected = surveyAnswers[q.id] === opt.label;
                                                        return (
                                                            <button
                                                                key={opt.id || optIdx}
                                                                onClick={() => setSurveyAnswers(prev => ({ ...prev, [q.id]: opt.label }))}
                                                                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                                                                    isSelected
                                                                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                                                                        : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/5'
                                                                }`}
                                                            >
                                                                <span>{opt.label}</span>
                                                                {isSelected && (
                                                                    <span className="material-symbols-outlined text-sm text-slate-950 font-bold">check</span>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>

                            <div className="pt-3 border-t border-emerald-500/20 flex gap-2">
                                <button
                                    onClick={() => setIsSurveyOpen(false)}
                                    className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmitSurvey}
                                    disabled={isSubmittingSurvey || isGeneratingSurvey}
                                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold shadow-lg flex items-center justify-center gap-1.5 disabled:opacity-50"
                                >
                                    {isSubmittingSurvey ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                                            <span>Updating...</span>
                                        </>
                                    ) : (
                                        <span>Update Today's Tasks</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Sowing Date Adjustment Modal */}
                {isSowingModalOpen && (
                    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4 animate-fade-in">
                        <div className="bg-[#072412] border border-emerald-500/30 rounded-3xl w-full max-w-md p-5 flex flex-col gap-4 text-white shadow-2xl animate-fade-in-up">
                            
                            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-emerald-400 text-xl">event_available</span>
                                    <div>
                                        <h3 className="text-base font-black text-white">Adjust Crop Sowing Date</h3>
                                        <p className="text-[11px] text-emerald-300">Sets the exact Days After Sowing (DAS) for precise daily checks</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsSowingModalOpen(false)}
                                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 hover:text-white cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-lg">close</span>
                                </button>
                            </div>

                            <div className="flex flex-col gap-2">
                                <span className="text-xs font-bold text-gray-300">Quick Stage Presets:</span>
                                
                                <button
                                    onClick={() => {
                                        const today = new Date().toISOString().split('T')[0];
                                        handleSetSowingDate(today);
                                    }}
                                    disabled={isUpdatingSowingDate}
                                    className="p-3 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 flex items-center justify-between text-left transition-all active:scale-[0.98] cursor-pointer"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">🌱</span>
                                        <div>
                                            <span className="text-sm font-black text-emerald-300 block">Planted Today (Day 0)</span>
                                            <span className="text-[10px] text-gray-300">Seedbed depth, moisture seal & bird protection</span>
                                        </div>
                                    </div>
                                    <span className="material-symbols-outlined text-emerald-400 text-sm">arrow_forward</span>
                                </button>

                                <button
                                    onClick={() => {
                                        const d = new Date();
                                        d.setDate(d.getDate() - 3);
                                        handleSetSowingDate(d.toISOString().split('T')[0]);
                                    }}
                                    disabled={isUpdatingSowingDate}
                                    className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between text-left transition-all active:scale-[0.98] cursor-pointer"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">🌿</span>
                                        <div>
                                            <span className="text-sm font-bold text-white block">3 Days Ago (Germination)</span>
                                            <span className="text-[10px] text-gray-400">Subterranean radicle check & crust softening</span>
                                        </div>
                                    </div>
                                    <span className="material-symbols-outlined text-gray-400 text-sm">arrow_forward</span>
                                </button>

                                <button
                                    onClick={() => {
                                        const d = new Date();
                                        d.setDate(d.getDate() - 8);
                                        handleSetSowingDate(d.toISOString().split('T')[0]);
                                    }}
                                    disabled={isUpdatingSowingDate}
                                    className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between text-left transition-all active:scale-[0.98] cursor-pointer"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">🌾</span>
                                        <div>
                                            <span className="text-sm font-bold text-white block">8 Days Ago (Seedling Stand)</span>
                                            <span className="text-[10px] text-gray-400">Emergence uniformity & damping-off inspection</span>
                                        </div>
                                    </div>
                                    <span className="material-symbols-outlined text-gray-400 text-sm">arrow_forward</span>
                                </button>

                                <button
                                    onClick={() => {
                                        const d = new Date();
                                        d.setDate(d.getDate() - 30);
                                        handleSetSowingDate(d.toISOString().split('T')[0]);
                                    }}
                                    disabled={isUpdatingSowingDate}
                                    className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between text-left transition-all active:scale-[0.98] cursor-pointer"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">🌳</span>
                                        <div>
                                            <span className="text-sm font-bold text-white block">30 Days Ago (Vegetative Canopy)</span>
                                            <span className="text-[10px] text-gray-400">Canopy scouting, top dressing & weed sanitation</span>
                                        </div>
                                    </div>
                                    <span className="material-symbols-outlined text-gray-400 text-sm">arrow_forward</span>
                                </button>
                            </div>

                            <div className="pt-3 border-t border-emerald-500/20 flex flex-col gap-2">
                                <label className="text-xs font-bold text-gray-300">Or Pick Exact Sowing Date:</label>
                                <div className="flex gap-2">
                                    <input
                                        type="date"
                                        value={customSowingDate}
                                        onChange={(e) => setCustomSowingDate(e.target.value)}
                                        className="flex-1 bg-black/40 border border-emerald-500/30 rounded-xl px-3 py-2 text-white text-xs"
                                    />
                                    <button
                                        onClick={() => handleSetSowingDate(customSowingDate)}
                                        disabled={isUpdatingSowingDate}
                                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
                                    >
                                        Apply
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Bottom Navigation */}
                <BottomNavbar
                    activeTab="priority-tasks"
                    onNavigate={onNavigate}
                />
            </div>
        </div>
    );
};

export default TodayPriorityTasks;
