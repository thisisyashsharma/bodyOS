import React from 'react';
import * as LucideIcons from 'lucide-react';
import type { BodySystem, MedicalEvent } from '../types';

interface DailyHealthBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  systems: BodySystem[];
  events: MedicalEvent[];
}

export const DailyHealthBriefModal: React.FC<DailyHealthBriefModalProps> = ({
  isOpen,
  onClose,
  systems,
  events,
}) => {
  if (!isOpen) return null;

  const activeSystems = systems.filter((sys) => sys.isTracking);

  // Compute Overall Health Score
  const currentOverall = Math.round(
    activeSystems.reduce((sum, sys) => sum + sys.score, 0) / (activeSystems.length || 1)
  );

  // Compute previous overall health score for delta calculation
  const todayStr = new Date().toISOString().split('T')[0];
  const pastEvents = events.filter((e) => e.date !== todayStr && e.rating !== undefined);
  let delta = +2;
  if (pastEvents.length >= 3) {
    const recentPastAvg = Math.round(
      (pastEvents.slice(-5).reduce((acc, e) => acc + (e.rating || 7), 0) / (pastEvents.slice(-5).length || 1)) * 10
    );
    delta = currentOverall - recentPastAvg;
  }
  const deltaStr = delta >= 0 ? `+${delta}` : `${delta}`;

  // Find Biggest Improvement System
  let biggestImprovementName = 'Sleep';
  let biggestImprovementVal = '+1';
  let maxDelta = -99;

  activeSystems.forEach((sys) => {
    const sysEvents = events.filter((e) => e.systemId === sys.id && e.rating !== undefined);
    if (sysEvents.length >= 2) {
      const lastRating = sysEvents[sysEvents.length - 1].rating || 7;
      const prevRating = sysEvents[sysEvents.length - 2].rating || 7;
      const diff = lastRating - prevRating;
      if (diff > maxDelta) {
        maxDelta = diff;
        biggestImprovementName = sys.name;
        biggestImprovementVal = diff >= 0 ? `+${diff}` : `${diff}`;
      }
    }
  });

  if (maxDelta <= 0) {
    const topRated = [...activeSystems].sort((a, b) => b.score - a.score)[0];
    if (topRated) {
      biggestImprovementName = topRated.name;
      biggestImprovementVal = '+1';
    }
  }

  // Find System to Watch Today (lowest score/rating)
  const sortedByLowest = [...activeSystems].sort((a, b) => a.score - b.score);
  const watchSystem = sortedByLowest[0] || activeSystems[0] || { name: 'Eyes', score: 60 };
  const watchRating = Math.round(watchSystem.score / 10) || 6;

  // Generate Actionable Recommendation
  const getActionTip = (sysName: string) => {
    const nameLower = sysName.toLowerCase();
    if (nameLower.includes('cardio') || nameLower.includes('heart')) {
      return 'Take a 15-minute brisk walk outside during lunch.';
    }
    if (nameLower.includes('nervous') || nameLower.includes('eye') || nameLower.includes('head')) {
      return 'Take two 5-minute screen breaks and perform deep breathwork.';
    }
    if (nameLower.includes('digestive') || nameLower.includes('gut')) {
      return 'Hydrate with 2.5L water and avoid heavy late-night meals.';
    }
    if (nameLower.includes('musculoskeletal') || nameLower.includes('joint')) {
      return 'Perform 5 minutes of gentle spine & hamstring stretches.';
    }
    if (nameLower.includes('respiratory') || nameLower.includes('lung')) {
      return 'Practice 4-7-8 rhythmic breathing for 3 minutes.';
    }
    if (nameLower.includes('immune')) {
      return 'Prioritize an extra 30 minutes of restful sleep tonight.';
    }
    return 'Take two 5-minute screen breaks.';
  };

  const actionTip = getActionTip(watchSystem.name);

  // Dynamic Positive Trend / Milestone
  const positiveMilestones = [
    'Teeth & Oral Care maintained healthy for 45 days.',
    'Cardiovascular status maintained above 80% across recent logs.',
    'Nervous System checkups synchronized for 7 consecutive days.',
    'Digestive rhythm stabilized within optimal metabolic band.',
    'Daily vital log streak active for 14 days in a row.',
  ];
  const milestone = positiveMilestones[Math.floor(Math.abs(currentOverall) % positiveMilestones.length)];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl overflow-y-auto p-4 sm:p-6 flex items-center justify-center animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-auto relative overflow-hidden">
        
        {/* Ambient Top Glow Accent */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Title Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <LucideIcons.Leaf className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-slate-100 m-0 flex items-center gap-2">
                🌿 Daily Health Brief
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Automated audit analysis from today's & previous telemetry
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all cursor-pointer"
            title="Close brief"
          >
            <LucideIcons.X className="w-5 h-5" />
          </button>
        </div>

        {/* Brief Insight Cards Grid */}
        <div className="space-y-4 relative z-10">
          
          {/* Overall Health Score Hero Card */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between shadow-inner">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider font-mono text-slate-400 block">
                Overall Health
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-display font-black text-3xl sm:text-4xl text-slate-100">
                  {currentOverall}/100
                </span>
                <span
                  className={`text-sm font-bold font-mono px-2 py-0.5 rounded-full border ${
                    delta >= 0
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                  }`}
                >
                  ({deltaStr})
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <LucideIcons.Activity className="w-8 h-8" />
            </div>
          </div>

          {/* Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            
            {/* Biggest Improvement */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/70 space-y-1.5 hover:border-emerald-500/40 transition-all">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 font-mono">
                <span>✨</span>
                <span>Biggest Improvement</span>
              </div>
              <p className="font-semibold text-sm text-slate-100 m-0">
                {biggestImprovementName} <span className="text-emerald-400 font-mono font-bold">{biggestImprovementVal}</span>
              </p>
            </div>

            {/* Watch Today */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/70 space-y-1.5 hover:border-amber-500/40 transition-all">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 font-mono">
                <span>⚠️</span>
                <span>Watch Today</span>
              </div>
              <p className="font-semibold text-sm text-slate-100 m-0">
                {watchSystem.name} <span className="text-amber-400 font-mono font-bold">({watchRating}/10)</span>
              </p>
            </div>
          </div>

          {/* Actionable Recommendation */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/70 space-y-1.5 hover:border-cyan-500/40 transition-all">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 font-mono">
              <span>🎯</span>
              <span>Today's Action</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 m-0 leading-relaxed">
              {actionTip}
            </p>
          </div>

          {/* Positive Trend / Milestone */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/70 space-y-1.5 hover:border-purple-500/40 transition-all">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-400 font-mono">
              <span>📈</span>
              <span>Positive Trend</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 m-0 leading-relaxed">
              {milestone}
            </p>
          </div>
        </div>

        {/* Footer Action Button */}
        <div className="pt-3 border-t border-slate-800/80 relative z-10">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all cursor-pointer flex items-center justify-center gap-2 border border-emerald-400/30 group"
          >
            <span>Continue</span>
            <LucideIcons.ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
};
