import React from 'react';
import * as LucideIcons from 'lucide-react';
import type { BodySystem, ProtectiveHabit, MedicalEvent } from '../types';

interface SystemCardProps {
  system: BodySystem;
  habits: ProtectiveHabit[];
  events: MedicalEvent[];
  onClick: () => void;
}

export const SystemCard: React.FC<SystemCardProps> = ({
  system,
  habits,
  events,
  onClick,
}) => {
  // Resolve Lucide icons dynamically
  const getIcon = (iconName: string) => {
    // Falls back to Heart if not found
    const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.Heart;
    return <IconComponent className="w-5 h-5" />;
  };

  const activeHabitsCount = habits.filter((h) => h.systemId === system.id && h.isActive).length;
  const recentEventsCount = events.filter(
    (e) => e.systemId === system.id && e.type === 'Symptom'
  ).length;

  // Determine system status styling
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'Optimal':
        return {
          bg: 'bg-emerald-500/10',
          text: 'text-emerald-400',
          border: 'border-emerald-500/20',
        };
      case 'Stable':
        return {
          bg: 'bg-blue-500/10',
          text: 'text-blue-400',
          border: 'border-blue-500/20',
        };
      case 'Suboptimal':
        return {
          bg: 'bg-amber-500/10',
          text: 'text-amber-400',
          border: 'border-amber-500/20',
        };
      case 'Attention Required':
      default:
        return {
          bg: 'bg-rose-500/10',
          text: 'text-rose-400',
          border: 'border-rose-500/20',
        };
    }
  };

  const statusStyle = getStatusStyles(system.status);

  // System-specific colors
  const systemColorMaps: Record<string, string> = {
    cardio: 'text-rose-500 shadow-rose-500/20',
    nervous: 'text-violet-500 shadow-violet-500/20',
    digestive: 'text-emerald-500 shadow-emerald-500/20',
    musculoskeletal: 'text-amber-500 shadow-amber-500/20',
    respiratory: 'text-cyan-500 shadow-cyan-500/20',
    immune: 'text-pink-500 shadow-pink-500/20',
    endocrine: 'text-purple-500 shadow-purple-500/20',
    integumentary: 'text-orange-500 shadow-orange-500/20',
    urinary: 'text-sky-500 shadow-sky-500/20',
    reproductive: 'text-rose-400 shadow-rose-400/20',
  };

  const accentColorClass = systemColorMaps[system.id] || 'text-indigo-400';

  // Circular progress ring calculations
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (system.score / 100) * circumference;

  return (
    <div
      onClick={onClick}
      className={`glass-panel glass-panel-hover rounded-2xl p-5 cursor-pointer flex flex-col justify-between h-48 border border-slate-800/80 glow-${system.colorClass}`}
    >
      {/* Header Info */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 ${accentColorClass}`}>
            {getIcon(system.iconName)}
          </div>
          <div>
            <h3 className="font-display font-semibold text-slate-100 text-base group-hover:text-white transition-colors">
              {system.name}
            </h3>
            <span
              className={`inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
            >
              {system.status}
            </span>
          </div>
        </div>

        {/* Circular Progress Ring */}
        <div className="relative flex items-center justify-center w-14 h-14">
          <svg className="w-full h-full -rotate-90">
            {/* Background ring */}
            <circle
              cx="28"
              cy="28"
              r={radius}
              className="fill-none stroke-slate-800/60"
              strokeWidth="4"
            />
            {/* Foreground progress */}
            <circle
              cx="28"
              cy="28"
              r={radius}
              className={`fill-none stroke-current ${accentColorClass}`}
              strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
          </svg>
          {/* Inner Text */}
          <span className="absolute text-xs font-mono font-bold text-slate-200">
            {system.score}
          </span>
        </div>
      </div>

      {/* Body Description */}
      <p className="text-slate-400 text-xs line-clamp-2 mt-3 flex-grow leading-relaxed">
        {system.description}
      </p>

      {/* Footer Metrics */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800/50 text-[10px] font-medium text-slate-400">
        <div className="flex items-center gap-1">
          <LucideIcons.CheckSquare className="w-3.5 h-3.5 text-slate-500" />
          <span>{activeHabitsCount} Habits Active</span>
        </div>
        
        {recentEventsCount > 0 ? (
          <div className="flex items-center gap-1 text-rose-400/95">
            <LucideIcons.AlertTriangle className="w-3.5 h-3.5" />
            <span>{recentEventsCount} Symptom Logged</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-slate-500">
            <LucideIcons.ShieldAlert className="w-3.5 h-3.5" />
            <span>No active symptoms</span>
          </div>
        )}
      </div>
    </div>
  );
};
