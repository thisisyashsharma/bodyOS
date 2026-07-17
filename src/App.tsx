import React, { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { DashboardProvider, useDashboard } from './context/DashboardContext';
import { Dashboard } from './pages/Dashboard';
import { SystemDetail } from './pages/SystemDetail';
import { TimelineView } from './pages/TimelineView';
import { ReportGenerator } from './pages/ReportGenerator';

type ActivePage = 'dashboard' | 'system-detail' | 'timeline' | 'report';

const AppContent: React.FC = () => {
  const { 
    systems, 
    startTrackingSystem,
    events,
    habits,
    goals,
    metrics
  } = useDashboard();

  const [activePage, setActivePage] = useState<ActivePage>('dashboard');
  const [selectedSystemId, setSelectedSystemId] = useState<string>('respiratory');
  
  // Collapse/Expand state for untracked list in sidebar
  const [isSidebarAddOpen, setIsSidebarAddOpen] = useState(false);
  
  // Mobile UI Sidebar Drawer state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // "How to Use Guide" Modal state
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [guideStep, setGuideStep] = useState(1);
  
  // Data Privacy Modal state
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  // Helper to check if system has any history/data
  const systemHasData = (systemId: string) => {
    return events.some(e => e.systemId === systemId) ||
           habits.some(h => h.systemId === systemId) ||
           goals.some(g => g.systemId === systemId) ||
           metrics.some(m => m.systemId === systemId);
  };

  // Helper to handle system selection
  const handleSystemSelect = (systemId: string) => {
    setSelectedSystemId(systemId);
    setActivePage('system-detail');
  };

  const getSystemColorClass = (id: string) => {
    const maps: Record<string, string> = {
      cardio: 'text-rose-500', nervous: 'text-violet-500', digestive: 'text-emerald-500',
      musculoskeletal: 'text-amber-500', respiratory: 'text-cyan-500', immune: 'text-pink-500',
      endocrine: 'text-purple-500', integumentary: 'text-orange-500', urinary: 'text-sky-500',
      reproductive: 'text-rose-400'
    };
    return maps[id] || 'text-indigo-400';
  };

  const currentYear = new Date().getFullYear();

  const trackedSystems = systems.filter(s => s.isTracking);
  const untrackedSystems = systems.filter(s => !s.isTracking);

  const guideSteps = [
    {
      title: "1. Interactive Symmetrical Anatomy Spotlight",
      icon: "User",
      description: "BodyOS anchors all health logs to actual physiological organs. Tap any body part directly on the 3D-positioned symmetrical human map to highlight and inspect its status instantly.",
    },
    {
      title: "2. Live System Selection",
      icon: "PlusCircle",
      description: "Hide non-relevant params to prevent cognitive overload. Only active systems display scores on the dashboard. Add new systems to track with one click from the drawer or directory, and archive systems when inactive.",
    },
    {
      title: "3. Soothing Android Brightness Bar",
      icon: "Sliders",
      description: "Log how your body feels today with an ultra-smooth rating slider styled like a native Android brightness bar. Syncs to your wellness event log history and monthly bubble trends in real time.",
    },
    {
      title: "4. Precision Vitals & Goal Targets",
      icon: "Activity",
      description: "Toggle 'Precision Vitals' to track weighted metrics (sleep efficiency, oxygen index, resting heart rate). Add target goals (e.g. Systolic BP < 120 mmHg) and track custom protective habits.",
    },
    {
      title: "5. Integrated Timelines & Clinical Reports",
      icon: "FileText",
      description: "Browse a consolidated timeline of symptoms, consult logs, and ratings. Generate print-ready Clinical Reports to share your data with your general physician or health specialist.",
    }
  ];

  const getGuideIcon = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName] || LucideIcons.HelpCircle;
    return <Icon className="w-8 h-8 text-indigo-400" />;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased font-sans">
      
      {/* MOBILE TITLE BAR (Visible on mobile only, hidden when printing) */}
      <header className="md:hidden flex items-center justify-between px-5 py-4 border-b border-slate-900 bg-slate-950 sticky top-0 z-40 no-print">
        <div className="flex items-center gap-3">
          {/* Hamburger button to trigger sliding sidebar */}
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="text-slate-400 hover:text-white p-1 hover:bg-slate-900 rounded-md transition-all cursor-pointer"
            aria-label="Open navigation sidebar"
          >
            <LucideIcons.Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 pulsing-glow shadow-lg shadow-indigo-500/55" />
            <span className="font-display font-bold text-lg tracking-tight text-slate-100">
              Body<span className="text-indigo-500 font-extrabold">OS</span>
            </span>
          </div>
        </div>
      </header>

      {/* MOBILE SIDEBAR DRAWER (Sliding slideover overlay, hidden on desktop) */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden no-print">
          {/* Backblur overlay */}
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          
          {/* Slideover panel */}
          <div className="relative flex flex-col w-64 max-w-xs bg-slate-950 border-r border-slate-900 h-full p-5 space-y-6 shadow-2xl animate-fade-in overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 pulsing-glow shadow-lg shadow-indigo-500/50" />
                <span className="font-display font-extrabold text-lg tracking-tight text-white">
                  Body<span className="text-indigo-500 font-bold">OS</span>
                </span>
              </div>
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="text-slate-400 hover:text-white p-1 hover:bg-slate-900 rounded-lg cursor-pointer"
              >
                <LucideIcons.X className="w-4 h-4" />
              </button>
            </div>

            {/* Menu Links */}
            <div className="space-y-1">
              <button
                onClick={() => { setActivePage('dashboard'); setIsMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                  activePage === 'dashboard'
                    ? 'bg-slate-900 border border-slate-800 text-slate-100'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LucideIcons.LayoutDashboard className="w-4 h-4" />
                <span>Overview Dashboard</span>
              </button>

              <button
                onClick={() => { setActivePage('timeline'); setIsMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                  activePage === 'timeline'
                    ? 'bg-slate-900 border border-slate-800 text-slate-100'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LucideIcons.History className="w-4 h-4" />
                <span>Health History Log</span>
              </button>

              <button
                onClick={() => { setActivePage('report'); setIsMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                  activePage === 'report'
                    ? 'bg-slate-900 border border-slate-800 text-slate-100'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LucideIcons.FileText className="w-4 h-4" />
                <span>Clinical Reports</span>
              </button>
            </div>

            {/* Active Systems Index */}
            <div className="space-y-2 pt-4 border-t border-slate-900">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Tracking Index
              </span>
              <div className="space-y-0.5">
                {trackedSystems.map((sys) => {
                  const isSelected = activePage === 'system-detail' && selectedSystemId === sys.id;
                  const dotColor = getSystemColorClass(sys.id);
                  return (
                    <button
                      key={sys.id}
                      onClick={() => { handleSystemSelect(sys.id); setIsMobileSidebarOpen(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all text-left ${
                        isSelected
                          ? 'bg-slate-900/70 border border-slate-850 text-slate-100 font-semibold'
                          : 'text-slate-400 hover:text-slate-250 hover:bg-slate-900/20'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                        <span>{sys.name}</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">{sys.score}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Inactive System Accordion Mobile */}
            {untrackedSystems.length > 0 && (
              <div className="space-y-2 pt-4 border-t border-slate-900">
                <button 
                  type="button"
                  onClick={() => setIsSidebarAddOpen(!isSidebarAddOpen)}
                  className="w-full flex items-center justify-between text-[10px] font-bold text-slate-550 uppercase tracking-widest px-3 py-1.5 bg-slate-900/40 border border-slate-900 rounded-lg hover:text-slate-350 transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-1">
                    <LucideIcons.Plus className="w-3 h-3" />
                    <span>Add Systems ({untrackedSystems.length})</span>
                  </span>
                  <LucideIcons.ChevronDown className={`w-3.5 h-3.5 transition-transform ${isSidebarAddOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isSidebarAddOpen && (
                  <div className="space-y-0.5 mt-1 animate-fade-in pl-1">
                    {untrackedSystems.map((sys) => {
                      const hasHistory = systemHasData(sys.id);
                      return (
                        <div
                          key={sys.id}
                          className="group flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-350 transition-all"
                        >
                          <button
                            onClick={() => {
                              startTrackingSystem(sys.id);
                              handleSystemSelect(sys.id);
                              setIsMobileSidebarOpen(false);
                            }}
                            className="flex-grow flex items-center gap-2 text-left cursor-pointer hover:underline truncate"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                            <span className="truncate">{sys.name}</span>
                            {hasHistory && (
                              <span className="text-[8px] font-bold bg-blue-950/40 text-blue-400 border border-blue-900/20 px-1 py-0.1 rounded text-[7px] uppercase tracking-wider shrink-0 scale-95 origin-left">
                                Archived
                              </span>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              startTrackingSystem(sys.id);
                              setIsMobileSidebarOpen(false);
                            }}
                            className="p-1 rounded bg-slate-900 border border-slate-850 hover:bg-indigo-650 hover:text-white transition-all text-slate-500 cursor-pointer"
                          >
                            <LucideIcons.Plus className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Bottom settings item */}
            <div className="pt-4 mt-auto border-t border-slate-900 space-y-3">
              <button
                onClick={() => { setIsGuideOpen(true); setIsMobileSidebarOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-indigo-400 hover:text-indigo-350 hover:bg-slate-900/30 transition-all text-left cursor-pointer"
              >
                <LucideIcons.HelpCircle className="w-4 h-4" />
                <span>How to Use Guide</span>
              </button>

              <button
                onClick={() => { setIsPrivacyOpen(true); setIsMobileSidebarOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-350 hover:bg-slate-905/30 transition-all text-left cursor-pointer border border-slate-900/50 bg-slate-900/10"
              >
                <LucideIcons.ShieldAlert className="w-4 h-4 text-emerald-450" />
                <span>Data Privacy & Safety</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DESKTOP SIDEBAR NAVIGATION (Hidden on mobile and when printing) */}
      <aside 
        className="hidden md:flex w-64 border-r border-slate-900 bg-slate-950 flex-col justify-between shrink-0 no-print h-screen sticky top-0"
      >
        {/* Upper Side */}
        <div className="p-5 space-y-6 overflow-y-auto flex-grow">
          {/* Logo */}
          <div className="flex items-center gap-2.5 pb-2">
            <div className="w-3 h-3 rounded-full bg-indigo-500 pulsing-glow shadow-lg shadow-indigo-500/50" />
            <span className="font-display font-extrabold text-xl tracking-tight text-white">
              Body<span className="text-indigo-500 font-bold">OS</span>
            </span>
          </div>

          {/* Main Navigation Links */}
          <div className="space-y-1">
            <button
              onClick={() => setActivePage('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                activePage === 'dashboard'
                  ? 'bg-slate-900 border border-slate-800 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
              }`}
            >
              <LucideIcons.LayoutDashboard className="w-4 h-4" />
              <span>Overview Dashboard</span>
            </button>

            <button
              onClick={() => setActivePage('timeline')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                activePage === 'timeline'
                  ? 'bg-slate-900 border border-slate-800 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
              }`}
            >
              <LucideIcons.History className="w-4 h-4" />
              <span>Health History Log</span>
            </button>

            <button
              onClick={() => setActivePage('report')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                activePage === 'report'
                  ? 'bg-slate-900 border border-slate-800 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
              }`}
            >
              <LucideIcons.FileText className="w-4 h-4" />
              <span>Clinical Reports</span>
            </button>
          </div>

          {/* Active Live Systems Sub-navigation */}
          <div className="space-y-2 pt-4 border-t border-slate-900">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Tracking Index
            </span>
            <div className="space-y-0.5">
              {trackedSystems.map((sys) => {
                const isSelected = activePage === 'system-detail' && selectedSystemId === sys.id;
                const dotColor = getSystemColorClass(sys.id);
                return (
                  <button
                    key={sys.id}
                    onClick={() => handleSystemSelect(sys.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all text-left ${
                      isSelected
                        ? 'bg-slate-900/70 border border-slate-850 text-slate-100 font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/20'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                      <span>{sys.name}</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{sys.score}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Collapsible Add Systems Menu in Sidebar */}
          {untrackedSystems.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-slate-900">
              <button 
                type="button"
                onClick={() => setIsSidebarAddOpen(!isSidebarAddOpen)}
                className="w-full flex items-center justify-between text-[10px] font-bold text-slate-550 uppercase tracking-widest px-3 py-1 bg-slate-900/20 border border-slate-900 rounded-lg hover:text-slate-350 transition-all cursor-pointer"
              >
                <span className="flex items-center gap-1">
                  <LucideIcons.Plus className="w-3 h-3" />
                  <span>Add Systems ({untrackedSystems.length})</span>
                </span>
                <LucideIcons.ChevronDown className={`w-3.5 h-3.5 transition-transform ${isSidebarAddOpen ? 'rotate-180' : ''}`} />
              </button>

              {isSidebarAddOpen && (
                <div className="space-y-0.5 mt-1.5 animate-fade-in pl-1">
                  {untrackedSystems.map((sys) => {
                    const hasHistory = systemHasData(sys.id);
                    return (
                      <div
                        key={sys.id}
                        className="group flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium text-slate-550 hover:text-slate-300 transition-all text-left"
                      >
                        <button
                          onClick={() => {
                            startTrackingSystem(sys.id);
                            handleSystemSelect(sys.id);
                          }}
                          className="flex-grow flex items-center gap-2 text-left cursor-pointer hover:underline truncate"
                          title="Click to track & view detail"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-800 group-hover:bg-slate-650" />
                          <span className="truncate">{sys.name}</span>
                          {hasHistory && (
                            <span className="text-[8px] font-bold bg-blue-950/40 text-blue-400 border border-blue-900/20 px-1.5 py-0.1 rounded text-[7px] uppercase tracking-wider shrink-0 scale-95 origin-left">
                              Archived
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => startTrackingSystem(sys.id)}
                          className="p-1 rounded bg-slate-900 border border-slate-850 hover:bg-indigo-650 hover:text-white transition-all text-slate-500 cursor-pointer opacity-0 group-hover:opacity-100"
                          title={`Add ${sys.name} to tracking`}
                        >
                          <LucideIcons.Plus className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Lower Side / Settings Link */}
        <div className="p-5 border-t border-slate-900 space-y-4">
          <button
            onClick={() => setIsGuideOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-indigo-400 hover:text-indigo-350 hover:bg-slate-900/30 transition-all text-left cursor-pointer border border-indigo-900/10 bg-indigo-950/5"
          >
            <LucideIcons.HelpCircle className="w-4 h-4" />
            <span>How to Use Guide</span>
          </button>

          <button
            onClick={() => setIsPrivacyOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-350 hover:bg-slate-905/30 transition-all text-left cursor-pointer border border-slate-900/50 bg-slate-900/10"
          >
            <LucideIcons.ShieldAlert className="w-4 h-4 text-emerald-450" />
            <span>Data Privacy & Safety</span>
          </button>

          <div className="text-[10px] text-slate-600">
            <p>© {currentYear} BodyOS Dashboard.</p>
          </div>
        </div>
      </aside>

      {/* FLOATING BOTTOM NAV BAR FOR MOBILE (Solid color, fully opaque to prevent visual overlap) */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 h-16 bg-slate-950 border border-slate-900 shadow-2xl flex items-center justify-around px-2 py-1 max-w-md mx-auto no-print z-40 rounded-2xl">
        <button 
          onClick={() => setActivePage('dashboard')}
          className={`flex flex-col items-center justify-center gap-1 w-16 h-12 rounded-xl transition-all ${
            activePage === 'dashboard' ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500'
          }`}
        >
          <LucideIcons.LayoutDashboard className="w-5 h-5" />
          <span className="text-[9px] font-bold">Dashboard</span>
        </button>
        
        <button 
          onClick={() => setActivePage('timeline')}
          className={`flex flex-col items-center justify-center gap-1 w-16 h-12 rounded-xl transition-all ${
            activePage === 'timeline' ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500'
          }`}
        >
          <LucideIcons.History className="w-5 h-5" />
          <span className="text-[9px] font-bold">History</span>
        </button>

        <button 
          onClick={() => setActivePage('report')}
          className={`flex flex-col items-center justify-center gap-1 w-16 h-12 rounded-xl transition-all ${
            activePage === 'report' ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500'
          }`}
        >
          <LucideIcons.FileText className="w-5 h-5" />
          <span className="text-[9px] font-bold">Reports</span>
        </button>
      </nav>

      {/* MAIN VIEWPORT PANEL (With bottom padding on mobile to clear the floating nav) */}
      <main className="flex-grow p-4 md:p-8 min-h-[calc(100vh-62px)] md:h-screen md:overflow-y-auto no-scrollbar pb-24 md:pb-8 print:p-0 print:overflow-visible">
        {activePage === 'dashboard' && (
          <Dashboard onNavigateToSystem={handleSystemSelect} />
        )}
        {activePage === 'system-detail' && (
          <SystemDetail
            systemId={selectedSystemId}
            onBack={() => setActivePage('dashboard')}
          />
        )}
        {activePage === 'timeline' && <TimelineView />}
        {activePage === 'report' && <ReportGenerator />}
      </main>

      {/* GUIDE MODAL (How to Use App) */}
      {isGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in no-print">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 relative flex flex-col justify-between">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-indigo-400">
                <LucideIcons.BookOpen className="w-5 h-5" />
                <h3 className="font-display font-bold text-base text-slate-100">
                  How to Use BodyOS
                </h3>
              </div>
              <button
                onClick={() => { setIsGuideOpen(false); setGuideStep(1); }}
                className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                <LucideIcons.X className="w-4 h-4" />
              </button>
            </div>

            {/* Step Body (Transitioning slides) */}
            <div className="flex-grow py-4 flex flex-col items-center text-center space-y-4 min-h-[160px] justify-center">
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                {getGuideIcon(guideSteps[guideStep - 1].icon)}
              </div>
              <div className="space-y-2">
                <h4 className="font-display font-semibold text-slate-100 text-sm md:text-base">
                  {guideSteps[guideStep - 1].title}
                </h4>
                <p className="text-xs text-slate-455 max-w-md leading-relaxed">
                  {guideSteps[guideStep - 1].description}
                </p>
              </div>
            </div>

            {/* Stepper Dots & Navigation buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <div className="flex gap-1.5">
                {guideSteps.map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all ${
                      guideStep === i + 1 ? 'bg-indigo-500 w-5' : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>

              <div className="flex gap-2">
                {guideStep > 1 && (
                  <button
                    onClick={() => setGuideStep(s => s - 1)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-350 text-xs font-semibold transition-all cursor-pointer"
                  >
                    Back
                  </button>
                )}
                {guideStep < guideSteps.length ? (
                  <button
                    onClick={() => setGuideStep(s => s + 1)}
                    className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-indigo-600/10"
                  >
                    Next Step
                  </button>
                ) : (
                  <button
                    onClick={() => { setIsGuideOpen(false); setGuideStep(1); }}
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-emerald-600/10"
                  >
                    Got It!
                  </button>
                )}
              </div>
            </div>
            
          </div>
        </div>
      )}

      {/* DATA PRIVACY & SAFETY MODAL */}
      {isPrivacyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/80 backdrop-blur-md animate-fade-in no-print">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 relative">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <LucideIcons.ShieldCheck className="w-5 h-5" />
                <h3 className="font-display font-bold text-base text-slate-100">
                  Your Data Privacy & Safety
                </h3>
              </div>
              <button
                onClick={() => setIsPrivacyOpen(false)}
                className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                <LucideIcons.X className="w-4 h-4" />
              </button>
            </div>

            {/* Chunked simple explanations for all age groups */}
            <div className="space-y-4 py-2">
              <p className="text-xs text-slate-350 leading-relaxed">
                BodyOS is designed to keep your health details private, secure, and completely under your own control. Here is how we safeguard your details in simple terms:
              </p>

              <div className="space-y-3.5">
                <div className="flex items-start gap-3">
                  <div className="text-lg p-1.5 bg-slate-950/60 border border-slate-850 rounded-xl shrink-0">🏠</div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">Stays in Your Home</h4>
                    <p className="text-[11px] text-slate-455 leading-relaxed mt-0.5">
                      Your health inputs are kept entirely on this tablet, phone, or computer. They are never sent to our servers, and we never collect, read, or sell your logs.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="text-lg p-1.5 bg-slate-950/60 border border-slate-850 rounded-xl shrink-0">🔌</div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">Works Without Wi-Fi</h4>
                    <p className="text-[11px] text-slate-455 leading-relaxed mt-0.5">
                      You can use this app fully offline. All ratings, symptoms, and vitals are saved locally in your own browser's private storage vault.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="text-lg p-1.5 bg-slate-950/60 border border-slate-850 rounded-xl shrink-0">🔒</div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">No Accounts or Passwords</h4>
                    <p className="text-[11px] text-slate-455 leading-relaxed mt-0.5">
                      Since there are no online profiles, there is nothing for hackers to breach. Your records are only visible to anyone who can hold this physical device.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="text-lg p-1.5 bg-slate-950/60 border border-slate-850 rounded-xl shrink-0">🗑️</div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">Simple to Delete</h4>
                    <p className="text-[11px] text-slate-455 leading-relaxed mt-0.5">
                      You hold the key. If you decide to wipe your data, it disappears instantly and irreversibly from this machine forever.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer button */}
            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setIsPrivacyOpen(false)}
                className="px-5 py-2 rounded-xl bg-emerald-650 hover:bg-emerald-550 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-emerald-600/10"
              >
                Close & Confirm
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

function App() {
  return (
    <DashboardProvider>
      <AppContent />
    </DashboardProvider>
  );
}

export default App;
