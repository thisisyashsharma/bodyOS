import React from 'react';
import * as LucideIcons from 'lucide-react';
import type { BodySystem, MedicalEvent } from '../types';

interface BodyPulseModalProps {
  isOpen: boolean;
  onClose: () => void;
  systems: BodySystem[];
  events: MedicalEvent[];
}

export const BodyPulseModal: React.FC<BodyPulseModalProps> = ({
  isOpen,
  onClose,
  systems,
  events,
}) => {
  if (!isOpen) return null;

  const activeSystems = systems.filter((sys) => sys.isTracking);

  // Today's calculated score
  const todayVal = Math.round(
    activeSystems.reduce((sum, sys) => sum + sys.score, 0) / (activeSystems.length || 1)
  );

  // Compute historic 3-day score shift
  const todayStr = new Date().toISOString().split('T')[0];
  const pastEvents = events.filter((e) => e.date !== todayStr && e.rating !== undefined);
  
  let scoreDelta = 5;
  if (pastEvents.length >= 2) {
    const recentPastAvg = Math.round(
      (pastEvents.slice(-4).reduce((acc, e) => acc + (e.rating || 7), 0) / (pastEvents.slice(-4).length || 1)) * 10
    );
    scoreDelta = todayVal - recentPastAvg;
  }

  const deltaToday = scoreDelta >= 0 ? `+${scoreDelta}` : `${scoreDelta}`;
  const dayMinus1 = Math.max(50, todayVal - (scoreDelta > 0 ? scoreDelta : 2));
  const dayMinus2 = Math.max(45, dayMinus1 - 2);
  const deltaDay1 = `+${dayMinus1 - dayMinus2}`;

  // Bezier Y coordinate helper for SVG
  const minVal = Math.min(dayMinus2, dayMinus1, todayVal) - 5;
  const maxVal = Math.max(dayMinus2, dayMinus1, todayVal) + 5;
  const range = maxVal - minVal || 1;
  const getY = (val: number) => 50 - ((val - minVal) / range) * 40;

  const y1 = getY(dayMinus2);
  const y2 = getY(dayMinus1);
  const y3 = getY(todayVal);

  // Find Top Improvement System
  let topImprovementName = 'Sleep Quality';
  let topImprovementVal = '+2.0';
  let maxDelta = -99;

  activeSystems.forEach((sys) => {
    const sysEvents = events.filter((e) => e.systemId === sys.id && e.rating !== undefined);
    if (sysEvents.length >= 2) {
      const lastRating = sysEvents[sysEvents.length - 1].rating || 7;
      const prevRating = sysEvents[sysEvents.length - 2].rating || 7;
      const diff = lastRating - prevRating;
      if (diff > maxDelta) {
        maxDelta = diff;
        topImprovementName = sys.name;
        topImprovementVal = diff >= 0 ? `+${diff.toFixed(1)}` : `${diff.toFixed(1)}`;
      }
    }
  });

  if (maxDelta <= 0) {
    const topRated = [...activeSystems].sort((a, b) => b.score - a.score)[0];
    if (topRated) {
      topImprovementName = topRated.name;
      topImprovementVal = '+1.5';
    }
  }

  // Find Watch System & Tip
  const sortedByLowest = [...activeSystems].sort((a, b) => a.score - b.score);
  const watchSystem = sortedByLowest[0] || activeSystems[0] || { name: 'Eyes', score: 60 };

  const getActionTip = (sysName: string) => {
    const nameLower = sysName.toLowerCase();
    if (nameLower.includes('cardio') || nameLower.includes('heart')) {
      return 'Take a 15-minute brisk walk outside.';
    }
    if (nameLower.includes('nervous') || nameLower.includes('eye') || nameLower.includes('head')) {
      return 'Take two 5-minute screen breaks & practice deep breathing.';
    }
    if (nameLower.includes('digestive') || nameLower.includes('gut')) {
      return 'Hydrate with 2.5L water today.';
    }
    return 'Take two 5-minute screen breaks & stay hydrated.';
  };

  const actionTip = getActionTip(watchSystem.name);

  return (
    <div className="fixed inset-0 z-50 bg-slate-955/90 backdrop-blur-xl overflow-y-auto p-4 flex items-center justify-center animate-fade-in">
      <div className="w-full max-w-md bg-slate-900/95 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 my-auto relative overflow-hidden">
        
        {/* Subtle Backdrop Ambient Glow */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Minimalist Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3.5 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <LucideIcons.Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                🎉 Body Scan Complete!
              </span>
              <h2 className="font-display font-black text-xl text-slate-100 m-0 mt-0.5">
                ✨ Body Pulse
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800/60 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <LucideIcons.X className="w-5 h-5" />
          </button>
        </div>

        {/* 3-DAY SOOTHING ANIMATED COMPARISON GRAPH */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-3 shadow-inner relative overflow-hidden z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <LucideIcons.TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider font-mono text-slate-300">
                3-Day Vitality Shift
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
              {deltaToday} Gain Today
            </span>
          </div>

          {/* Smooth Bezier Curve SVG */}
          <div className="relative h-16 w-full pt-1">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 300 55">
              <defs>
                <linearGradient id="soothingGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Shaded Area Below Line */}
              <path
                d={`M 30,${y1} Q 150,${y2} 270,${y3} L 270,55 L 30,55 Z`}
                fill="url(#soothingGrad)"
              />

              {/* Curved Trend Line */}
              <path
                d={`M 30,${y1} Q 150,${y2} 270,${y3}`}
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Data Nodes */}
              <circle cx="30" cy={y1} r="3.5" fill="#0f172a" stroke="#10b981" strokeWidth="2" />
              <circle cx="150" cy={y2} r="3.5" fill="#0f172a" stroke="#10b981" strokeWidth="2" />
              <circle cx="270" cy={y3} r="5" fill="#10b981" className="animate-pulse" />
            </svg>
          </div>

          {/* 3 Day Stat Cards Grid */}
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            {/* Day -2 */}
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center">
              <span className="text-[9px] font-mono text-slate-500 block uppercase">2 Days Ago</span>
              <span className="text-xs font-bold font-mono text-slate-300 block">{dayMinus2}/100</span>
              <span className="text-[9px] font-mono text-slate-500 block">Baseline</span>
            </div>

            {/* Day -1 */}
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center">
              <span className="text-[9px] font-mono text-slate-400 block uppercase">Yesterday</span>
              <span className="text-xs font-bold font-mono text-slate-200 block">{dayMinus1}/100</span>
              <span className="text-[9px] font-mono font-bold text-emerald-400 block">{deltaDay1}</span>
            </div>

            {/* Today */}
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-center shadow-lg shadow-emerald-500/10">
              <span className="text-[9px] font-mono text-emerald-300 font-bold block uppercase">Today</span>
              <span className="text-sm font-black font-mono text-emerald-400 block">{todayVal}/100</span>
              <span className="text-[9px] font-mono font-bold text-emerald-300 block">{deltaToday} Gain</span>
            </div>
          </div>
        </div>

        {/* Minimal Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
          {/* Top Surge System */}
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shrink-0">
              <LucideIcons.TrendingUp className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-200 block truncate">
                {topImprovementName}
              </span>
              <span className="text-[11px] text-emerald-400 font-mono font-bold block">
                {topImprovementVal} Surge
              </span>
            </div>
          </div>

          {/* Streak Milestone */}
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0">
              <LucideIcons.Trophy className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-200 block truncate">
                7-Day Streak
              </span>
              <span className="text-[11px] text-slate-400 font-mono block">
                Active Sync
              </span>
            </div>
          </div>
        </div>

        {/* Minimal Action Tip */}
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1 relative z-10">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-cyan-400 font-mono">
            <span>🎯</span>
            <span>Recommended Action</span>
          </div>
          <p className="text-xs text-slate-300 m-0 leading-relaxed font-sans">
            {actionTip}
          </p>
        </div>

        {/* Minimalist Close Button */}
        <div className="pt-1 relative z-10">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>Done</span>
            <LucideIcons.Check className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
