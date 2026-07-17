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

interface HourlyBucket {
  hour: number;
  label: string;
  timeLabel: string;
  value: number | null;
  phase: 'Night' | 'Morning' | 'Midday' | 'Evening';
}

function buildDayBuckets(data: ChartDataPoint[], offset: number): { buckets: Bucket[]; hourlyBuckets: HourlyBucket[]; rangeLabel: string; dayAverage: number } {
  const today = new Date();
  const target = addDays(today, offset);
  const key = formatYMD(target);
  const match = data.find(d => d.date === key);

  const label = target.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const rangeLabel = target.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const hourlyBuckets: HourlyBucket[] = [];
  let sum = 0;
  let count = 0;

  for (let h = 0; h < 24; h++) {
    const formattedHour = String(h).padStart(2, '0');
    const hourlyMatch = data.find(d => 
      d.date === `${key}T${formattedHour}` || 
      d.date.startsWith(`${key}T${formattedHour}`) || 
      d.date.startsWith(`${key} ${formattedHour}`)
    );
    
    let val: number | null = hourlyMatch ? hourlyMatch.value : null;
    const hasAnyHourlyMatches = data.some(d => d.date.startsWith(`${key}T`));
    if (val === null && !hasAnyHourlyMatches && match && h === 9) {
      val = match.value;
    }

    if (val !== null) {
      sum += val;
      count++;
    }

    const hourLabel = h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;
    const phase: 'Night' | 'Morning' | 'Midday' | 'Evening' =
      h < 6 ? 'Night' : h < 12 ? 'Morning' : h < 18 ? 'Midday' : 'Evening';

    hourlyBuckets.push({
      hour: h,
      label: hourLabel,
      timeLabel: `${String(h % 12 === 0 ? 12 : h % 12).padStart(2, '0')}:00 ${h >= 12 ? 'PM' : 'AM'}`,
      value: val,
      phase,
    });
  }

  const dayAverage = count > 0 ? Math.round((sum / count) * 10) / 10 : (match ? match.value : 0);

  return {
    buckets: [{
      label,
      value: match ? match.value : null,
      dateLabel: rangeLabel,
    }],
    hourlyBuckets,
    rangeLabel,
    dayAverage,
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
  const [selectedCalDay, setSelectedCalDay] = useState<number | null>(null);
  const [ripplingDay, setRipplingDay] = useState<number | null>(null);
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);
  const [hoveredWeekDay, setHoveredWeekDay] = useState<number | null>(null);

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
  const isDayView = activeTab === 'Day';
  const isWeekView = activeTab === 'Week';

  // ── Compute Day Data ────────────────────────────────────────────────────
  const dayData = useMemo(() => {
    if (!isDayView) return null;
    return buildDayBuckets(data, currentOffset);
  }, [data, currentOffset, isDayView]);

  // ── Compute 3-Week Carousel Data (Prev, Curr, Next) ─────────────────────
  const weekData = useMemo(() => {
    if (!isWeekView) return null;
    return {
      prev: buildWeekBuckets(data, currentOffset - 1),
      curr: buildWeekBuckets(data, currentOffset),
      next: buildWeekBuckets(data, currentOffset + 1),
    };
  }, [data, currentOffset, isWeekView]);

  // ── Compute bar buckets (for Day/Week/Year) ─────────────────────────────
  const { buckets, rangeLabel: barRangeLabel } = useMemo(() => {
    switch (activeTab) {
      case 'Day':   return dayData ?? buildDayBuckets(data, currentOffset);
      case 'Week':  return weekData?.curr ?? buildWeekBuckets(data, currentOffset);
      case 'Year':  return buildYearBuckets(data, currentOffset);
      default:      return { buckets: [] as Bucket[], rangeLabel: '' };
    }
  }, [data, activeTab, currentOffset, dayData, weekData]);

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
    return `${colorHex}80`; // Exactly 50% opacity
  };

  const getBioGlowShadow = (value: number | null): string => {
    if (value === null) return 'none';
    if (value >= 8) {
      return `0 0 16px ${colorHex}88, 0 0 4px ${colorHex}44`;
    } else if (value >= 5) {
      return `0 0 10px ${colorHex}33`;
    } else {
      return `0 0 12px rgba(244, 63, 94, 0.45)`;
    }
  };

  return (
    <div 
      className="w-full flex flex-col select-none overflow-visible"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Header: Title + Tabs ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
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
        <div className="text-center min-w-[140px] sm:min-w-[160px]">
          <span className="text-slate-200 text-xs sm:text-sm font-semibold font-display block">
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
        <div className="w-full animate-smooth-transition overflow-visible rounded-2xl">
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-y-1 mb-2 relative overflow-visible">
            {monthCalendar.days.map((day) => {
              const ratio = getCircleSize(day.value);
              const minPx = 18;
              const maxPx = 66; // Guarantees 10-rating circles overlap seamlessly at edges on all screen sizes
              const circlePx = day.value !== null ? minPx + ratio * (maxPx - minPx) : 0;
              const isHovered = hoveredCalDay === day.date;
              const isSelected = selectedCalDay === day.date;
              const isOtherSelected = selectedCalDay !== null && !isSelected;
              const isRippling = ripplingDay === day.date;

              let scaleVal = isHovered ? 1.15 : (day.value !== null && day.value >= 9 ? 1.14 : 1);
              if (isSelected) scaleVal = 1.25;
              if (isOtherSelected) scaleVal = 0.9;

              return (
                <div
                  key={day.date}
                  className="flex items-center justify-center relative cursor-pointer select-none overflow-visible transition-all duration-300"
                  style={{
                    gridColumn: day.dow + 1,
                    gridRow: day.week + 1,
                    height: '50px',
                    opacity: isOtherSelected ? 0.35 : 1,
                  }}
                  onMouseEnter={() => setHoveredCalDay(day.date)}
                  onMouseLeave={() => setHoveredCalDay(null)}
                  onTouchStart={() => setHoveredCalDay(day.date)}
                  onTouchEnd={() => setHoveredCalDay(null)}
                  onClick={() => {
                    setRipplingDay(day.date);
                    setTimeout(() => setRipplingDay(null), 600);
                    setSelectedCalDay(prev => prev === day.date ? null : day.date);
                    if (onDaySelect) onDaySelect(day.dateStr);
                  }}
                >
                  {/* Liquid Water Ripple on Tap/Click */}
                  {isRippling && (
                    <div className="absolute w-8 h-8 rounded-full border border-indigo-400/80 pointer-events-none animate-water-ripple z-20" />
                  )}

                  {/* Bubble circle */}
                  {day.value !== null ? (
                    <div
                      className={`rounded-full flex items-center justify-center relative z-10 shrink-0 ${
                        animating ? 'animate-spring-pop' : ''
                      }`}
                      style={{
                        width: `${animating ? circlePx : 0}px`,
                        height: `${animating ? circlePx : 0}px`,
                        backgroundColor: getCircleColor(day.value),
                        transform: `scale(${scaleVal})`,
                        boxShadow: isSelected
                          ? `0 0 20px ${colorHex}aa, 0 0 6px ${colorHex}66`
                          : getBioGlowShadow(day.value),
                        transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease, width 0.3s ease, height 0.3s ease',
                        transitionDelay: `${day.date * 10}ms`,
                      }}
                    >
                      <span className={`text-[11px] font-bold font-mono leading-none ${
                        day.isToday ? 'text-white' : 'text-slate-100'
                      }`}>
                        {day.date}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-8 h-8 rounded-full z-10">
                      {!animating ? (
                        <div className="w-5 h-5 rounded-full bg-slate-800/40 animate-pulse" />
                      ) : (
                        <span className={`text-[11px] font-medium font-mono leading-none ${
                          day.isToday 
                            ? 'text-slate-100 font-bold border-b border-slate-400 pb-0.5' 
                            : 'text-slate-500/70 hover:text-slate-400 transition-colors'
                        }`}>
                          {day.date}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Hover tooltip - Minimalist Micro-Preview */}
                  {isHovered && day.value !== null && (
                    <div
                      className="absolute -top-7 left-1/2 -translate-x-1/2 z-30 rounded-full py-0.5 px-2 bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-200 font-mono shadow-xl whitespace-nowrap pointer-events-none flex items-center gap-1"
                      style={{ borderColor: `${colorHex}66` }}
                    >
                      <span style={{ color: colorHex }}>{day.value}/10</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Day-of-week labels at bottom */}
          <div className="grid grid-cols-7 mt-1 mb-1">
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

      {/* ── 24-HOUR MINIMALIST HOURLY BIO-MATRIX (Day View) ────────────────── */}
      {isDayView && dayData && (
        <div className="w-full animate-smooth-transition space-y-2">
          {/* 24-Hour Timeline Grid Container */}
          <div className="relative w-full h-36 p-2 flex items-end justify-between gap-1 overflow-visible">
            {dayData.hourlyBuckets.map((hb) => {
              const isHovered = hoveredHour === hb.hour;
              const pillHeightPx = hb.value !== null ? Math.max(18, Math.round((hb.value / 10) * 90)) : 0;

              return (
                <div
                  key={hb.hour}
                  className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer"
                  onMouseEnter={() => setHoveredHour(hb.hour)}
                  onMouseLeave={() => setHoveredHour(null)}
                  onTouchStart={() => setHoveredHour(hb.hour)}
                  onTouchEnd={() => setHoveredHour(null)}
                >
                  {hb.value !== null ? (
                    <div
                      className={`w-full max-w-[12px] sm:max-w-[16px] rounded-full relative z-10 flex items-center justify-center transition-all duration-300 ${
                        animating ? 'animate-spring-pop' : ''
                      }`}
                      style={{
                        height: `${animating ? pillHeightPx : 0}px`,
                        backgroundColor: `${colorHex}80`,
                        transform: isHovered ? 'scale(1.2)' : 'scale(1)',
                        boxShadow: isHovered ? `0 0 14px ${colorHex}aa` : `0 0 8px ${colorHex}33`,
                        transitionDelay: `${hb.hour * 10}ms`,
                      }}
                    >
                      <span className="text-[9px] font-bold font-mono text-white leading-none">
                        {hb.value}
                      </span>
                    </div>
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-800/60 group-hover:bg-slate-700 transition-colors mb-1" />
                  )}

                  {/* Hover micro tooltip */}
                  {isHovered && (
                    <div
                      className="absolute -top-8 left-1/2 -translate-x-1/2 z-30 rounded-full py-0.5 px-2 bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-200 font-mono shadow-xl whitespace-nowrap pointer-events-none flex items-center gap-1"
                      style={{ borderColor: `${colorHex}66` }}
                    >
                      <span>{hb.timeLabel}</span>
                      {hb.value !== null && (
                        <span style={{ color: colorHex }}>• {hb.value}/10</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Baseline Hour Markers */}
          <div className="flex justify-between text-[9px] font-mono text-slate-500 px-1 pt-1">
            <span>12 AM</span>
            <span>3 AM</span>
            <span>6 AM</span>
            <span>9 AM</span>
            <span>12 PM</span>
            <span>3 PM</span>
            <span>6 PM</span>
            <span>9 PM</span>
          </div>
        </div>
      )}

      {/* ── 7-DAY MINIMALIST WEEK MATRIX CAROUSEL (Week View) ────────────────── */}
      {isWeekView && weekData && (
        <div className="w-full animate-smooth-transition space-y-2 select-none">
          {/* Slidable 3-Week Carousel Container */}
          <div className="relative w-full flex items-center justify-between gap-1.5 sm:gap-3 overflow-visible py-1">
            
            {/* 1. PREVIOUS WEEK (Faded 35% Opacity, Clickable) */}
            <div
              onClick={handlePrev}
              className="w-1/4 sm:w-1/5 shrink-0 opacity-35 hover:opacity-75 scale-95 transition-all duration-300 cursor-pointer"
              title="Slide to previous week"
            >
              <div className="text-[9px] font-mono text-slate-400 text-center mb-1 truncate font-medium">
                {weekData.prev.rangeLabel}
              </div>
              <div className="h-28 bg-slate-950/30 rounded-2xl p-1.5 flex items-end justify-between gap-0.5 border border-slate-800/40">
                {weekData.prev.buckets.map((b, i) => {
                  const pHeightPx = b.value !== null ? Math.max(12, Math.round((b.value / 10) * 70)) : 0;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                      {b.value !== null ? (
                        <div
                          className="w-full max-w-[8px] rounded-full"
                          style={{ height: `${pHeightPx}px`, backgroundColor: `${colorHex}60` }}
                        />
                      ) : (
                        <div className="w-1 h-1 rounded-full bg-slate-800/40 mb-1" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. CURRENT WEEK (Active 100% Opacity, Main 7-Day Matrix) */}
            <div className="flex-1 scale-100 opacity-100 transition-all duration-300">
              <div className="h-36 p-2 flex items-end justify-between gap-1.5 sm:gap-2 overflow-visible">
                {weekData.curr.buckets.map((b, i) => {
                  const isHovered = hoveredWeekDay === i;
                  const pHeightPx = b.value !== null ? Math.max(18, Math.round((b.value / 10) * 90)) : 0;

                  return (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer"
                      onMouseEnter={() => setHoveredWeekDay(i)}
                      onMouseLeave={() => setHoveredWeekDay(null)}
                      onTouchStart={() => setHoveredWeekDay(i)}
                      onTouchEnd={() => setHoveredWeekDay(null)}
                      onClick={() => {
                        const targetDate = addDays(startOfWeek(addDays(new Date(), currentOffset * 7)), i);
                        if (onDaySelect) onDaySelect(formatYMD(targetDate));
                      }}
                    >
                      {b.value !== null ? (
                        <div
                          className={`w-full max-w-[20px] sm:max-w-[26px] rounded-full relative z-10 flex items-center justify-center transition-all duration-300 ${
                            animating ? 'animate-spring-pop' : ''
                          }`}
                          style={{
                            height: `${animating ? pHeightPx : 0}px`,
                            backgroundColor: `${colorHex}80`, // 50% opacity
                            transform: isHovered ? 'scale(1.15)' : 'scale(1)',
                            boxShadow: isHovered ? `0 0 16px ${colorHex}aa` : `0 0 8px ${colorHex}33`,
                            transitionDelay: `${i * 15}ms`,
                          }}
                        >
                          <span className="text-[11px] font-bold font-mono text-white leading-none">
                            {b.value}
                          </span>
                        </div>
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-slate-800/60 group-hover:bg-slate-700 transition-colors mb-1" />
                      )}

                      {/* Hover micro tooltip */}
                      {isHovered && (
                        <div
                          className="absolute -top-8 left-1/2 -translate-x-1/2 z-30 rounded-full py-0.5 px-2 bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-200 font-mono shadow-xl whitespace-nowrap pointer-events-none flex items-center gap-1"
                          style={{ borderColor: `${colorHex}66` }}
                        >
                          <span>{b.dateLabel} ({b.label})</span>
                          {b.value !== null && (
                            <span style={{ color: colorHex }}>• {b.value}/10</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Baseline Day Markers */}
              <div className="grid grid-cols-7 text-center text-[10px] font-mono text-slate-400 mt-1">
                {SHORT_DAYS.map((d, i) => {
                  const todayDow = (() => {
                    const td = new Date().getDay();
                    return td === 0 ? 6 : td - 1;
                  })();
                  return (
                    <span key={d} className={i === todayDow && currentOffset === 0 ? 'text-slate-100 font-bold' : 'text-slate-500'}>
                      {d}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* 3. NEXT WEEK (Faded 35% Opacity, Clickable if offset < 0) */}
            <div
              onClick={() => {
                if (currentOffset < 0) handleNext();
              }}
              className={`w-1/4 sm:w-1/5 shrink-0 transition-all duration-300 select-none ${
                currentOffset >= 0
                  ? 'opacity-15 cursor-not-allowed scale-95'
                  : 'opacity-35 hover:opacity-75 scale-95 cursor-pointer'
              }`}
              title={currentOffset < 0 ? "Slide to next week" : "Future week"}
            >
              <div className="text-[9px] font-mono text-slate-400 text-center mb-1 truncate font-medium">
                {weekData.next.rangeLabel}
              </div>
              <div className="h-28 bg-slate-950/30 rounded-2xl p-1.5 flex items-end justify-between gap-0.5 border border-slate-850/40">
                {weekData.next.buckets.map((b, i) => {
                  const pHeightPx = b.value !== null ? Math.max(12, Math.round((b.value / 10) * 70)) : 0;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                      {b.value !== null ? (
                        <div
                          className="w-full max-w-[8px] rounded-full"
                          style={{ height: `${pHeightPx}px`, backgroundColor: `${colorHex}60` }}
                        />
                      ) : (
                        <div className="w-1 h-1 rounded-full bg-slate-800/40 mb-1" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── BAR CHART (Year View) ──────────────────────────────── */}
      {!isMonthView && !isDayView && !isWeekView && (
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
