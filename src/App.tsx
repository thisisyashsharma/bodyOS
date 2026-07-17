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
  const [selectedSystemId, setSelectedSystemId] = useState<string>('cardio');

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased font-sans">
      
      {/* MOBILE TITLE BAR (Visible on mobile only, hidden when printing) */}
      <header className="md:hidden flex items-center justify-between px-5 py-4 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 no-print">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 pulsing-glow shadow-lg shadow-indigo-500/55" />
          <span className="font-display font-bold text-lg tracking-tight text-slate-100">
            Body<span className="text-indigo-500 font-extrabold">OS</span>
          </span>
        </div>
      </header>

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

          {/* Add Systems to Track sub-navigation */}
          {untrackedSystems.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-slate-900">
              <span className="text-[10px] font-bold text-slate-550 uppercase tracking-widest px-3 flex items-center gap-1">
                <LucideIcons.Plus className="w-3 h-3" />
                Add Systems to Track
              </span>
              <div className="space-y-0.5">
                {untrackedSystems.map((sys) => {
                  const hasHistory = systemHasData(sys.id);
                  return (
                    <div
                      key={sys.id}
                      className="group flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-300 transition-all text-left"
                    >
                      <button
                        onClick={() => {
                          startTrackingSystem(sys.id);
                          handleSystemSelect(sys.id);
                        }}
                        className="flex-grow flex items-center gap-2 text-left cursor-pointer hover:underline"
                        title="Click to track & view detail"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-slate-500" />
                        <span className="truncate">{sys.name}</span>
                        {hasHistory && (
                          <span className="text-[8px] font-bold bg-blue-950/40 text-blue-400/90 border border-blue-900/20 px-1 py-0.1 rounded text-[7px] uppercase tracking-wider shrink-0 scale-95 origin-left">
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
            </div>
          )}
        </div>

        {/* Lower Side */}
        <div className="p-5 border-t border-slate-900 text-[10px] text-slate-600">
          <p>© {currentYear} BodyOS Dashboard.</p>
        </div>
      </aside>

      {/* FLOATING BOTTOM NAV BAR FOR MOBILE (Android App Feel) */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 h-16 glass-panel rounded-2xl z-40 border border-slate-800/80 shadow-2xl flex items-center justify-around px-2 py-1 max-w-md mx-auto no-print">
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
