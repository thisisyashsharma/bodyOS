import React, { useState } from 'react';
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

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateToSystem }) => {
  const {
    systems,
    events,
    habits,
    goals,
    metrics,
    updateSystemRating,
    togglePrecisionMode,
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
  
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // Conscious Delete Verification State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [systemIdToDelete, setSystemIdToDelete] = useState<string | null>(null);

  const selectedSystem = systems.find(s => s.id === selectedSystemId) || systems[0];

  const trackedSystems = systems.filter(s => s.isTracking);
  const untrackedSystems = systems.filter(s => !s.isTracking);
  const trackedSystemIds = new Set(trackedSystems.map(s => s.id));

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

  const getRatingColorClass = (rating: number) => {
    if (rating >= 9) return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';
    if (rating >= 7) return 'text-blue-400 border-blue-500/20 bg-blue-500/5';
    if (rating >= 5) return 'text-amber-400 border-amber-500/20 bg-amber-500/5';
    return 'text-rose-400 border-rose-500/20 bg-rose-500/5';
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

  // Helper to check if system has any history/data
  const systemHasData = (systemId: string) => {
    return events.some(e => e.systemId === systemId) ||
           habits.some(h => h.systemId === systemId) ||
           goals.some(g => g.systemId === systemId) ||
           metrics.some(m => m.systemId === systemId);
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-200">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-slate-100 m-0">
            BodyOS | Health Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Tap body parts to log status (1-10). Enable Advanced mode on demand.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (window.confirm("Are you sure you want to restore default seed data? This will reset all current changes.")) {
                resetAllData();
              }
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-800 bg-slate-900/30 hover:bg-slate-800/40 text-slate-400 hover:text-slate-300 text-xs font-semibold transition-colors"
          >
            <LucideIcons.RotateCcw className="w-4 h-4" />
            <span>Reset Demo Data</span>
          </button>
          
          <button
            onClick={() => setIsLogOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-650 hover:bg-indigo-555 text-white text-xs font-semibold transition-colors shadow-lg shadow-indigo-650/15"
          >
            <LucideIcons.PlusCircle className="w-4 h-4" />
            <span>Log Event</span>
          </button>
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
                  {/* SEGMENT TAB SWITCH FOR TRACKING MODE */}
                  <div className="flex bg-slate-900/60 p-1 rounded-xl border border-slate-850">
                    <button
                      type="button"
                      onClick={() => togglePrecisionMode(selectedSystem.id, false)}
                      className={`flex-1 py-1.5 text-center text-[10px] md:text-xs font-bold rounded-lg transition-all ${
                        !selectedSystem.precisionEnabled 
                          ? 'bg-slate-800 border border-slate-700/60 text-white shadow-sm' 
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      Daily Status (1-10)
                    </button>
                    <button
                      type="button"
                      onClick={() => togglePrecisionMode(selectedSystem.id, true)}
                      className={`flex-1 py-1.5 text-center text-[10px] md:text-xs font-bold rounded-lg transition-all ${
                        selectedSystem.precisionEnabled 
                          ? 'bg-indigo-650 text-white shadow-md' 
                          : 'text-slate-500 hover:text-slate-350'
                      }`}
                    >
                      Precision Vitals
                    </button>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {selectedSystem.description}
                  </p>

                  {/* RENDER MODE CONTENT */}
                  {!selectedSystem.precisionEnabled ? (
                    /* SUBJECTIVE MODE: 1-10 GRID */
                    <div className="space-y-2.5 animate-fade-in">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                        How does it feel today?
                      </label>
                      
                      <div className="grid grid-cols-5 gap-1.5 bg-slate-900/60 p-2.5 rounded-2xl border border-slate-850">
                        {Array.from({ length: 10 }).map((_, i) => {
                          const ratingValue = i + 1;
                          const isSelected = selectedSystem.subjectiveRating === ratingValue;
                          
                          return (
                            <button
                              key={ratingValue}
                              type="button"
                              onClick={() => updateSystemRating(selectedSystem.id, ratingValue)}
                              className={`aspect-square rounded-lg text-xs font-mono font-bold flex items-center justify-center transition-all ${
                                isSelected 
                                  ? 'bg-indigo-650 border border-indigo-500 scale-105 shadow-md shadow-indigo-650/20 text-white' 
                                  : 'bg-slate-950/40 border border-slate-900/60 text-slate-455 hover:text-slate-200 hover:border-slate-800'
                              }`}
                            >
                              {ratingValue}
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex justify-between items-center px-1 pt-0.5">
                        <span className={`text-[9px] font-semibold border px-2 py-0.5 rounded-md ${getRatingColorClass(selectedSystem.subjectiveRating)}`}>
                          Status: {getRatingDescriptor(selectedSystem.subjectiveRating)}
                        </span>
                        <span className="text-[9px] font-mono text-slate-500">
                          Score: {selectedSystem.score}%
                        </span>
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
                </>
              )}

            </div>

            {/* Actions Panel */}
            {selectedSystem.isTracking && (
              <div className="pt-4 border-t border-slate-800/60 space-y-2">
                <button
                  onClick={() => onNavigateToSystem(selectedSystem.id)}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 hover:text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>Examine detailed logs & goals</span>
                  <LucideIcons.ArrowRight className="w-3.5 h-3.5" />
                </button>

                {/* Archive / Delete operations */}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => archiveSystem(selectedSystem.id)}
                    className="flex-1 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800/40 text-slate-455 hover:text-slate-350 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                    title="Move back to inactive tracking. No data is lost."
                  >
                    <LucideIcons.Archive className="w-3.5 h-3.5" />
                    <span>Archive Track</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openDeleteModal(selectedSystem.id)}
                    className="flex-1 py-1.5 rounded-lg border border-rose-955/20 bg-rose-955/5 hover:bg-rose-955/20 text-rose-455 hover:text-rose-400 text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
                    title="Permanently erase all historical event logs and score history."
                  >
                    <LucideIcons.Trash2 className="w-3.5 h-3.5" />
                    <span>Delete & Wipe Data</span>
                  </button>
                </div>
              </div>
            )}

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
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Things User Wants to Track (Inactive/Plus Add) */}
          <div className="space-y-3">
            <h2 className="font-display font-semibold text-xs text-slate-455 uppercase tracking-widest flex items-center gap-1.5">
              <LucideIcons.Plus className="w-3.5 h-3.5 text-slate-400" />
              Add Systems to Track ({untrackedSystems.length})
            </h2>
            
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {untrackedSystems.length === 0 ? (
                <p className="text-[10px] text-slate-550 italic px-2 py-1">All systems are currently added to active tracking.</p>
              ) : (
                untrackedSystems.map((sys) => {
                  const isSelected = selectedSystemId === sys.id;
                  const hasHistory = systemHasData(sys.id);
                  
                  return (
                    <div
                      key={sys.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between group ${
                        isSelected
                          ? 'bg-slate-900/40 border-slate-800/80 shadow-md'
                          : 'bg-slate-955/10 border-slate-955/40 hover:bg-slate-900/10 hover:border-slate-850/60'
                      }`}
                    >
                      <div 
                        className="flex items-center gap-3 cursor-pointer flex-grow"
                        onClick={() => setSelectedSystemId(sys.id)}
                      >
                        <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-500 group-hover:text-slate-400 transition-colors">
                          {getIcon(sys.iconName, "w-4 h-4")}
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-slate-400 group-hover:text-slate-300 transition-colors flex items-center gap-1.5">
                            <span>{sys.name}</span>
                            {hasHistory && (
                              <span className="text-[8px] font-bold bg-blue-955 text-blue-400 border border-blue-900/20 px-1.5 py-0.2 rounded uppercase tracking-wider shrink-0 scale-95 origin-left">
                                Archived
                              </span>
                            )}
                          </h4>
                          <span className="text-[9px] text-slate-550 block leading-tight">
                            Tap to preview system details
                          </span>
                        </div>
                      </div>
                      
                      {/* Plus button to start tracking directly */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          startTrackingSystem(sys.id);
                        }}
                        className="p-2 rounded-xl bg-slate-900 hover:bg-indigo-650 border border-slate-850 text-slate-450 hover:text-white transition-all shadow-md active:scale-95 cursor-pointer ml-2"
                        title={`Start tracking ${sys.name}`}
                      >
                        <LucideIcons.Plus className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>

      {/* CONSCIOUS DELETE VERIFICATION MODAL OVERLAY */}
      {isDeleteModalOpen && systemIdToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
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
                className="flex-1 py-2.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-350 text-xs font-bold transition-colors cursor-pointer"
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
                    : 'bg-slate-950 border border-slate-850 text-slate-600 cursor-not-allowed'
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
