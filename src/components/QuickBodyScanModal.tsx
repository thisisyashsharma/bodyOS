import React, { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import type { BodySystem } from '../types';

interface QuickBodyScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  systems: BodySystem[];
  onSaveAll: (ratingsMap: Record<string, number>) => void;
}

const SYSTEM_COLORS: Record<string, { text: string; bg: string; border: string; hex: string }> = {
  cardio: { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', hex: '#f43f5e' },
  nervous: { text: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20', hex: '#8b5cf6' },
  digestive: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', hex: '#10b981' },
  musculoskeletal: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', hex: '#f59e0b' },
  respiratory: { text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', hex: '#06b6d4' },
  immune: { text: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20', hex: '#ec4899' },
  endocrine: { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', hex: '#a855f7' },
};

const playSliderSound = (value: number) => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const freq = 220 + value * 55;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.15, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.13);
  } catch (err) {
    // Ignore audio context autoplay restrictions
  }
};

export const QuickBodyScanModal: React.FC<QuickBodyScanModalProps> = ({
  isOpen,
  onClose,
  systems,
  onSaveAll,
}) => {
  if (!isOpen) return null;

  const activeSystems = systems.filter((sys) => sys.isTracking);

  const [expandedDescIds, setExpandedDescIds] = useState<Set<string>>(new Set());
  const [slidingId, setSlidingId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);

  // Initialize local state ratings from existing system subjective Ratings or default 7
  const [ratings, setRatings] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    activeSystems.forEach((sys) => {
      initial[sys.id] = sys.subjectiveRating || Math.round(sys.score / 10) || 7;
    });
    return initial;
  });

  const toggleExpandDesc = (sysId: string) => {
    setExpandedDescIds((prev) => {
      const next = new Set(prev);
      if (next.has(sysId)) next.delete(sysId);
      else next.add(sysId);
      return next;
    });
  };

  const getIcon = (iconName: string, className = "w-5 h-5") => {
    const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.Heart;
    return <IconComponent className={className} />;
  };

  const handleRatingChange = (id: string, value: number) => {
    setRatings((prev) => ({ ...prev, [id]: value }));
    playSliderSound(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveAll(ratings);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl overflow-y-auto p-4 sm:p-6 flex items-center justify-center animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 shadow-2xl space-y-6 my-auto relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <LucideIcons.Zap className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg sm:text-xl text-slate-100 m-0">
                ⚡ Quick Body Scan (10s Audit)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Adjust all {activeSystems.length} active body system ratings below. Auto-saves for current date & time.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all cursor-pointer"
            title="Close scan"
          >
            <LucideIcons.X className="w-5 h-5" />
          </button>
        </div>

        {/* Stacked System Sliders Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {activeSystems.map((sys) => {
              const theme = SYSTEM_COLORS[sys.colorClass] || SYSTEM_COLORS.cardio;
              const val = ratings[sys.id] ?? 7;
              const emoji = val >= 8 ? '🔥' : val >= 5 ? '⚡' : '😴';
              const pct = Math.round(((val - 1) / 9) * 100);
              const isExpanded = expandedDescIds.has(sys.id);
              const isSlidingThis = slidingId === sys.id;
              const isFocusedThis = focusedId === sys.id;

              return (
                <div key={sys.id} className="space-y-1.5">
                  {/* Slider Pill */}
                  <div
                    className={`relative w-full h-14 rounded-2xl bg-slate-950/80 border overflow-hidden group transition-all duration-300 shadow-inner select-none ${
                      isSlidingThis || isFocusedThis
                        ? 'border-indigo-400/80 ring-2 ring-indigo-500/20'
                        : 'border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    {/* Glowing Theme Color Liquid Fill Bar */}
                    <div
                      className="absolute top-0 bottom-0 left-0 rounded-2xl transition-all duration-150 ease-out z-0 opacity-75 group-hover:opacity-95"
                      style={{
                        width: `${Math.max(8, pct)}%`,
                        backgroundColor: theme.hex,
                        boxShadow: `0 0 24px ${theme.hex}88`,
                      }}
                    />

                    {/* Focused / Active Slider Tilted Shimmer Sweep (Constrained to colored portion only) */}
                    {(isSlidingThis || isFocusedThis) && (
                      <div
                        className="absolute top-0 bottom-0 left-0 pointer-events-none overflow-hidden rounded-2xl z-10 transition-all duration-150 ease-out"
                        style={{ width: `${Math.max(8, pct)}%` }}
                      >
                        <div className="w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer-sweep" />
                      </div>
                    )}

                    {/* Top Gloss Highlight Line for Glassmorphic Brightness Feel */}
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent z-10 pointer-events-none" />

                    {/* Pill Content Overlay */}
                    <div className="absolute inset-0 z-10 flex items-center justify-between px-3.5 sm:px-4 pointer-events-none">
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        {/* Param Icon (Click to toggle details!) */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleExpandDesc(sys.id);
                          }}
                          className={`p-1.5 rounded-xl bg-slate-900/90 border ${theme.text} shadow-sm shrink-0 pointer-events-auto z-30 hover:scale-110 active:scale-95 transition-all cursor-pointer group/icon ${
                            isExpanded ? 'border-indigo-400/90 ring-2 ring-indigo-500/40 bg-indigo-950/40' : 'border-slate-700/60'
                          }`}
                          title={isExpanded ? "Hide details" : "Click icon to read details"}
                        >
                          {getIcon(sys.iconName, "w-4 h-4")}
                        </button>

                        <span className="font-semibold text-xs sm:text-sm text-white drop-shadow-sm truncate">
                          {sys.name}
                        </span>
                      </div>

                      {/* Rating Score Badge (Magnifies cleanly without collision!) */}
                      <div
                        className={`flex items-center gap-1.5 font-mono text-xs font-bold px-2.5 py-1 rounded-full bg-slate-900/90 border transition-all duration-200 shadow-md ${
                          isSlidingThis
                            ? 'scale-135 border-indigo-400/90 text-white bg-slate-900 shadow-2xl shadow-indigo-500/40 z-30 ring-2 ring-indigo-400/60 font-extrabold text-sm'
                            : 'border-slate-700/80 text-white'
                        }`}
                      >
                        <span className={isSlidingThis ? 'animate-bounce' : ''}>{emoji}</span>
                        <span style={{ color: theme.hex }}>{val}/10</span>
                      </div>
                    </div>

                    {/* Invisible Full-Track Interactive Slider Input Overlay */}
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={val}
                      onChange={(e) => handleRatingChange(sys.id, parseInt(e.target.value, 10))}
                      onMouseDown={() => setSlidingId(sys.id)}
                      onTouchStart={() => setSlidingId(sys.id)}
                      onMouseUp={() => setSlidingId(null)}
                      onTouchEnd={() => setSlidingId(null)}
                      onFocus={() => setFocusedId(sys.id)}
                      onBlur={() => {
                        setSlidingId(null);
                        setFocusedId(null);
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                    />
                  </div>

                  {/* Expandable Description Details Card */}
                  {isExpanded && (
                    <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800/80 text-xs text-slate-300 leading-relaxed animate-fade-in space-y-1 shadow-lg">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider font-mono text-indigo-400 mb-0.5">
                        <LucideIcons.BookOpen className="w-3.5 h-3.5" />
                        <span>System Scope & Clinical Context</span>
                      </div>
                      <p className="text-slate-300 text-xs font-sans">
                        {sys.description}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer Save Action */}
          <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-[11px] text-slate-400 font-mono">
              🕒 Current timestamp: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white text-xs font-semibold transition-all cursor-pointer"
              >
                Cancel
              </button>

              {/* Glorifying Outward Wave Container */}
              <div className="relative flex-1 sm:flex-none">
                {/* Concentric Subtle Outward Pulsing Waves */}
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 animate-outward-wave pointer-events-none opacity-35 z-0" />
                <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 animate-outward-wave [animation-delay:1.2s] pointer-events-none opacity-15 z-0" />

                <button
                  type="submit"
                  className="relative z-10 w-full px-6 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all cursor-pointer flex items-center justify-center gap-2 border border-indigo-400/40 group"
                >
                  <LucideIcons.Zap className="w-4 h-4 fill-white group-hover:animate-bounce" />
                  <span>Save All {activeSystems.length} Ratings 🌌</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
