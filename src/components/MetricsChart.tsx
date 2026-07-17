import React, { useState, useEffect, useMemo, useCallback } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────────

interface ChartDataPoint {
  date: string; // YYYY-MM-DD format
  value: number;
}

interface MetricsChartProps {
  data: ChartDataPoint[];
  title?: string;
  colorHex?: string;
  yLabelSuffix?: string;
  minYValue?: number;
  maxYValue?: number;
  height?: number;
  onDaySelect?: (dateStr: string) => void;
}

type TabKey = 'Day' | 'Week' | 'Month' | 'Year';

const TABS: TabKey[] = ['Day', 'Week', 'Month', 'Year'];

// ─── Date Helpers ───────────────────────────────────────────────────────────────

function formatYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = day === 0 ? 6 : day - 1; // Monday-start
  copy.setDate(copy.getDate() - diff);
  return copy;
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getWeekOffset(targetDate: Date): number {
  const today = new Date();
  const thisWeekStart = startOfWeek(today);
  const targetWeekStart = startOfWeek(targetDate);
  const msDiff = targetWeekStart.getTime() - thisWeekStart.getTime();
  const dayDiff = msDiff / (24 * 60 * 60 * 1000);
  return Math.round(dayDiff / 7);
}

const SHORT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ─── Bucket Builders (for Day / Week / Year bar charts) ─────────────────────────

interface Bucket {
  label: string;
  value: number | null;
  dateLabel: string;
}

function buildDayBuckets(data: ChartDataPoint[], offset: number): { buckets: Bucket[]; rangeLabel: string } {
  const today = new Date();
  const target = addDays(today, offset);
  const key = formatYMD(target);
  const match = data.find(d => d.date === key);

  const label = target.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const rangeLabel = target.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return {
    buckets: [{
      label,
      value: match ? match.value : null,
      dateLabel: rangeLabel,
    }],
    rangeLabel,
  };
}

function buildWeekBuckets(data: ChartDataPoint[], offset: number): { buckets: Bucket[]; rangeLabel: string } {
  const today = new Date();
  const thisWeekStart = startOfWeek(today);
  const targetWeekStart = addDays(thisWeekStart, offset * 7);

  const dataMap = new Map(data.map(d => [d.date, d.value]));
  const buckets: Bucket[] = [];

  for (let i = 0; i < 7; i++) {
    const day = addDays(targetWeekStart, i);
    const key = formatYMD(day);
    const val = dataMap.get(key) ?? null;
    buckets.push({
      label: SHORT_DAYS[i],
      value: val,
      dateLabel: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    });
  }

  const weekEnd = addDays(targetWeekStart, 6);
  const rangeLabel = `${targetWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  return { buckets, rangeLabel };
}

function buildYearBuckets(data: ChartDataPoint[], offset: number): { buckets: Bucket[]; rangeLabel: string } {
  const today = new Date();
  const targetYear = today.getFullYear() + offset;

  const buckets: Bucket[] = [];

  for (let m = 0; m < 12; m++) {
    const prefix = `${targetYear}-${String(m + 1).padStart(2, '0')}`;
    const monthPoints = data.filter(d => d.date.startsWith(prefix));
    const avg = monthPoints.length > 0
      ? monthPoints.reduce((s, p) => s + p.value, 0) / monthPoints.length
      : null;

    buckets.push({
      label: SHORT_MONTHS[m],
      value: avg !== null ? Math.round(avg * 10) / 10 : null,
      dateLabel: `${SHORT_MONTHS[m]} ${targetYear}`,
    });
  }

  return { buckets, rangeLabel: String(targetYear) };
}

// ─── Month Calendar Grid Types ──────────────────────────────────────────────────

interface CalendarDay {
  date: number; // 1-31
  dow: number;  // 0=Mon, 6=Sun (Monday-start)
  week: number; // row index
  value: number | null;
  dateStr: string; // YYYY-MM-DD
  isToday: boolean;
}

function buildMonthCalendar(data: ChartDataPoint[], offset: number): { days: CalendarDay[]; rangeLabel: string; average: number } {
  const today = new Date();
  const targetMonth = new Date(today.getFullYear(), today.getMonth() + offset, 1);
  const numDays = daysInMonth(targetMonth.getFullYear(), targetMonth.getMonth());
  const todayStr = formatYMD(today);

  const dataMap = new Map(data.map(d => [d.date, d.value]));
  const days: CalendarDay[] = [];
  let sum = 0;
  let count = 0;

  for (let i = 1; i <= numDays; i++) {
    const d = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), i);
    const jsDay = d.getDay(); // 0=Sun
    const dow = jsDay === 0 ? 6 : jsDay - 1; // Convert to Mon=0 start
    const dateStr = formatYMD(d);
    const value = dataMap.get(dateStr) ?? null;

    // Calculate week row: offset by the first day's dow
    const firstDow = (() => {
      const fd = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1).getDay();
      return fd === 0 ? 6 : fd - 1;
    })();
    const week = Math.floor((i - 1 + firstDow) / 7);

    if (value !== null) {
      sum += value;
      count++;
    }

    days.push({ date: i, dow, week, value, dateStr, isToday: dateStr === todayStr });
  }

  const rangeLabel = targetMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const average = count > 0 ? Math.round((sum / count) * 10) / 10 : 0;

  return { days, rangeLabel, average };
}

// ─── Component ──────────────────────────────────────────────────────────────────

export const MetricsChart: React.FC<MetricsChartProps> = ({
  data,
  title,
  colorHex = '#818cf8',
  yLabelSuffix = '',
  minYValue,
  maxYValue,
  height = 220,
  onDaySelect,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('Week');
  const [currentOffset, setCurrentOffset] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [animating, setAnimating] = useState(false);
  const [hoveredCalDay, setHoveredCalDay] = useState<number | null>(null);

  // Swipe Gestures for touch devices
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (touchStart === null || touchEnd === null) return;
    const diff = touchStart - touchEnd;
    const minSwipeDistance = 50; // threshold in pixels

    if (diff > minSwipeDistance) {
      // Right-to-left swipe -> next period (future)
      handleNext();
    } else if (diff < -minSwipeDistance) {
      // Left-to-right swipe -> previous period (past)
      handlePrev();
    }

    setTouchStart(null);
    setTouchEnd(null);
  }, [touchStart, touchEnd]);

  const isMonthView = activeTab === 'Month';

  // ── Compute bar buckets (for Day/Week/Year) ─────────────────────────────
  const { buckets, rangeLabel: barRangeLabel } = useMemo(() => {
    switch (activeTab) {
      case 'Day':   return buildDayBuckets(data, currentOffset);
      case 'Week':  return buildWeekBuckets(data, currentOffset);
      case 'Year':  return buildYearBuckets(data, currentOffset);
      default:      return { buckets: [] as Bucket[], rangeLabel: '' };
    }
  }, [data, activeTab, currentOffset]);

  // ── Compute month calendar (for Month view) ─────────────────────────────
  const monthCalendar = useMemo(() => {
    if (!isMonthView) return null;
    return buildMonthCalendar(data, currentOffset);
  }, [data, currentOffset, isMonthView]);

  const rangeLabel = isMonthView ? (monthCalendar?.rangeLabel ?? '') : barRangeLabel;

  // ── Trigger bar animation ─────────────────────────────────────────────
  useEffect(() => {
    setAnimating(false);
    setHoveredIndex(null);
    setHoveredCalDay(null);
    const raf = requestAnimationFrame(() => {
      setAnimating(true);
    });
    return () => cancelAnimationFrame(raf);
  }, [data, activeTab, currentOffset]);

  const handleTabChange = useCallback((tab: TabKey) => {
    setActiveTab(tab);
    setCurrentOffset(0);
  }, []);

  const handlePrev = useCallback(() => setCurrentOffset(o => o - 1), []);
  const handleNext = useCallback(() => setCurrentOffset(o => Math.min(0, o + 1)), []);

  // ── Bar Chart Geometry (Day/Week/Year) ────────────────────────────────
  const svgWidth = 560;
  const svgHeight = height;
  const paddingLeft = 48;
  const paddingRight = 16;
  const paddingTop = 16;
  const paddingBottom = 28;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const filledValues = buckets.filter(b => b.value !== null).map(b => b.value as number);
  const hasBarData = filledValues.length > 0;

  const dataMin = hasBarData ? Math.min(...filledValues) : 0;
  const dataMax = hasBarData ? Math.max(...filledValues) : 10;

  let yMin = minYValue !== undefined ? minYValue : Math.max(0, dataMin - (dataMax - dataMin) * 0.15);
  let yMax = maxYValue !== undefined ? maxYValue : dataMax + (dataMax - dataMin) * 0.15;
  if (yMin === yMax) { yMin = Math.max(0, yMin - 1); yMax = yMax + 1; }
  if (yMin > 0 && yMin < (yMax - yMin) * 0.3) yMin = 0;

  const barAverage = hasBarData
    ? Math.round((filledValues.reduce((a, b) => a + b, 0) / filledValues.length) * 10) / 10
    : 0;

  const getY = (value: number) => {
    const clamped = Math.max(yMin, Math.min(yMax, value));
    const scale = chartHeight / (yMax - yMin);
    return paddingTop + chartHeight - (clamped - yMin) * scale;
  };

  const numBars = buckets.length;
  const isDayView = activeTab === 'Day';
  const gap = isDayView ? 0 : Math.max(2, chartWidth * 0.015);
  const totalGap = gap * (numBars > 1 ? numBars - 1 : 0);
  const maxBarWidth = isDayView ? 64 : (activeTab === 'Year' ? 32 : 24);
  const rawBarWidth = numBars > 0 ? (chartWidth - totalGap) / numBars : 0;
  const barWidth = Math.min(rawBarWidth, maxBarWidth);
  const totalBarsWidth = barWidth * numBars + gap * (numBars > 1 ? numBars - 1 : 0);
  const barsStartX = paddingLeft + (chartWidth - totalBarsWidth) / 2;

  const getBarX = (i: number) => barsStartX + i * (barWidth + gap);

  const isTenScale = yMax === 10 || maxYValue === 10;
  const yTicks = isTenScale
    ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => ({ value: val, y: getY(val) }))
    : Array.from({ length: 4 }, (_, i) => {
        const val = yMin + (i / 3) * (yMax - yMin);
        return { value: Math.round(val * 10) / 10, y: getY(val) };
      });

  const gradId = `bar-grad-${(title ?? '').replace(/\s+/g, '-').toLowerCase() || 'mc'}-${colorHex.replace('#', '')}`;
  const glowId = `bar-glow-${gradId}`;

  // ── Month Calendar Helpers ────────────────────────────────────────────
  const maxCalValue = maxYValue ?? 10;

  const getCircleSize = (value: number | null): number => {
    if (value === null) return 0;
    return value / maxCalValue;
  };

  const getCircleColor = (value: number | null): string => {
    if (value === null) return 'transparent';
    return `${colorHex}cc`; // Consistent 80% opacity
  };

  return (
    <div 
      className="w-full flex flex-col select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Header: Title + Tabs ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-3">
        {title && (
          <h4 className="font-display font-medium text-slate-300 text-sm">{title}</h4>
        )}
        <div className="flex items-center gap-0.5 bg-slate-800/70 rounded-lg p-0.5 ml-auto">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`
                px-2.5 py-1 text-[11px] font-medium rounded-md
                transition-all duration-200 cursor-pointer
                ${activeTab === tab
                  ? 'text-slate-100 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
                }
              `}
              style={activeTab === tab ? { backgroundColor: `${colorHex}33` } : undefined}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── Date Navigation ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-3 mb-3">
        <button
          onClick={handlePrev}
          className="text-slate-400 hover:text-slate-100 transition-colors p-1 rounded-md hover:bg-slate-800/60 cursor-pointer"
          aria-label="Previous period"
        >
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="text-center min-w-[160px]">
          <span className="text-slate-200 text-sm font-semibold font-display block">
            {rangeLabel}
          </span>
          {isMonthView && monthCalendar && monthCalendar.average > 0 && (
            <span className="text-[11px] font-medium mt-0.5 block" style={{ color: colorHex }}>
              Avg: {monthCalendar.average}/10
            </span>
          )}
          {!isMonthView && hasBarData && (
            <span className="text-[11px] font-medium mt-0.5 block" style={{ color: colorHex }}>
              Avg: {barAverage}{yLabelSuffix}
            </span>
          )}
        </div>
        <button
          onClick={handleNext}
          disabled={currentOffset >= 0}
          className={`
            p-1 rounded-md transition-colors cursor-pointer
            ${currentOffset >= 0
              ? 'text-slate-700 cursor-not-allowed'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
            }
          `}
          aria-label="Next period"
        >
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
            <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* ── MONTH CALENDAR BUBBLE VIEW ──────────────────────────────────── */}
      {isMonthView && monthCalendar && (
        <div className="w-full animate-smooth-transition">
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-y-1 mb-2 relative -mx-5">
            {monthCalendar.days.map((day) => {
              const ratio = getCircleSize(day.value);
              const minPx = 16;
              const maxPx = 50;
              const circlePx = day.value !== null ? minPx + ratio * (maxPx - minPx) : 0;
              const isHovered = hoveredCalDay === day.date;

              return (
                <div
                  key={day.date}
                  className="flex items-center justify-center relative cursor-pointer"
                  style={{
                    gridColumn: day.dow + 1,
                    gridRow: day.week + 1,
                    height: '52px',
                  }}
                  onClick={() => {
                    if (onDaySelect) onDaySelect(day.dateStr);
                  }}
                  onMouseEnter={() => setHoveredCalDay(day.date)}
                  onMouseLeave={() => setHoveredCalDay(null)}
                  onTouchStart={() => setHoveredCalDay(day.date)}
                  onTouchEnd={() => setHoveredCalDay(null)}
                >
                  {/* Bubble circle */}
                  {day.value !== null ? (
                    <div
                      className="rounded-full flex items-center justify-center relative"
                      style={{
                        width: `${animating ? circlePx : 0}px`,
                        height: `${animating ? circlePx : 0}px`,
                        backgroundColor: getCircleColor(day.value),
                        transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                        boxShadow: isHovered
                          ? `0 0 16px ${colorHex}44, 0 0 4px ${colorHex}22`
                          : 'none',
                        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                        transitionDelay: `${day.date * 12}ms`,
                      }}
                    >
                      <span className={`text-[11px] font-bold font-mono leading-none ${
                        day.isToday ? 'text-white' : 'text-slate-200'
                      }`}>
                        {day.date}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-8 h-8 rounded-full">
                      <span className={`text-[11px] font-medium font-mono leading-none ${
                        day.isToday 
                          ? 'text-slate-100 font-bold border-b border-slate-400 pb-0.5' 
                          : 'text-slate-500/70 hover:text-slate-400 transition-colors'
                      }`}>
                        {day.date}
                      </span>
                    </div>
                  )}

                  {/* Hover tooltip - Minimal and Premium */}
                  {isHovered && day.value !== null && (
                    <div
                      className="absolute -top-7 left-1/2 -translate-x-1/2 z-20 rounded-full py-0.5 px-2 bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-200 font-mono shadow-md whitespace-nowrap pointer-events-none"
                      style={{ borderColor: `${colorHex}44` }}
                    >
                      {day.value}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Day-of-week labels at bottom */}
          <div className="grid grid-cols-7 mt-1 mb-1 -mx-5">
            {SHORT_DAYS.map((d, i) => {
              const todayDow = (() => {
                const td = new Date().getDay();
                return td === 0 ? 6 : td - 1;
              })();
              return (
                <div key={d} className="text-center">
                  <span className={`text-[10px] font-mono ${
                    i === todayDow ? 'text-slate-100 font-bold' : 'text-slate-500'
                  }`}>
                    {d}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── BAR CHART (Day / Week / Year) ──────────────────────────────── */}
      {!isMonthView && (
        <div key={activeTab} className="relative w-full overflow-hidden animate-smooth-transition">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto"
            style={{ overflow: 'visible' }}
          >
            <defs>
              <linearGradient id={gradId} x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor={colorHex} stopOpacity="0.6" />
                <stop offset="100%" stopColor={colorHex} stopOpacity="0.95" />
              </linearGradient>
              <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feFlood floodColor={colorHex} floodOpacity="0.25" result="color" />
                <feComposite in="color" in2="blur" operator="in" result="shadow" />
                <feMerge>
                  <feMergeNode in="shadow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Grid lines + Y labels */}
            {yTicks.map((tick, i) => (
              <g key={i}>
                <line
                  x1={paddingLeft} y1={tick.y}
                  x2={svgWidth - paddingRight} y2={tick.y}
                  stroke="#475569" strokeWidth="0.5" strokeOpacity="0.3" strokeDasharray="4 4"
                />
                <text
                  x={paddingLeft - 8} y={tick.y + 4}
                  textAnchor="end" fill="#94a3b8" fontSize="10" fontFamily="monospace"
                >
                  {tick.value}{yLabelSuffix}
                </text>
              </g>
            ))}

            {/* Bars */}
            {buckets.map((bucket, i) => {
              if (bucket.value === null) return null;

              const barX = getBarX(i);
              const barTopY = getY(bucket.value);
              const barBaseY = paddingTop + chartHeight;
              const fullHeight = barBaseY - barTopY;
              const isHovered = hoveredIndex === i;

              return (
                <g key={i} filter={isHovered ? `url(#${glowId})` : undefined}>
                  <rect
                    x={barX}
                    y={animating ? barTopY : barBaseY}
                    width={barWidth}
                    height={animating ? fullHeight : 0}
                    rx={3}
                    fill={`url(#${gradId})`}
                    opacity={isHovered ? 1 : 0.85}
                    style={{
                      transition: `y 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 30}ms, height 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 30}ms, opacity 0.15s ease`,
                    }}
                  />
                  {isHovered && animating && (
                    <rect
                      x={barX} y={barTopY}
                      width={barWidth} height={Math.min(3, fullHeight)}
                      rx={3} fill="#ffffff" opacity={0.5}
                      style={{ transition: 'opacity 0.15s ease' }}
                    />
                  )}
                  <rect
                    x={barX - 4} y={paddingTop}
                    width={barWidth + 8} height={chartHeight}
                    fill="transparent" className="cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onTouchStart={() => setHoveredIndex(i)}
                    onTouchEnd={() => setHoveredIndex(null)}
                    onClick={() => {
                      if (activeTab === 'Year') {
                        const today = new Date();
                        const targetYear = today.getFullYear() + currentOffset;
                        const targetDate = new Date(targetYear, i, 1);
                        const targetWeekOffset = getWeekOffset(targetDate);
                        setActiveTab('Week');
                        setCurrentOffset(targetWeekOffset);
                      }
                    }}
                  />
                </g>
              );
            })}

            {/* Average Line */}
            {hasBarData && (() => {
              const avgY = getY(barAverage);
              return (
                <g>
                  <line
                    x1={paddingLeft} y1={avgY}
                    x2={svgWidth - paddingRight} y2={avgY}
                    stroke={colorHex} strokeWidth="1" strokeDasharray="6 4" strokeOpacity="0.55"
                    style={{ transition: 'y1 0.5s ease, y2 0.5s ease' }}
                  />
                  <text
                    x={svgWidth - paddingRight + 4} y={avgY + 3}
                    fontSize="9" fontFamily="monospace" fill={colorHex} opacity="0.8"
                  >
                    {barAverage}{yLabelSuffix}
                  </text>
                </g>
              );
            })()}

            {/* X-axis Labels */}
            {buckets.map((bucket, i) => {
              if (!bucket.label) return null;
              const x = getBarX(i) + barWidth / 2;
              return (
                <text
                  key={i} x={x} y={svgHeight - 6}
                  textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="monospace"
                >
                  {bucket.label}
                </text>
              );
            })}

            {/* Empty state label centered inside the SVG grid */}
            {!hasBarData && (
              <text
                x={(svgWidth + paddingLeft - paddingRight) / 2}
                y={paddingTop + chartHeight / 2 + 4}
                textAnchor="middle"
                fill="#475569"
                fontSize="11"
                fontFamily="sans-serif"
                className="select-none font-semibold uppercase tracking-wider opacity-60"
              >
                No logs recorded
              </text>
            )}
          </svg>

          {/* Hover Tooltip - Minimalist Float Badge */}
          {hoveredIndex !== null && buckets[hoveredIndex]?.value !== null && (
            <div
              className="absolute z-10 rounded-full w-8 h-8 flex items-center justify-center border shadow-lg pointer-events-none text-xs font-bold font-mono backdrop-blur-md transition-all duration-150 ease-out"
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                borderColor: colorHex,
                left: `${Math.min(95, Math.max(5, ((getBarX(hoveredIndex) + barWidth / 2) / svgWidth) * 100))}%`,
                top: `${Math.max(2, ((getY(buckets[hoveredIndex].value!) - 32) / svgHeight) * 100)}%`,
                transform: 'translate(-50%, -20%)',
                color: '#f1f5f9',
                boxShadow: `0 0 10px ${colorHex}44`,
              }}
            >
              {Math.round(buckets[hoveredIndex].value!)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
