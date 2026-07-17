import React, { useState, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { InteractiveBodyMap } from '../components/InteractiveBodyMap';
import { EventModal } from '../components/EventModal';

interface DashboardProps {
  onNavigateToSystem: (systemId: string) => void;
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

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateToSystem }) => {
  const {
    systems,
    events,
    habits,
    goals,
    metrics,
    logSystemRating,
    togglePrecisionMode,
    updateSystemDescription,
    resetAllData,
    startTrackingSystem,
    archiveSystem,
    deleteSystemData,
    userName
  } = useDashboard();

  // Find the first tracked system to default-initialize selection
  const [selectedSystemId, setSelectedSystemId] = useState<string>(() => {
    const firstTracked = systems.find(s => s.isTracking);
    return firstTracked ? firstTracked.id : 'respiratory';
  });

  const selectedSystem = systems.find(s => s.id === selectedSystemId) || systems[0];
  const trackedSystems = systems.filter(s => s.isTracking);
  const trackedSystemIds = new Set(trackedSystems.map(s => s.id));
  
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  
  // State to manage toggle of top-right header menu options
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);

  // States to manage Description edits/additions
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [tempDesc, setTempDesc] = useState('');

  // Ratings log slider and custom date/time states
  const [dashRating, setDashRating] = useState<number>(8);
  const [customLogDate, setCustomLogDate] = useState<string>('2026-07-17');
  const [customLogTime, setCustomLogTime] = useState<string>('12:00');
  const [showCustomDateTime, setShowCustomDateTime] = useState<boolean>(false);

  // Conscious Delete Verification State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [systemIdToDelete, setSystemIdToDelete] = useState<string | null>(null);

  // Reset editing states and sync rating/time states on system selection changes
  useEffect(() => {
    setIsEditingDesc(false);
    setTempDesc(selectedSystem.description);
    setDashRating(selectedSystem.subjectiveRating);
    setIsMoreOpen(false);
    
    // Set time default to current local hour & minutes
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setCustomLogTime(timeStr);
    setCustomLogDate('2026-07-17'); // seed date anchor
    setShowCustomDateTime(false);
  }, [selectedSystemId, selectedSystem]);

  // Overall Statistics calculated on tracked systems only
  const avgHealthScore = trackedSystems.length > 0
    ? Math.round(trackedSystems.reduce((acc, sys) => acc + sys.score, 0) / trackedSystems.length)
    : 0;

  const activeHabits = habits.filter((h) => h.isActive && trackedSystemIds.has(h.systemId));
  const avgAdherence = activeHabits.length > 0 
    ? Math.round(activeHabits.reduce((acc, h) => acc + h.adherence, 0) / activeHabits.length) 
    : 100;
  
  const activeSymptoms = events.filter((e) => e.type === 'Symptom' && trackedSystemIds.has(e.systemId)).length;

  // Selected system stats
  const sysHabitsCount = habits.filter(h => h.systemId === selectedSystem.id && h.isActive).length;
  const sysMetricsCount = metrics.filter(m => m.systemId === selectedSystem.id).length;
  const sysGoalsCount = goals.filter(g => g.systemId === selectedSystem.id && g.status === 'In Progress').length;

  const handleSystemClickFromMap = (systemId: string) => {
    setSelectedSystemId(systemId);
  };

  const getRatingDescriptor = (rating: number) => {
    return RATING_LABELS[rating - 1] || 'Unknown';
  };

  // Color mapping by system ID
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

  const currentTheme = systemColors[selectedSystem.id] || { text: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', hex: '#818cf8' };

  const getIcon = (iconName: string, className = "w-5 h-5") => {
    const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.Heart;
    return <IconComponent className={className} />;
  };

  const openDeleteModal = (sysId: string) => {
    setSystemIdToDelete(sysId);
    setDeleteConfirmText('');
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (systemIdToDelete && deleteConfirmText === userName) {
      deleteSystemData(systemIdToDelete);
      setIsDeleteModalOpen(false);
      setSystemIdToDelete(null);
      // Select another system that is active
      const remainingTracked = systems.filter(s => s.isTracking && s.id !== systemIdToDelete);
      if (remainingTracked.length > 0) {
        setSelectedSystemId(remainingTracked[0].id);
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-200">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-slate-100 m-0">
            Overview Dashboard
          </h1>
        </div>

        <div className="relative">
          <button
            onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}
            className="flex items-center justify-center p-2.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-850 hover:text-white transition-all text-slate-400 cursor-pointer"
            title="More Options"
          >
            <LucideIcons.MoreHorizontal className="w-5 h-5" />
          </button>

          {isHeaderMenuOpen && (
            <>
              {/* Invisible Backdrop to close on click outside */}
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setIsHeaderMenuOpen(false)} 
              />
              
              {/* Dropdown Menu Container */}
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-800 bg-slate-950 p-2 shadow-2xl z-20 animate-fade-in space-y-1">
                {/* 1. Daily Status / Precision Vitals (only if active system is tracked) */}
                {selectedSystem.isTracking && (
                  <div className="p-1 border-b border-slate-900 pb-1.5 mb-1.5">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-2 block mb-1">
                      Tracking Mode
                    </span>
                    <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-850">
                      <button
                        type="button"
                        onClick={() => {
                          togglePrecisionMode(selectedSystem.id, false);
                          setIsHeaderMenuOpen(false);
                        }}
                        className={`flex-1 py-1 text-[9px] font-bold rounded-md transition-all ${
                          !selectedSystem.precisionEnabled
                            ? 'bg-slate-800 border border-slate-700/60 text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-350'
                        }`}
                      >
                        Daily Status
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          togglePrecisionMode(selectedSystem.id, true);
                          setIsHeaderMenuOpen(false);
                        }}
                        className={`flex-1 py-1 text-[9px] font-bold rounded-md transition-all ${
                          selectedSystem.precisionEnabled
                            ? 'bg-indigo-650 text-white shadow-md'
                            : 'text-slate-500 hover:text-slate-355'
                        }`}
                      >
                        Precision Vitals
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. Log Event Button */}
                <button
                  onClick={() => {
                    setIsLogOpen(true);
                    setIsHeaderMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900/50 transition-colors cursor-pointer"
                >
                  <LucideIcons.PlusCircle className="w-4 h-4 text-indigo-400" />
                  <span>Log Event</span>
                </button>

                {/* 3. Reset Demo Data Button */}
                <button
                  onClick={() => {
                    setIsHeaderMenuOpen(false);
                    if (window.confirm("Are you sure you want to restore default seed data? This will reset all current changes.")) {
                      resetAllData();
                    }
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-colors cursor-pointer"
                >
                  <LucideIcons.RotateCcw className="w-4 h-4 text-slate-550" />
                  <span>Reset Demo Data</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Overview stats on active/tracked systems only */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-panel rounded-xl p-3 border border-slate-900/50 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Avg Bio-Score</span>
          <span className="text-xl font-bold font-mono text-slate-200">{avgHealthScore}%</span>
        </div>
        <div className="glass-panel rounded-xl p-3 border border-slate-900/50 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Adherence</span>
          <span className="text-xl font-bold font-mono text-slate-200">{avgAdherence}%</span>
        </div>
        <div className="glass-panel rounded-xl p-3 border border-slate-900/50 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Symptoms</span>
          <span className="text-xl font-bold font-mono text-rose-455">{activeSymptoms}</span>
        </div>
      </div>

      {/* Main Content Layout: Spotlight on Interactive Body Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: FOCUS SHINE ON INTERACTIVE BODY MAP & QUICK WIDGET */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-12 gap-6 glass-panel rounded-3xl p-6 border border-slate-800/80">
          
          {/* Symmetrical silhouette */}
          <div className="md:col-span-6 flex justify-center">
            <div className="w-full max-w-[280px]">
              <InteractiveBodyMap 
                activeSystemId={selectedSystemId} 
                onSystemSelect={handleSystemClickFromMap} 
              />
            </div>
          </div>

          {/* Quick subjective rating widget & Segment Tab */}
          <div className="md:col-span-6 flex flex-col justify-between space-y-5 pt-4 md:pt-4 md:border-l md:border-slate-800/60 md:pl-6">
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${currentTheme.bg} ${currentTheme.text} border ${currentTheme.border}`}>
                  {getIcon(selectedSystem.iconName)}
                </div>
                <div>
                  <h3 className="font-display font-semibold text-sm md:text-base text-slate-100 leading-tight">
                    {selectedSystem.name}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                    {!selectedSystem.isTracking 
                      ? 'System Inactive'
                      : selectedSystem.precisionEnabled ? 'Tracking custom clinical biometrics' : 'Tracking daily subjective feeling'
                    }
                  </span>
                </div>
              </div>

              {!selectedSystem.isTracking ? (
                /* UNTRACKED STATE SPOTLIGHT CONTENT */
                <div className="space-y-4 py-4 animate-fade-in">
                  <div className="p-4 rounded-2xl border border-dashed border-slate-800 bg-slate-900/10 text-center space-y-3">
                    <LucideIcons.EyeOff className="w-8 h-8 text-slate-500 mx-auto" />
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {selectedSystem.name} is currently not actively tracked. You won't see its scores, event timelines, or goals on the live dashboard.
                    </p>
                    <button
                      onClick={() => startTrackingSystem(selectedSystem.id)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 mx-auto transition-colors shadow-md"
                    >
                      <LucideIcons.Plus className="w-4 h-4" />
                      <span>Start Tracking System</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* TRACKED STATE SPOTLIGHT CONTENT */
                <>

                  {/* RENDER MODE CONTENT */}
                  {!selectedSystem.precisionEnabled ? (
                    /* SUBJECTIVE MODE: SOOTHING ANDROID BRIGHTNESS STYLE RANGE SLIDER */
                    <div className="space-y-3.5 animate-fade-in pt-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                          How does it feel today?
                        </label>
                      </div>
                      
                      {/* Android-style Brightness slider track */}
                      <div className="relative w-full h-9 bg-slate-900 border border-slate-800 rounded-full overflow-hidden flex items-center shadow-inner group">
                        {/* Progress fill */}
                        <div
                          className="absolute left-0 top-0 bottom-0 transition-all duration-100 ease-out"
                          style={{
                            width: `${dashRating * 10}%`,
                            background: `linear-gradient(to right, ${currentTheme.hex}33, ${currentTheme.hex}bb)`,
                            boxShadow: `0 0 12px ${currentTheme.hex}33`
                          }}
                        />
                        
                        {/* Content display within track */}
                        <div className="absolute inset-0 flex items-center justify-between px-3.5 pointer-events-none select-none">
                          <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-350 transition-colors uppercase tracking-wider flex items-center gap-1.5">
                            <span className="text-sm">
                              {dashRating >= 9 ? '😄' : dashRating >= 7 ? '🙂' : dashRating >= 5 ? '😐' : dashRating >= 3 ? '😕' : '😞'}
                            </span>
                            <span>{getRatingDescriptor(dashRating)}</span>
                          </span>
                          <span 
                            className="text-xs font-black font-mono px-2 py-0.5 rounded-full border text-white transition-colors"
                            style={{
                              backgroundColor: '#0f172a',
                              borderColor: `${currentTheme.hex}44`
                            }}
                          >
                            {dashRating}/10
                          </span>
                        </div>

                        {/* Opaque slider on top */}
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={dashRating}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setDashRating(val);
                            playSliderSound(val);
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>

                      {/* Custom Time and Date inputs */}
                      {showCustomDateTime && (
                        <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-850 animate-fade-in">
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

                      {/* Log triggers & timer display */}
                      <div className="flex items-center justify-between gap-4 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowCustomDateTime(!showCustomDateTime)}
                          className="text-[10px] text-slate-500 hover:text-slate-350 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <LucideIcons.Clock className="w-3.5 h-3.5" />
                          <span>{showCustomDateTime ? "Use current time" : "Log for past date/time"}</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => {
                            logSystemRating(selectedSystem.id, dashRating, customLogDate, customLogTime);
                            alert(`Successfully logged ${selectedSystem.name} rating of ${dashRating}/10 for ${customLogDate} @ ${customLogTime}`);
                          }}
                          className="px-4 py-2 rounded-xl bg-indigo-650 hover:bg-indigo-550 text-white font-bold text-xs transition-colors shadow-md shadow-indigo-650/15 cursor-pointer"
                        >
                          Add
                        </button>
                      </div>

                    </div>
                  ) : (
                    /* PRECISION MODE SUMMARY & INSTRUCTIONS */
                    <div className="space-y-3.5 animate-fade-in">
                      
                      {/* Quick stats tags */}
                      <div className="flex flex-wrap gap-2">
                        <span className="text-[9px] font-semibold bg-slate-900 border border-slate-850 px-2 py-1 rounded-lg text-slate-300">
                          {sysHabitsCount} Active Habits
                        </span>
                        <span className="text-[9px] font-semibold bg-slate-900 border border-slate-850 px-2 py-1 rounded-lg text-slate-300">
                          {sysMetricsCount} Logged Vitals
                        </span>
                        <span className="text-[9px] font-semibold bg-slate-900 border border-slate-850 px-2 py-1 rounded-lg text-slate-300">
                          {sysGoalsCount} Active Goals
                        </span>
                      </div>

                      {/* Expandable instruction box */}
                      <div className="bg-indigo-950/15 border border-indigo-900/20 rounded-xl p-3 text-[11px] leading-relaxed text-indigo-300">
                        <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowInfo(!showInfo)}>
                          <span className="font-bold text-slate-200 flex items-center gap-1.5">
                            <LucideIcons.Info className="w-3.5 h-3.5 text-indigo-400" />
                            Scoring Calculations
                          </span>
                          <LucideIcons.ChevronDown className={`w-3.5 h-3.5 transition-transform ${showInfo ? 'rotate-180' : ''}`} />
                        </div>
                        {showInfo && (
                          <p className="text-slate-400 mt-2 animate-fade-in">
                            Precision mode maps average habit adherence (40%), vital log thresholds (40%), and subtracts points for active symptoms in the last 14 days (-20% maximum). Click <strong>Examine detailed logs & goals</strong> below to log metrics.
                          </p>
                        )}
                      </div>

                    </div>
                  )}

                  {/* Chevron toggle for secondary actions */}
                  <div className="flex justify-center pt-2">
                    <button
                      type="button"
                      onClick={() => setIsMoreOpen(!isMoreOpen)}
                      className="text-slate-600 hover:text-slate-400 transition-all cursor-pointer p-1"
                    >
                      <LucideIcons.ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isMoreOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {isMoreOpen && (
                    <div className="space-y-3 pt-2 animate-fade-in">
                      {/* Description Details */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Description Details</span>
                          {!isEditingDesc && (
                            <button
                              type="button"
                              onClick={() => {
                                setTempDesc(selectedSystem.description);
                                setIsEditingDesc(true);
                              }}
                              className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-0.5 transition-colors cursor-pointer"
                            >
                              <LucideIcons.Edit className="w-3 h-3" />
                              <span>Edit Details</span>
                            </button>
                          )}
                        </div>
                        {isEditingDesc ? (
                          <div className="space-y-2 animate-fade-in">
                            <textarea
                              value={tempDesc}
                              onChange={(e) => setTempDesc(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
                              rows={3}
                              placeholder="Log custom descriptions or details for this parameter..."
                            />
                            <div className="flex justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setIsEditingDesc(false)}
                                className="px-2 py-1 rounded-md text-[10px] border border-slate-850 hover:bg-slate-850 text-slate-400 cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  updateSystemDescription(selectedSystem.id, tempDesc);
                                  setIsEditingDesc(false);
                                }}
                                className="px-2.5 py-1 rounded-md text-[10px] bg-indigo-650 hover:bg-indigo-550 text-white font-bold cursor-pointer"
                              >
                                Save Details
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 leading-relaxed font-sans">
                            {selectedSystem.description || "No custom details entered. Click Edit Details to add."}
                          </p>
                        )}
                      </div>

                      {/* Examine detailed logs & goals */}
                      <button
                        onClick={() => onNavigateToSystem(selectedSystem.id)}
                        className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-855 border border-slate-800 text-slate-200 hover:text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <span>Examine detailed logs & goals</span>
                        <LucideIcons.ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      {/* Archive / Delete operations */}
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => archiveSystem(selectedSystem.id)}
                          className="flex-1 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800/40 text-slate-455 hover:text-slate-350 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          title="Move back to inactive tracking. No data is lost."
                        >
                          <LucideIcons.Archive className="w-3.5 h-3.5" />
                          <span>Archive Track</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(selectedSystem.id)}
                          className="flex-1 py-1.5 rounded-lg border border-rose-955/20 bg-rose-955/5 hover:bg-rose-955/20 text-rose-455 hover:text-rose-400 text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                          title="Permanently erase all historical event logs and score history."
                        >
                          <LucideIcons.Trash2 className="w-3.5 h-3.5" />
                          <span>Delete & Wipe Data</span>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

          </div>

        </div>
      </div>

        {/* RIGHT COLUMN: QUICK STATUS DIRECTORY */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Section 1: Live Tracking */}
          <div className="space-y-3">
            <h2 className="font-display font-semibold text-xs text-slate-455 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Tracking ({trackedSystems.length})
            </h2>
            
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {trackedSystems.map((sys) => {
                const theme = systemColors[sys.id] || { text: 'text-slate-455', bg: 'bg-slate-800' };
                const isSelected = selectedSystemId === sys.id;
                
                return (
                  <div
                    key={sys.id}
                    onClick={() => setSelectedSystemId(sys.id)}
                    className={`p-3 rounded-2xl cursor-pointer border transition-all flex items-center justify-between ${
                      isSelected 
                        ? 'bg-slate-900/60 border-slate-700/60 shadow-lg' 
                        : 'bg-slate-955/20 border-slate-900/50 hover:bg-slate-900/20 hover:border-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${theme.bg} ${theme.text}`}>
                        {getIcon(sys.iconName, "w-4 h-4")}
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-200">{sys.name}</h4>
                        <span className="text-[9px] text-slate-550 block leading-tight font-mono">
                          {sys.precisionEnabled 
                            ? 'Vitals Active' 
                            : `Score: ${sys.subjectiveRating}/10`
                          }
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-200">
                          {sys.score}%
                        </span>
                        <div className="w-1.5 h-6 rounded-full bg-slate-800 relative overflow-hidden shrink-0">
                          <div 
                            className={`absolute bottom-0 left-0 right-0`}
                            style={{
                              height: `${sys.score}%`,
                              backgroundColor: theme.hex
                            }}
                          />
                        </div>
                      </div>

                      {/* Direct detail page entry button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateToSystem(sys.id);
                        }}
                        className="p-1 rounded-lg text-slate-500 hover:text-slate-250 hover:bg-slate-800/70 border border-transparent hover:border-slate-750 transition-colors cursor-pointer shrink-0"
                        title={`Go to ${sys.name} Details`}
                      >
                        <LucideIcons.ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* CONSCIOUS DELETE VERIFICATION MODAL OVERLAY */}
      {isDeleteModalOpen && systemIdToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <LucideIcons.AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-slate-100">
                Conscious Data Deletion
              </h3>
            </div>

            <div className="text-xs text-slate-400 space-y-2 leading-relaxed">
              <p>
                You are about to permanently delete <strong className="text-slate-200">all logged events, biometrics, goals, and historic trend scores</strong> for the <strong className="text-slate-100">{systems.find(s => s.id === systemIdToDelete)?.name} System</strong>.
              </p>
              <p className="bg-rose-955/20 border border-rose-900/30 p-2.5 rounded-xl text-rose-300 font-semibold">
                ⚠️ This action is irreversible. All related files and database history logs will be destroyed.
              </p>
              <p>
                To consciously confirm this, please type your profile name <strong className="text-indigo-400 select-all">{userName}</strong> below:
              </p>
            </div>

            <input
              type="text"
              placeholder={`Type "${userName}" to confirm`}
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-rose-500 font-mono"
            />

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-850 text-slate-450 hover:text-slate-350 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmText !== userName}
                onClick={confirmDelete}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5
                  ${deleteConfirmText === userName
                    ? 'bg-rose-600 hover:bg-rose-500 text-white cursor-pointer shadow-lg shadow-rose-600/10'
                    : 'bg-slate-955 border border-slate-855 text-slate-600 cursor-not-allowed'
                  }
                `}
              >
                <LucideIcons.Trash className="w-3.5 h-3.5" />
                <span>Wipe System Data</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <EventModal
        isOpen={isLogOpen}
        onClose={() => setIsLogOpen(false)}
        defaultSystemId={selectedSystemId}
      />
    </div>
  );
};
