import React, { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';

interface InteractiveBodyMapProps {
  activeSystemId?: string;
  onSystemSelect: (systemId: string) => void;
}

export const InteractiveBodyMap: React.FC<InteractiveBodyMapProps> = ({ 
  activeSystemId, 
  onSystemSelect 
}) => {
  const { systems } = useDashboard();
  const [hoveredSystem, setHoveredSystem] = useState<string | null>(null);

  // Map system color classes to SVG glow and fill colors
  const systemColors: Record<string, { fill: string; stroke: string; glow: string }> = {
    cardio: { fill: 'rgba(244, 63, 94, 0.25)', stroke: 'rgb(244, 63, 94)', glow: 'rgba(244, 63, 94, 0.6)' },
    nervous: { fill: 'rgba(139, 92, 246, 0.25)', stroke: 'rgb(139, 92, 246)', glow: 'rgba(139, 92, 246, 0.6)' },
    digestive: { fill: 'rgba(16, 185, 129, 0.25)', stroke: 'rgb(16, 185, 129)', glow: 'rgba(16, 185, 129, 0.6)' },
    musculoskeletal: { fill: 'rgba(245, 158, 11, 0.25)', stroke: 'rgb(245, 158, 11)', glow: 'rgba(245, 158, 11, 0.6)' },
    respiratory: { fill: 'rgba(6, 182, 212, 0.25)', stroke: 'rgb(6, 182, 212)', glow: 'rgba(6, 182, 212, 0.6)' },
    immune: { fill: 'rgba(236, 72, 153, 0.25)', stroke: 'rgb(236, 72, 153)', glow: 'rgba(236, 72, 153, 0.6)' },
    endocrine: { fill: 'rgba(192, 132, 252, 0.25)', stroke: 'rgb(192, 132, 252)', glow: 'rgba(192, 132, 252, 0.6)' },
    integumentary: { fill: 'rgba(244, 91, 50, 0.15)', stroke: 'rgb(244, 91, 50)', glow: 'rgba(244, 91, 50, 0.4)' },
    urinary: { fill: 'rgba(14, 165, 233, 0.25)', stroke: 'rgb(14, 165, 233)', glow: 'rgba(14, 165, 233, 0.6)' },
    reproductive: { fill: 'rgba(244, 63, 144, 0.25)', stroke: 'rgb(244, 63, 144)', glow: 'rgba(244, 63, 144, 0.6)' },
  };

  const getStyleForSystem = (id: string) => {
    const system = systems.find(s => s.id === id);
    const isTracking = system ? system.isTracking : true;
    const isActive = activeSystemId === id;
    const isHovered = hoveredSystem === id;
    const colors = systemColors[id] || { fill: 'rgba(255, 255, 255, 0.1)', stroke: '#fff', glow: 'rgba(255, 255, 255, 0.3)' };

    if (isActive || isHovered) {
      return {
        fill: isTracking ? colors.fill : 'rgba(100, 116, 139, 0.12)',
        stroke: isTracking ? colors.stroke : '#64748b',
        filter: isTracking ? `drop-shadow(0px 0px 8px ${colors.glow})` : 'none',
        strokeWidth: 2,
        transition: 'all 0.3s ease',
        cursor: 'pointer',
      };
    }

    return {
      fill: 'rgba(255, 255, 255, 0.01)',
      stroke: isTracking ? 'rgba(255, 255, 255, 0.12)' : 'rgba(100, 116, 139, 0.05)',
      strokeWidth: 1,
      strokeDasharray: isTracking ? undefined : '2 2',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
    };
  };

  return (
    <div className="relative w-full flex flex-col items-center justify-center p-2 select-none">
      
      {/* SVG silhouette container */}
      <div className="relative w-full max-w-[210px] aspect-[1/2] flex items-center justify-center">
        <svg 
          viewBox="0 0 200 400" 
          className="w-full h-full overflow-visible"
        >
          <defs>
            <filter id="svg-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* INTEGRUM / SKIN OUTLINE (Symmetrical human shape with exactly TWO legs and clear joints) */}
          <g
            onMouseEnter={() => setHoveredSystem('integumentary')}
            onMouseLeave={() => setHoveredSystem(null)}
            onClick={() => onSystemSelect('integumentary')}
          >
            {/* Head oval */}
            <ellipse
              cx="100"
              cy="45"
              rx="16"
              ry="20"
              style={getStyleForSystem('integumentary')}
            />
            {/* Symmetrical body outline containing neck, shoulders, arms, waist, hips, and EXACTLY TWO legs */}
            <path
              d="M 94, 65 
                 L 94, 72 
                 C 85, 75, 75, 78, 65, 82
                 L 48, 170
                 C 45, 178, 54, 178, 54, 172
                 L 70, 115
                 C 70, 140, 72, 170, 72, 195
                 C 72, 205, 76, 215, 76, 225
                 L 76, 290
                 C 76, 300, 78, 305, 78, 310
                 L 78, 380
                 C 78, 385, 92, 385, 92, 380
                 L 92, 310
                 C 92, 305, 94, 300, 94, 290
                 L 94, 230
                 C 97, 230, 103, 230, 106, 230
                 L 106, 290
                 C 106, 300, 108, 305, 108, 310
                 L 108, 380
                 C 108, 385, 122, 385, 122, 380
                 L 122, 310
                 C 122, 305, 124, 300, 124, 290
                 L 124, 225
                 C 124, 215, 128, 205, 128, 195
                 C 128, 170, 130, 140, 130, 115
                 L 146, 172
                 C 146, 178, 155, 178, 152, 170
                 L 135, 82
                 C 125, 78, 115, 75, 106, 72
                 L 106, 65 
                 Z"
              style={getStyleForSystem('integumentary')}
            />
          </g>

          {/* NERVES / BRAIN & SPINE */}
          <g 
            onMouseEnter={() => setHoveredSystem('nervous')}
            onMouseLeave={() => setHoveredSystem(null)}
            onClick={() => onSystemSelect('nervous')}
          >
            {/* Brain */}
            <path
              d="M 90 44 C 88 36, 93 28, 100 28 C 107 28, 112 36, 110 44 C 109 48, 91 48, 90 44 Z"
              style={getStyleForSystem('nervous')}
            />
            {/* Spine */}
            <line
              x1="100" y1="50" x2="100" y2="215"
              style={getStyleForSystem('nervous')}
              strokeWidth="1.8"
            />
          </g>

          {/* RESPIRATORY (Lungs & Trachea) */}
          <g 
            onMouseEnter={() => setHoveredSystem('respiratory')}
            onMouseLeave={() => setHoveredSystem(null)}
            onClick={() => onSystemSelect('respiratory')}
          >
            {/* Trachea */}
            <line x1="100" y1="72" x2="100" y2="92" style={getStyleForSystem('respiratory')} strokeWidth="1.5" />
            {/* Left Lung */}
            <path d="M 97 92 C 85 92, 80 102, 82 120 C 83 127, 93 127, 97 120 Z" style={getStyleForSystem('respiratory')} />
            {/* Right Lung */}
            <path d="M 103 92 C 115 92, 120 102, 118 120 C 117 127, 107 127, 103 120 Z" style={getStyleForSystem('respiratory')} />
          </g>

          {/* CARDIOVASCULAR (Symmetrical Heart in center chest) */}
          <path
            d="M 100 106 Q 94 98, 88 106 Q 82 114, 100 128 Q 118 114, 112 106 Q 106 98, 100 106 Z"
            style={getStyleForSystem('cardio')}
            onMouseEnter={() => setHoveredSystem('cardio')}
            onMouseLeave={() => setHoveredSystem(null)}
            onClick={() => onSystemSelect('cardio')}
          />

          {/* DIGESTIVE (Stomach & Intestinal loops) */}
          <g 
            onMouseEnter={() => setHoveredSystem('digestive')}
            onMouseLeave={() => setHoveredSystem(null)}
            onClick={() => onSystemSelect('digestive')}
          >
            {/* Stomach */}
            <path d="M 94 140 C 82 140, 86 153, 95 158 C 104 160, 104 149, 94 140 Z" style={getStyleForSystem('digestive')} />
            {/* Intestines */}
            <path 
              d="M 90 172 H 110 V 188 H 90 V 176 H 106 V 184 H 94 V 180 H 100" 
              fill="none" 
              stroke={systemColors.digestive.stroke}
              style={getStyleForSystem('digestive')} 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </g>

          {/* ENDOCRINE GLANDS */}
          <g 
            onMouseEnter={() => setHoveredSystem('endocrine')}
            onMouseLeave={() => setHoveredSystem(null)}
            onClick={() => onSystemSelect('endocrine')}
          >
            {/* Thyroid */}
            <path d="M 97 68 Q 100 71, 103 68 Q 105 65, 100 66 Q 95 65, 97 68 Z" style={getStyleForSystem('endocrine')} />
            {/* Pancreas gland */}
            <rect x="92" y="152" width="16" height="4" rx="2" style={getStyleForSystem('endocrine')} />
          </g>

          {/* URINARY (Kidneys & Bladder) */}
          <g 
            onMouseEnter={() => setHoveredSystem('urinary')}
            onMouseLeave={() => setHoveredSystem(null)}
            onClick={() => onSystemSelect('urinary')}
          >
            {/* Left Kidney */}
            <circle cx="86" cy="162" r="3.5" style={getStyleForSystem('urinary')} />
            {/* Right Kidney */}
            <circle cx="114" cy="162" r="3.5" style={getStyleForSystem('urinary')} />
            {/* Bladder */}
            <circle cx="100" cy="206" r="4.5" style={getStyleForSystem('urinary')} />
            {/* Ureters */}
            <path d="M 86 165 L 98 204 M 114 165 L 102 204" fill="none" strokeWidth="0.8" style={getStyleForSystem('urinary')} />
          </g>

          {/* REPRODUCTIVE */}
          <path
            d="M 96 220 H 104 L 100 228 Z"
            style={getStyleForSystem('reproductive')}
            onMouseEnter={() => setHoveredSystem('reproductive')}
            onMouseLeave={() => setHoveredSystem(null)}
            onClick={() => onSystemSelect('reproductive')}
          />

          {/* IMMUNE LYMPH SYSTEM */}
          <g 
            onMouseEnter={() => setHoveredSystem('immune')}
            onMouseLeave={() => setHoveredSystem(null)}
            onClick={() => onSystemSelect('immune')}
          >
            {/* Lymph Nodes */}
            <circle cx="56" cy="100" r="2.5" style={getStyleForSystem('immune')} />
            <circle cx="144" cy="100" r="2.5" style={getStyleForSystem('immune')} />
            <circle cx="82" cy="216" r="2.5" style={getStyleForSystem('immune')} />
            <circle cx="118" cy="216" r="2.5" style={getStyleForSystem('immune')} />
            <circle cx="93" cy="74" r="2" style={getStyleForSystem('immune')} />
            <circle cx="107" cy="74" r="2" style={getStyleForSystem('immune')} />
          </g>

          {/* MUSCULOSKELETAL SYSTEM (Joints - shoulders, elbows, wrists, hips, and EXACTLY TWO KNEES/ANKLES) */}
          <g 
            onMouseEnter={() => setHoveredSystem('musculoskeletal')}
            onMouseLeave={() => setHoveredSystem(null)}
            onClick={() => onSystemSelect('musculoskeletal')}
          >
            {/* Shoulders */}
            <circle cx="64" cy="85" r="4.5" style={getStyleForSystem('musculoskeletal')} />
            <circle cx="136" cy="85" r="4.5" style={getStyleForSystem('musculoskeletal')} />
            {/* Elbows */}
            <circle cx="55" cy="125" r="4" style={getStyleForSystem('musculoskeletal')} />
            <circle cx="145" cy="125" r="4" style={getStyleForSystem('musculoskeletal')} />
            {/* Wrists */}
            <circle cx="48" cy="165" r="3.5" style={getStyleForSystem('musculoskeletal')} />
            <circle cx="152" cy="165" r="3.5" style={getStyleForSystem('musculoskeletal')} />
            {/* Hips */}
            <circle cx="78" cy="225" r="5" style={getStyleForSystem('musculoskeletal')} />
            <circle cx="122" cy="225" r="5" style={getStyleForSystem('musculoskeletal')} />
            {/* Knees (Exactly two knees, centered on the legs) */}
            <circle cx="84" cy="300" r="5" style={getStyleForSystem('musculoskeletal')} />
            <circle cx="116" cy="300" r="5" style={getStyleForSystem('musculoskeletal')} />
            {/* Ankles (Exactly two ankles, at bottom leg sections) */}
            <circle cx="84" cy="365" r="4" style={getStyleForSystem('musculoskeletal')} />
            <circle cx="116" cy="365" r="4" style={getStyleForSystem('musculoskeletal')} />
          </g>
        </svg>

        {/* Hover overlay tooltip */}
        {(hoveredSystem || activeSystemId) && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 glass-panel rounded-lg py-1 px-2.5 flex items-center gap-1.5 border border-slate-750/60 shadow-lg whitespace-nowrap animate-fade-in pointer-events-none z-10">
            {(() => {
              const activeId = hoveredSystem || activeSystemId;
              const system = systems.find(s => s.id === activeId);
              if (!system) return null;
              
              return (
                <>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    activeId === 'cardio' ? 'bg-rose-500' :
                    activeId === 'nervous' ? 'bg-violet-500' :
                    activeId === 'digestive' ? 'bg-emerald-500' :
                    activeId === 'musculoskeletal' ? 'bg-amber-500' :
                    activeId === 'respiratory' ? 'bg-cyan-500' :
                    activeId === 'immune' ? 'bg-pink-500' :
                    activeId === 'endocrine' ? 'bg-purple-500' :
                    activeId === 'integumentary' ? 'bg-orange-500' :
                    activeId === 'urinary' ? 'bg-sky-500' : 'bg-rose-400'
                  }`} />
                  <span className="text-[10px] font-semibold text-slate-200">{system.name}</span>
                  <span className="text-[9px] text-slate-400 bg-slate-900 px-1 py-0.2 rounded font-mono">
                    {system.isTracking ? `${system.score}%` : 'Not Tracked'}
                  </span>
                </>
              );
            })()}
          </div>
        )}
      </div>

    </div>
  );
};
