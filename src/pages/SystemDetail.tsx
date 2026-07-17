import React, { useState, useMemo } from 'react';
import * as LucideIcons from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { MetricsChart } from '../components/MetricsChart';

interface SystemDetailProps {
  systemId: string;
  onBack: () => void;
}

const RATING_LABELS = [
  'Severe Issue',      // 1
  'Critical Alert',     // 2
  'Poor Health',        // 3
  'Weak Condition',     // 4
  'Suboptimal Status',  // 5
  'Fair State',         // 6
  'Stable Health',      // 7
  'Good Condition',     // 8
  'Optimal Health',     // 9
  'Excellent State'     // 10
];

const playSliderSound = (value: number) => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const freq = 250 + value * 60; 
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.2, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.16);
  } catch (err) {
    // console.warn('Audio Context failed to play:', err);
  }
};

export const SystemDetail: React.FC<SystemDetailProps> = ({ systemId, onBack }) => {
  const {
    systems,
    events,
    habits,
    goals,
    metrics,
    logSystemRating,
    togglePrecisionMode,
    addEvent,
    deleteEvent,
    addHabit,
    deleteHabit,
    toggleHabitActive,
    updateHabitAdherence,
    addGoal,
    updateGoal,
    deleteGoal,
    addMetricLog,
    deleteMetricLog,
    updateSystemDescription,
  } = useDashboard();

  // Slider-first form state
  const [showFormDetails, setShowFormDetails] = useState(false);
  const [sliderRating, setSliderRating] = useState(8);
  
  // Custom Time and Date log states
  const [customLogDate, setCustomLogDate] = useState('2026-07-17');
  const [customLogTime, setCustomLogTime] = useState('12:00');
  const [showCustomDateTime, setShowCustomDateTime] = useState(false);

  // Description details state
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempDescription, setTempDescription] = useState('');

  // Three-dot header menu state
  const [isDetailHeaderMenuOpen, setIsDetailHeaderMenuOpen] = useState(false);

  // Card expansion states (subjective / precision)
  const [isQuickRatingExpanded, setIsQuickRatingExpanded] = useState(false);
  const [isEventLogsExpanded, setIsEventLogsExpanded] = useState(false);
  const [isGoalsExpanded, setIsGoalsExpanded] = useState(false);
  const [isVitalsExpanded, setIsVitalsExpanded] = useState(false);
  const [isMedHistoryExpanded, setIsMedHistoryExpanded] = useState(false);
  const [isHabitsExpanded, setIsHabitsExpanded] = useState(false);
  const [isPrecisionGoalsExpanded, setIsPrecisionGoalsExpanded] = useState(false);

  // Simple Mode forms
  const [simpleGoalTitle, setSimpleGoalTitle] = useState('');
  const [simpleGoalDate, setSimpleGoalDate] = useState('2026-08-30');
  const [simpleGoalRating, setSimpleGoalRating] = useState('8');

  const [simpleNoteTitle, setSimpleNoteTitle] = useState('');
  const [simpleNoteText, setSimpleNoteText] = useState('');
  const [simpleNoteCategory, setSimpleNoteCategory] = useState<'Checkup' | 'Symptom'>('Checkup');

  const [expandedEventIds, setExpandedEventIds] = useState<Record<string, boolean>>({});
  const [selectedLogDate, setSelectedLogDate] = useState<string | null>(null);

  const toggleEventExpand = (eventId: string) => {
    setExpandedEventIds(prev => ({ ...prev, [eventId]: !prev[eventId] }));
  };

  // Advanced Mode forms
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitFreq, setNewHabitFreq] = useState<'Daily' | 'Weekly' | 'As Needed'>('Daily');

  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDate, setNewGoalDate] = useState('2026-08-30');
  const [newGoalMetric, setNewGoalMetric] = useState('');

  const [newMetricName, setNewMetricName] = useState('');
  const [newMetricVal, setNewMetricVal] = useState('');
  const [newMetricUnit, setNewMetricUnit] = useState('');

  // Find active system
  const system = systems.find((s) => s.id === systemId);

  // Sync state values on active system change
  React.useEffect(() => {
    if (system) {
      setSliderRating(system.subjectiveRating);
      setTempDescription(system.description);
    }
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setCustomLogTime(timeStr);
    setCustomLogDate('2026-07-17'); // seed date anchor
    setShowCustomDateTime(false);
  }, [systemId, system]);
  if (!system) {
    return (
      <div className="text-center p-8 space-y-4">
        <p className="text-slate-400">System not found.</p>
        <button onClick={onBack} className="text-indigo-400 font-semibold hover:underline">
          Go Back
        </button>
      </div>
    );
  }

  // Filter lists
  const systemEvents = events.filter((e) => e.systemId === systemId);
  const displayedEvents = selectedLogDate ? systemEvents.filter(e => e.date === selectedLogDate) : systemEvents;
  const systemHabits = habits.filter((h) => h.systemId === systemId);
  const systemGoals = goals.filter((g) => g.systemId === systemId);
  const systemMetrics = metrics.filter((m) => m.systemId === systemId);

  // Build chart data from wellness event ratings (real-time synced)
  // For each date, average all event ratings for this system
  const systemScoreHistory = useMemo(() => {
    const dateMap = new Map<string, number[]>();
    systemEvents.forEach(ev => {
      if (ev.rating) {
        const existing = dateMap.get(ev.date) || [];
        existing.push(ev.rating);
        dateMap.set(ev.date, existing);
      }
    });
    return Array.from(dateMap.entries())
      .map(([date, ratings]) => ({
        date,
        value: Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [systemEvents]);

  const getIcon = (iconName: string, className = "w-6 h-6") => {
    const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.Heart;
    return <IconComponent className={className} />;
  };

  const systemColors: Record<string, { text: string; bg: string; border: string; hex: string }> = {
    cardio: { text: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20', hex: '#f43f5e' },
    nervous: { text: 'text-violet-500', bg: 'bg-violet-500/10', border: 'border-violet-500/20', hex: '#8b5cf6' },
    digestive: { text: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', hex: '#10b981' },
    musculoskeletal: { text: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', hex: '#f59e0b' },
    respiratory: { text: 'text-cyan-500', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', hex: '#06b6d4' },
    immune: { text: 'text-pink-500', bg: 'bg-pink-500/10', border: 'border-pink-500/20', hex: '#ec4899' },
    endocrine: { text: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20', hex: '#a855f7' },
    integumentary: { text: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20', hex: '#f97316' },
    urinary: { text: 'text-sky-500', bg: 'bg-sky-500/10', border: 'border-sky-500/20', hex: '#0ea5e9' },
    reproductive: { text: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20', hex: '#f472b6' },
  };

  const themeColors = systemColors[system.id] || { text: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', hex: '#818cf8' };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'Optimal':
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
      case 'Stable':
        return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
      case 'Suboptimal':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
      case 'Attention Required':
      default:
        return 'bg-rose-500/10 border-rose-500/20 text-rose-400';
    }
  };

  // Simple Mode additions
  const handleAddSimpleGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simpleGoalTitle.trim()) return;
    addGoal({
      systemId,
      title: simpleGoalTitle,
      targetDate: simpleGoalDate,
      status: 'In Progress',
      metricTarget: `Rating: ${simpleGoalRating}/10`,
    });
    setSimpleGoalTitle('');
  };

  const handleAddSimpleNote = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Log rating to systems & history trends
    logSystemRating(systemId, sliderRating, customLogDate, customLogTime);
    
    // Log event to timeline
    addEvent({
      systemId,
      date: customLogDate,
      time: customLogTime,
      type: simpleNoteCategory,
      title: simpleNoteTitle.trim() || `Rated ${sliderRating}/10`,
      description: simpleNoteText || 'Quick rating update.',
      severity: simpleNoteCategory === 'Symptom' ? 'Moderate' : undefined,
      rating: sliderRating,
    });
    
    setSimpleNoteTitle('');
    setSimpleNoteText('');
    setShowFormDetails(false);
    setShowCustomDateTime(false);
  };

  // Advanced Mode additions
  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    addHabit({
      systemId,
      name: newHabitName,
      frequency: newHabitFreq,
      adherence: 100,
      isActive: true,
    });
    setNewHabitName('');
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;
    addGoal({
      systemId,
      title: newGoalTitle,
      targetDate: newGoalDate,
      status: 'In Progress',
      metricTarget: newGoalMetric.trim() || undefined,
    });
    setNewGoalTitle('');
    setNewGoalMetric('');
  };

  const handleAddMetric = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMetricName.trim() || !newMetricVal.trim() || !newMetricUnit.trim()) return;
    addMetricLog({
      systemId,
      name: newMetricName,
      value: parseFloat(newMetricVal),
      unit: newMetricUnit,
      timestamp: new Date().toISOString().split('T')[0],
    });
    setNewMetricName('');
    setNewMetricVal('');
    setNewMetricUnit('');
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-200">
      
      {/* Detail Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <LucideIcons.ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${themeColors.bg} border ${themeColors.border} ${themeColors.text}`}>
              {getIcon(system.iconName)}
            </div>
            <div>
              <h1 className="font-display font-bold text-xl md:text-2xl text-slate-100 m-0 leading-tight">
                {system.name} System
              </h1>
              <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusStyles(system.status)}`}>
                {system.status}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Three-dots Dropdown Menu Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDetailHeaderMenuOpen(!isDetailHeaderMenuOpen)}
              className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 hover:bg-slate-800 text-slate-455 hover:text-slate-200 transition-colors cursor-pointer"
              title="More options"
            >
              <LucideIcons.MoreHorizontal className="w-5 h-5" />
            </button>

            {isDetailHeaderMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsDetailHeaderMenuOpen(false)} 
                />
                <div className="absolute right-0 mt-2 top-full w-52 rounded-2xl border border-slate-800 bg-slate-950 p-2 shadow-2xl z-20 animate-fade-in space-y-1">
                  <div className="p-1.5 space-y-1">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-2 py-0.5 block mb-1">
                      Tracking Mode
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        togglePrecisionMode(system.id, false);
                        setIsDetailHeaderMenuOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                        !system.precisionEnabled
                          ? 'bg-slate-800 text-white'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                      }`}
                    >
                      <span>Daily Rating</span>
                      {!system.precisionEnabled && <LucideIcons.Check className="w-3.5 h-3.5 text-indigo-400" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        togglePrecisionMode(system.id, true);
                        setIsDetailHeaderMenuOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                        system.precisionEnabled
                          ? 'bg-indigo-650 text-white'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                      }`}
                    >
                      <span>Precision Vitals</span>
                      {system.precisionEnabled && <LucideIcons.Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Expandable/Collapsible Description Card and Bio-Score side-by-side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
        {/* Description Card */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-800/60 flex flex-col justify-between">
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setIsDescriptionOpen(!isDescriptionOpen)}
              className="w-full flex items-center justify-between text-left text-xs font-semibold text-slate-350 hover:text-slate-100 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <LucideIcons.BookOpen className="w-4 h-4 text-indigo-400" />
                <span>System Description & Details</span>
              </span>
              <LucideIcons.ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isDescriptionOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDescriptionOpen && (
              <div className="pt-3 border-t border-slate-800/40 space-y-3 animate-fade-in text-xs text-slate-405">
                {!isEditingDescription ? (
                  <div className="flex items-start justify-between gap-3 bg-slate-900/20 p-3 rounded-xl border border-slate-900/60">
                    <p className="leading-relaxed text-slate-300">
                      {system.description || <span className="italic text-slate-600">No custom details specified.</span>}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setTempDescription(system.description);
                        setIsEditingDescription(true);
                      }}
                      className="text-slate-500 hover:text-indigo-400 transition-colors p-1 cursor-pointer shrink-0"
                      title="Customize Description"
                    >
                      <LucideIcons.Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      value={tempDescription}
                      onChange={(e) => setTempDescription(e.target.value)}
                      className="w-full h-20 bg-slate-900 border border-slate-800 text-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-indigo-500"
                      placeholder="Describe this body system's baseline state, parameters, or clinical targets..."
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          updateSystemDescription(system.id, tempDescription);
                          setIsEditingDescription(false);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-indigo-650 hover:bg-indigo-550 text-white font-bold text-[10px] transition-colors cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingDescription(false)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-400 font-semibold text-[10px] transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Dedicated Bio-Score Card */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-800/60 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-350">
            <LucideIcons.Activity className="w-4 h-4" style={{ color: themeColors.hex }} />
            <span>System Bio-Score</span>
          </div>
          
          <div className="flex items-center justify-between gap-4 mt-2">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl md:text-5xl font-black font-display text-slate-100 tracking-tight">
                  {system.score}
                </span>
                <span className="text-slate-500 text-xs font-semibold font-mono">/100</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-1">
                Overall Status: <span style={{ color: themeColors.hex }} className="font-bold">{system.score >= 80 ? 'Optimal' : system.score >= 60 ? 'Fair' : 'Critical'}</span>
              </span>
            </div>

            {/* Visual Progress Track */}
            <div className="flex-1 max-w-[120px] bg-slate-900/60 rounded-xl p-3 border border-slate-800/80 flex items-center justify-center gap-2">
              <div className="w-full h-3 rounded-full bg-slate-850 relative overflow-hidden">
                <div 
                  className="absolute top-0 bottom-0 left-0 rounded-full transition-all duration-500"
                  style={{
                    width: `${system.score}%`,
                    backgroundColor: themeColors.hex,
                    boxShadow: `0 0 10px ${themeColors.hex}`
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CORE Score Trend Chart - Visible in BOTH modes (Google Fit Style) */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800/60">
        <MetricsChart
          data={systemScoreHistory}
          title="Health Score Trend"
          colorHex={themeColors.hex}
          maxYValue={10}
          minYValue={0}
          height={200}
          yLabelSuffix="/10"
          onDaySelect={(dateStr) => {
            setSelectedLogDate(dateStr);
            // Expand the event logs / history cards automatically
            setIsEventLogsExpanded(true);
            setIsMedHistoryExpanded(true);
            
            // Smoothly slide to the logs card
            const el = document.getElementById('details-accordion-stack');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }}
        />
      </div>

      {/* DYNAMIC VIEW CONTENT DEPENDING ON MODE */}
      <div id="details-accordion-stack" className="space-y-4">
        {!system.precisionEnabled ? (
        
        /* SIMPLE MODE DETAIL MODULES */
        <div className="space-y-4 animate-fade-in">
          
          {/* Card 1: Quick Rating Entry */}
          <div className="glass-panel rounded-2xl border border-slate-800/60 overflow-hidden">
            <button
              type="button"
              onClick={() => setIsQuickRatingExpanded(!isQuickRatingExpanded)}
              className="w-full flex items-center justify-between p-4 text-left font-display font-semibold text-sm text-slate-200 hover:text-white transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <LucideIcons.PlusCircle className="w-4 h-4 text-indigo-400" />
                <span>Quick Rating Entry</span>
              </span>
              <LucideIcons.ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isQuickRatingExpanded ? 'rotate-180' : ''}`} />
            </button>
            
            {isQuickRatingExpanded && (
              <div className="p-5 border-t border-slate-800/40 space-y-4 animate-fade-in bg-slate-900/10">
                <div className="space-y-3">
                  {/* Android-style Brightness slider track with emoji */}
                  <div className="relative w-full h-9 bg-slate-900 border border-slate-800 rounded-full overflow-hidden flex items-center shadow-inner group">
                    {/* Progress fill */}
                    <div
                      className="absolute left-0 top-0 bottom-0 transition-all duration-100 ease-out"
                      style={{
                        width: `${sliderRating * 10}%`,
                        background: `linear-gradient(to right, ${themeColors.hex}33, ${themeColors.hex}bb)`,
                        boxShadow: `0 0 12px ${themeColors.hex}33`
                      }}
                    />
                    
                    {/* Content display within track */}
                    <div className="absolute inset-0 flex items-center justify-between px-3.5 pointer-events-none select-none">
                      <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-350 transition-colors uppercase tracking-wider flex items-center gap-1.5">
                        <span className="text-sm">
                          {sliderRating >= 9 ? '😄' : sliderRating >= 7 ? '🙂' : sliderRating >= 5 ? '😐' : sliderRating >= 3 ? '😕' : '😞'}
                        </span>
                        <span>{RATING_LABELS[sliderRating - 1]}</span>
                      </span>
                      <span 
                        className="text-xs font-black font-mono px-2 py-0.5 rounded-full border text-white transition-colors"
                        style={{
                          backgroundColor: '#0f172a',
                          borderColor: `${themeColors.hex}44`
                        }}
                      >
                        {sliderRating}/10
                      </span>
                    </div>

                    {/* Opaque range input overlay */}
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={sliderRating}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setSliderRating(val);
                        playSliderSound(val);
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>

                  {/* Date & Time Selectors */}
                  {showCustomDateTime && (
                    <div className="grid grid-cols-2 gap-3 bg-slate-955/60 p-3 rounded-2xl border border-slate-850 animate-fade-in">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Log Date</label>
                        <input
                          type="date"
                          value={customLogDate}
                          onChange={(e) => setCustomLogDate(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Log Time (HH:MM)</label>
                        <input
                          type="time"
                          value={customLogTime}
                          onChange={(e) => setCustomLogTime(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Submissions & Time triggers */}
                  <div className="flex items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => setShowCustomDateTime(!showCustomDateTime)}
                      className="text-[10px] text-slate-550 hover:text-slate-350 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <LucideIcons.Clock className="w-3.5 h-3.5" />
                      <span>{showCustomDateTime ? "Use current time" : "Log for past date/time"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleAddSimpleNote();
                        setIsQuickRatingExpanded(false); // contract after adding
                      }}
                      className="px-4 py-2 rounded-xl bg-indigo-650 hover:bg-indigo-550 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-500/20 cursor-pointer"
                    >
                      <span>Add</span>
                    </button>
                  </div>

                  {/* Optional details toggle */}
                  <button
                    type="button"
                    onClick={() => setShowFormDetails(!showFormDetails)}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors"
                  >
                    <LucideIcons.ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showFormDetails ? 'rotate-180' : ''}`} />
                    <span>{showFormDetails ? 'Hide details' : 'Add details (optional)'}</span>
                  </button>

                  {/* Collapsible detail fields */}
                  {showFormDetails && (
                    <div className="space-y-2 animate-fade-in pt-1">
                      <input
                        type="text"
                        placeholder="Brief headline (e.g. Felt great today)"
                        value={simpleNoteTitle}
                        onChange={(e) => setSimpleNoteTitle(e.target.value)}
                        className="w-full bg-slate-900/60 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500 text-slate-200"
                      />
                      <div className="flex gap-2">
                        <select
                          value={simpleNoteCategory}
                          onChange={(e) => setSimpleNoteCategory(e.target.value as 'Checkup' | 'Symptom')}
                          className="bg-slate-900/60 border border-slate-800 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-indigo-500 text-slate-400"
                        >
                          <option value="Checkup">General Wellness</option>
                          <option value="Symptom">Symptom Alert</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Notes or additional details..."
                          value={simpleNoteText}
                          onChange={(e) => setSimpleNoteText(e.target.value)}
                          className="flex-grow bg-slate-900/60 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500 text-slate-200"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Wellness Event Logs */}
          <div className="glass-panel rounded-2xl border border-slate-800/60 overflow-hidden">
            <button
              type="button"
              onClick={() => setIsEventLogsExpanded(!isEventLogsExpanded)}
              className="w-full flex items-center justify-between p-4 text-left font-display font-semibold text-sm text-slate-200 hover:text-white transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <LucideIcons.FileText className="w-4 h-4 text-slate-400" />
                <span>Wellness Event Logs</span>
              </span>
              <LucideIcons.ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isEventLogsExpanded ? 'rotate-180' : ''}`} />
            </button>

            {isEventLogsExpanded && (
              <div className="p-5 border-t border-slate-800/40 space-y-4 animate-fade-in bg-slate-900/10">
                {selectedLogDate && (
                  <div className="flex items-center justify-between bg-indigo-950/20 border border-indigo-900/30 p-2.5 rounded-xl mb-3 text-xs">
                    <span className="text-slate-350">
                      Showing logs for date: <strong className="text-slate-100">{selectedLogDate}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedLogDate(null)}
                      className="text-[10px] text-rose-400 hover:text-rose-350 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 cursor-pointer"
                    >
                      <span>Clear Date Filter</span>
                      <LucideIcons.X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}
                {displayedEvents.length > 0 ? (
                  <div className="relative pl-4 border-l border-slate-800 space-y-4 max-h-[380px] overflow-y-auto pr-1">
                    {displayedEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((e) => {
                      const ratingVal = e.rating || 0;
                      const ratingColor = ratingVal >= 8 ? 'text-emerald-400' : ratingVal >= 6 ? 'text-blue-400' : ratingVal >= 4 ? 'text-amber-400' : 'text-rose-400';
                      const ratingBg = ratingVal >= 8 ? 'bg-emerald-500/8' : ratingVal >= 6 ? 'bg-blue-500/8' : ratingVal >= 4 ? 'bg-amber-500/8' : 'bg-rose-500/8';
                      const ratingBorder = ratingVal >= 8 ? 'border-emerald-500/20' : ratingVal >= 6 ? 'border-blue-500/20' : ratingVal >= 4 ? 'border-amber-500/20' : 'border-rose-500/20';
                      const ratingGlow = ratingVal >= 8 ? 'shadow-emerald-500/10' : ratingVal >= 6 ? 'shadow-blue-500/10' : ratingVal >= 4 ? 'shadow-amber-500/10' : 'shadow-rose-500/10';
                      
                      return (
                        <div key={e.id} className="relative group">
                          <span className={`absolute -left-[21px] top-5 w-2.5 h-2.5 rounded-full bg-slate-950 border-2 ${
                            e.type === 'Symptom' ? 'border-rose-500' : 'border-indigo-400'
                          }`} />
                          
                          <div className={`flex items-stretch gap-0 ${ratingBg} border ${ratingBorder} rounded-2xl overflow-hidden shadow-sm ${ratingGlow} transition-all hover:shadow-md`}>
                            {/* HERO RATING - large, bold, dominant */}
                            <div className={`flex flex-col items-center justify-center px-4 py-3 min-w-[72px] border-r ${ratingBorder}`}>
                              <span className={`text-2xl font-black font-mono leading-none ${ratingColor}`}>
                                {ratingVal || '—'}
                              </span>
                              <span className="text-[9px] font-bold text-slate-500 mt-0.5">/10</span>
                            </div>
                            
                            {/* Content side */}
                            <div className="flex-grow py-2.5 px-3 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="text-[11px] font-semibold text-slate-300 leading-snug truncate">{e.title}</h4>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-[8px] font-mono text-slate-500">{e.date}{e.time && ` @ ${e.time}`}</span>
                                  <button
                                    type="button"
                                    onClick={() => deleteEvent(e.id)}
                                    className="text-slate-700 hover:text-rose-450 opacity-0 group-hover:opacity-100 transition-all p-0.5 cursor-pointer"
                                    title="Delete note"
                                  >
                                    <LucideIcons.Trash className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                              
                              {/* Inline tags */}
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                                  e.type === 'Symptom' ? 'bg-rose-500/10 text-rose-400' : 'bg-indigo-500/10 text-indigo-400'
                                }`}>
                                  {e.type}
                                </span>
                                {e.severity && (
                                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                                    e.severity === 'Severe' ? 'bg-rose-500/10 text-rose-400' :
                                    e.severity === 'Moderate' ? 'bg-amber-500/10 text-amber-400' :
                                    'bg-emerald-500/10 text-emerald-400'
                                  }`}>
                                    {e.severity}
                                  </span>
                                )}
                              </div>

                              {/* Details Toggle */}
                              <button
                                type="button"
                                onClick={() => toggleEventExpand(e.id)}
                                className="text-[9px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-0.5 transition-colors mt-1.5 cursor-pointer"
                              >
                                <span>{expandedEventIds[e.id] ? 'Hide' : 'Details'}</span>
                                <LucideIcons.ChevronDown className={`w-3 h-3 transition-transform duration-200 ${expandedEventIds[e.id] ? 'rotate-180' : ''}`} />
                              </button>

                              {/* Collapsible Details */}
                              {expandedEventIds[e.id] && (
                                <div className="pt-2 mt-1.5 border-t border-slate-800/40 text-[11px] text-slate-400 animate-fade-in">
                                  <p className="leading-relaxed">{e.description}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-550">No wellness logs entered yet.</p>
                )}
              </div>
            )}
          </div>

          {/* Card 3: Target Wellness Goals */}
          <div className="glass-panel rounded-2xl border border-slate-800/60 overflow-hidden">
            <button
              type="button"
              onClick={() => setIsGoalsExpanded(!isGoalsExpanded)}
              className="w-full flex items-center justify-between p-4 text-left font-display font-semibold text-sm text-slate-200 hover:text-white transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <LucideIcons.Target className="w-4 h-4 text-slate-400" />
                <span>Target Wellness Goals</span>
              </span>
              <LucideIcons.ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isGoalsExpanded ? 'rotate-180' : ''}`} />
            </button>

            {isGoalsExpanded && (
              <div className="p-5 border-t border-slate-800/40 space-y-4 animate-fade-in bg-slate-900/10">
                {systemGoals.length > 0 ? (
                  <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                    {systemGoals.map((goal) => (
                      <div key={goal.id} className="p-3 bg-slate-900/40 border border-slate-800 rounded-xl flex items-start justify-between gap-3 group">
                        <div className="space-y-1 flex-grow">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const nextStatus = 
                                  goal.status === 'In Progress' ? 'Achieved' : 
                                  goal.status === 'Achieved' ? 'Stalled' : 'In Progress';
                                updateGoal({ ...goal, status: nextStatus });
                              }}
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                                goal.status === 'Achieved' 
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                  : goal.status === 'Stalled' 
                                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                                  : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                              }`}
                            >
                              {goal.status}
                            </button>
                            <span className="text-[9px] font-mono text-slate-500">Target: {goal.targetDate}</span>
                          </div>
                          <span className={`text-xs font-semibold text-slate-200 block ${goal.status === 'Achieved' ? 'line-through text-slate-500' : ''}`}>
                            {goal.title}
                          </span>
                          {goal.metricTarget && (
                            <span className="inline-block text-[9px] text-indigo-300 bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10">
                              Target Rating: {goal.metricTarget.replace('Rating: ', '')}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteGoal(goal.id)}
                          className="text-slate-600 hover:text-rose-455 opacity-0 group-hover:opacity-100 transition-all p-1 cursor-pointer"
                          title="Remove goal"
                        >
                          <LucideIcons.Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No wellness goals set yet.</p>
                )}

                {/* Goal with target ratings form */}
                <form onSubmit={handleAddSimpleGoal} className="space-y-2 pt-2 border-t border-slate-800/40">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Set Target Rating Goal</span>
                  <input
                    type="text"
                    placeholder="Goal description (e.g. Feel fully rested)"
                    value={simpleGoalTitle}
                    onChange={(e) => setSimpleGoalTitle(e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500 text-slate-200"
                    required
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={simpleGoalDate}
                      onChange={(e) => setSimpleGoalDate(e.target.value)}
                      className="bg-slate-900/60 border border-slate-800 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 text-slate-450"
                      required
                    />
                    <div className="flex gap-2">
                      <select
                        value={simpleGoalRating}
                        onChange={(e) => setSimpleGoalRating(e.target.value)}
                        className="flex-grow bg-slate-900/60 border border-slate-800 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 text-slate-400"
                      >
                        {Array.from({ length: 10 }).map((_, idx) => (
                          <option key={idx + 1} value={idx + 1}>
                            Target: {idx + 1}/10
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="px-3 rounded-lg bg-indigo-650 hover:bg-indigo-550 text-white transition-colors cursor-pointer"
                      >
                        <LucideIcons.Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>

        </div>

      ) : (

        /* ADVANCED / PRECISION MODE DETAIL MODULES */
        <div className="space-y-4 animate-fade-in">
          
          {/* Detailed Calculations Instruction Box at the top */}
          <div className="bg-indigo-950/20 border border-indigo-900/30 rounded-2xl p-4 flex gap-3 text-xs leading-relaxed text-indigo-300">
            <LucideIcons.Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-100 font-semibold mb-0.5">How Precision Scoring Works</strong>
              <p className="text-slate-350">
                Your Bio-Score is calculated from average habit adherence (40%), vital log thresholds (40%), and recent symptoms logged in the last 14 days (-20% maximum deduction). You can customize and log parameters in each section below.
              </p>
            </div>
          </div>

          {/* Card 1: Vitals & Biometrics Logs */}
          <div className="glass-panel rounded-2xl border border-slate-800/60 overflow-hidden">
            <button
              type="button"
              onClick={() => setIsVitalsExpanded(!isVitalsExpanded)}
              className="w-full flex items-center justify-between p-4 text-left font-display font-semibold text-sm text-slate-200 hover:text-white transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <LucideIcons.HeartPulse className="w-4 h-4 text-slate-400" />
                <span>Vitals & Biometrics Logs</span>
              </span>
              <LucideIcons.ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isVitalsExpanded ? 'rotate-180' : ''}`} />
            </button>

            {isVitalsExpanded && (
              <div className="p-5 border-t border-slate-800/40 space-y-4 animate-fade-in bg-slate-900/10">
                {/* List log */}
                {systemMetrics.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-40 overflow-y-auto pr-1">
                    {systemMetrics.map((log) => (
                      <div key={log.id} className="bg-slate-900/40 border border-slate-800 rounded-xl p-3 flex justify-between items-center group">
                        <div>
                          <span className="text-[10px] text-slate-500 font-mono block">{log.timestamp}</span>
                          <span className="text-xs font-semibold text-slate-200">{log.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm font-bold text-slate-100">
                            {log.value} <span className="text-[10px] text-slate-405 font-normal">{log.unit}</span>
                          </span>
                          <button 
                            type="button"
                            onClick={() => deleteMetricLog(log.id)}
                            className="text-slate-600 hover:text-rose-455 opacity-0 group-hover:opacity-100 transition-all p-1 cursor-pointer"
                            title="Delete log"
                          >
                            <LucideIcons.Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-2">No metric logs registered for this system.</p>
                )}

                {/* Inline logging form */}
                <form onSubmit={handleAddMetric} className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/40">
                  <input
                    type="text"
                    placeholder="Metric Name (e.g. BP)"
                    value={newMetricName}
                    onChange={(e) => setNewMetricName(e.target.value)}
                    className="sm:col-span-2 bg-slate-900/60 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500 text-slate-200"
                    required
                  />
                  <input
                    type="number"
                    step="any"
                    placeholder="Value"
                    value={newMetricVal}
                    onChange={(e) => setNewMetricVal(e.target.value)}
                    className="bg-slate-900/60 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500 text-slate-200"
                    required
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Unit"
                      value={newMetricUnit}
                      onChange={(e) => setNewMetricUnit(e.target.value)}
                      className="w-16 bg-slate-900/60 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500 text-slate-200"
                      required
                    />
                    <button
                      type="submit"
                      className="flex-grow flex items-center justify-center p-1.5 rounded-lg bg-indigo-650 hover:bg-indigo-555 text-white text-xs transition-colors cursor-pointer"
                    >
                      <LucideIcons.Plus className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Card 2: Medical Events & History */}
          <div className="glass-panel rounded-2xl border border-slate-800/60 overflow-hidden">
            <button
              type="button"
              onClick={() => setIsMedHistoryExpanded(!isMedHistoryExpanded)}
              className="w-full flex items-center justify-between p-4 text-left font-display font-semibold text-sm text-slate-200 hover:text-white transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <LucideIcons.FileText className="w-4 h-4 text-slate-400" />
                <span>Medical Events & History</span>
              </span>
              <LucideIcons.ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isMedHistoryExpanded ? 'rotate-180' : ''}`} />
            </button>

            {isMedHistoryExpanded && (
              <div className="p-5 border-t border-slate-800/40 space-y-4 animate-fade-in bg-slate-900/10">
                {selectedLogDate && (
                  <div className="flex items-center justify-between bg-indigo-950/20 border border-indigo-900/30 p-2.5 rounded-xl mb-3 text-xs">
                    <span className="text-slate-350">
                      Showing logs for date: <strong className="text-slate-100">{selectedLogDate}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedLogDate(null)}
                      className="text-[10px] text-rose-400 hover:text-rose-350 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 cursor-pointer"
                    >
                      <span>Clear Date Filter</span>
                      <LucideIcons.X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}
                {displayedEvents.length > 0 ? (
                  <div className="relative pl-4 border-l border-slate-800 space-y-5 max-h-[300px] overflow-y-auto pr-1">
                    {displayedEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((e) => (
                      <div key={e.id} className="relative group">
                        <span className={`absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-950 border-2 ${
                          e.type === 'Symptom' ? 'border-rose-500' :
                          e.type === 'Diagnosis' ? 'border-amber-500' :
                          e.type === 'Surgery' ? 'border-violet-500' : 'border-indigo-405'
                        }`} />
                        
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-mono text-slate-500">{e.date}</span>
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-400">
                                {e.type}
                              </span>
                              {e.severity && (
                                <span className={`text-[8px] font-bold px-1 rounded ${
                                  e.severity === 'Severe' ? 'bg-rose-500/10 text-rose-400 border-rose-500/10' :
                                  e.severity === 'Moderate' ? 'bg-amber-500/10 text-amber-400 border-amber-500/10' :
                                  'bg-emerald-500/10 text-emerald-400 border-emerald-500/10'
                                }`}>
                                  {e.severity}
                                </span>
                              )}
                            </div>
                            <h4 className="text-xs font-bold text-slate-200 mt-1">{e.title}</h4>
                            <p className="text-xs text-slate-455 mt-1 leading-relaxed">{e.description}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => deleteEvent(e.id)}
                            className="text-slate-605 hover:text-rose-405 opacity-0 group-hover:opacity-100 transition-all p-1 cursor-pointer"
                            title="Delete event"
                          >
                            <LucideIcons.Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-550">No medical events logged for this system.</p>
                )}
              </div>
            )}
          </div>

          {/* Card 3: Protective Habits / Protocols */}
          <div className="glass-panel rounded-2xl border border-slate-800/60 overflow-hidden">
            <button
              type="button"
              onClick={() => setIsHabitsExpanded(!isHabitsExpanded)}
              className="w-full flex items-center justify-between p-4 text-left font-display font-semibold text-sm text-slate-200 hover:text-white transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <LucideIcons.Activity className="w-4 h-4 text-slate-400" />
                <span>Protective Habits / Protocols</span>
              </span>
              <LucideIcons.ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isHabitsExpanded ? 'rotate-180' : ''}`} />
            </button>

            {isHabitsExpanded && (
              <div className="p-5 border-t border-slate-800/40 space-y-4 animate-fade-in bg-slate-900/10">
                {/* List */}
                {systemHabits.length > 0 ? (
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                    {systemHabits.map((habit) => (
                      <div 
                        key={habit.id} 
                        className={`p-3.5 rounded-xl border transition-all ${
                          habit.isActive 
                            ? 'bg-slate-900/40 border-slate-800' 
                            : 'bg-slate-950/20 border-slate-900 opacity-50'
                        }`}
                      >
                        <div className="flex justify-between items-center gap-2">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggleHabitActive(habit.id)}
                              className={`p-1 rounded-md transition-colors cursor-pointer ${
                                habit.isActive 
                                  ? 'text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20' 
                                  : 'text-slate-650 bg-slate-900 hover:bg-slate-850'
                              }`}
                              title={habit.isActive ? "Deactivate habit" : "Activate habit"}
                            >
                              {habit.isActive ? (
                                <LucideIcons.CheckSquare className="w-4 h-4" />
                              ) : (
                                <LucideIcons.Square className="w-4 h-4" />
                              )}
                            </button>
                            <div>
                              <span className="text-xs font-semibold text-slate-200 block leading-tight">
                                {habit.name}
                              </span>
                              <span className="text-[9px] text-slate-500 uppercase tracking-wider font-mono">
                                {habit.frequency}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => deleteHabit(habit.id)}
                            className="text-slate-600 hover:text-rose-455 transition-colors p-1 cursor-pointer"
                            title="Remove habit"
                          >
                            <LucideIcons.X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Adherence Slider */}
                        {habit.isActive && (
                          <div className="mt-3.5 pt-2 border-t border-slate-900/60 flex items-center gap-3">
                            <span className="text-[10px] text-slate-400 font-mono w-8">Adhere:</span>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={habit.adherence}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                updateHabitAdherence(habit.id, val);
                                playSliderSound(Math.round(val / 10));
                              }}
                              className="flex-grow accent-indigo-500 h-1 rounded-lg cursor-pointer bg-slate-800"
                            />
                            <span className="text-xs font-mono font-bold text-slate-300 w-10 text-right">
                              {habit.adherence}%
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-550">No protective habits defined. Add one below!</p>
                )}

                {/* Quick add Habit */}
                <form onSubmit={handleAddHabit} className="flex gap-2 pt-3 border-t border-slate-800/40">
                  <input
                    type="text"
                    placeholder="Log supplement, cardio frequency..."
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                    className="flex-grow bg-slate-900/60 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500 text-slate-200"
                    required
                  />
                  <select
                    value={newHabitFreq}
                    onChange={(e: any) => setNewHabitFreq(e.target.value)}
                    className="bg-slate-900/60 border border-slate-800 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-indigo-500 text-slate-455"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="As Needed">As Needed</option>
                  </select>
                  <button
                    type="submit"
                    className="p-1.5 rounded-lg bg-indigo-650 hover:bg-indigo-555 text-white transition-colors cursor-pointer"
                    title="Add habit"
                  >
                    <LucideIcons.Plus className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Card 4: Health Goals */}
          <div className="glass-panel rounded-2xl border border-slate-800/60 overflow-hidden">
            <button
              type="button"
              onClick={() => setIsPrecisionGoalsExpanded(!isPrecisionGoalsExpanded)}
              className="w-full flex items-center justify-between p-4 text-left font-display font-semibold text-sm text-slate-200 hover:text-white transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <LucideIcons.Target className="w-4 h-4 text-slate-400" />
                <span>Health Goals</span>
              </span>
              <LucideIcons.ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isPrecisionGoalsExpanded ? 'rotate-180' : ''}`} />
            </button>

            {isPrecisionGoalsExpanded && (
              <div className="p-5 border-t border-slate-800/40 space-y-4 animate-fade-in bg-slate-900/10">
                {systemGoals.length > 0 ? (
                  <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                    {systemGoals.map((goal) => (
                      <div key={goal.id} className="p-3 bg-slate-900/40 border border-slate-800 rounded-xl flex items-start justify-between gap-3 group">
                        <div className="space-y-1 flex-grow">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const nextStatus = 
                                  goal.status === 'In Progress' ? 'Achieved' : 
                                  goal.status === 'Achieved' ? 'Stalled' : 'In Progress';
                                updateGoal({ ...goal, status: nextStatus });
                              }}
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                                goal.status === 'Achieved' 
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                  : goal.status === 'Stalled' 
                                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                                  : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                              }`}
                            >
                              {goal.status}
                            </button>
                            <span className="text-[9px] font-mono text-slate-500">Target: {goal.targetDate}</span>
                          </div>
                          <span className={`text-xs font-semibold text-slate-200 block ${goal.status === 'Achieved' ? 'line-through text-slate-500' : ''}`}>
                            {goal.title}
                          </span>
                          {goal.metricTarget && (
                            <span className="inline-block text-[9px] text-slate-405 bg-slate-850 px-1.5 py-0.5 rounded border border-slate-800">
                              Target Param: {goal.metricTarget}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteGoal(goal.id)}
                          className="text-slate-605 hover:text-rose-405 opacity-0 group-hover:opacity-100 transition-all p-1 cursor-pointer"
                          title="Remove goal"
                        >
                          <LucideIcons.Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-550">No goals set yet.</p>
                )}

                {/* Quick add Goal */}
                <form onSubmit={handleAddGoal} className="space-y-2 pt-2 border-t border-slate-800/40">
                  <input
                    type="text"
                    placeholder="Goal title (e.g. Reduce BP to normal)"
                    value={newGoalTitle}
                    onChange={(e) => setNewGoalTitle(e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500 text-slate-200"
                    required
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={newGoalDate}
                      onChange={(e) => setNewGoalDate(e.target.value)}
                      className="bg-slate-900/60 border border-slate-800 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 text-slate-450"
                      required
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Target (e.g. <120)"
                        value={newGoalMetric}
                        onChange={(e) => setNewGoalMetric(e.target.value)}
                        className="flex-grow bg-slate-900/60 border border-slate-800 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 text-slate-200"
                      />
                      <button
                        type="submit"
                        className="px-3 rounded-lg bg-indigo-650 hover:bg-indigo-550 text-white transition-colors cursor-pointer"
                      >
                        <LucideIcons.Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>

        </div>
      )}
      </div>
    </div>
  );
};
