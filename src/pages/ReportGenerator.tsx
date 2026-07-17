import React, { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';

export const ReportGenerator: React.FC = () => {
  const { systems, events, habits, metrics, goals } = useDashboard();

  // Customizer States
  const [selectedSystems, setSelectedSystems] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    systems.forEach(s => { initial[s.id] = true; });
    return initial;
  });

  const [includeHabits, setIncludeHabits] = useState(true);
  const [includeEvents, setIncludeEvents] = useState(true);
  const [includeMetrics, setIncludeMetrics] = useState(true);
  const [includeGoals, setIncludeGoals] = useState(true);

  const [providerName, setProviderName] = useState('');
  const [providerSpecialty, setProviderSpecialty] = useState('');
  const [customNotes, setCustomNotes] = useState('');

  const toggleSystem = (id: string) => {
    setSelectedSystems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const selectAllSystems = (val: boolean) => {
    const updated: Record<string, boolean> = {};
    systems.forEach(s => { updated[s.id] = val; });
    setSelectedSystems(updated);
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter systems selected for report
  const activeReportSystems = systems.filter(s => selectedSystems[s.id]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in text-slate-200">
      
      {/* LEFT COLUMN: Customize report settings (Hidden when printing via .no-print in css) */}
      <div className="lg:col-span-4 space-y-6 no-print">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-100 m-0">
            Report Builder
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Generate and print a comprehensive clinical dossier for your healthcare providers.
          </p>
        </div>

        {/* Customization controls */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800/60 space-y-5">
          <h3 className="font-display font-semibold text-sm text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
            <LucideIcons.Settings className="w-4 h-4 text-indigo-400" />
            Report Options
          </h3>

          {/* Clinician Details */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clinician Info</h4>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Doctor's Name (e.g. Dr. Alison)"
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-850 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-200"
              />
              <input
                type="text"
                placeholder="Specialty (e.g. Cardiologist)"
                value={providerSpecialty}
                onChange={(e) => setProviderSpecialty(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-850 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-200"
              />
            </div>
          </div>

          {/* Section Toggles */}
          <div className="space-y-3 pt-2">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Report Sub-sections</h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setIncludeHabits(!includeHabits)}
                className={`py-2 px-3 rounded-xl border text-[11px] font-medium flex items-center gap-2 transition-all ${
                  includeHabits ? 'bg-indigo-600/10 border-indigo-500 text-indigo-300' : 'bg-slate-900/40 border-slate-850 text-slate-500'
                }`}
              >
                <LucideIcons.CheckSquare className="w-3.5 h-3.5" />
                <span>Habits</span>
              </button>

              <button
                onClick={() => setIncludeEvents(!includeEvents)}
                className={`py-2 px-3 rounded-xl border text-[11px] font-medium flex items-center gap-2 transition-all ${
                  includeEvents ? 'bg-indigo-600/10 border-indigo-500 text-indigo-300' : 'bg-slate-900/40 border-slate-850 text-slate-500'
                }`}
              >
                <LucideIcons.FileText className="w-3.5 h-3.5" />
                <span>Events</span>
              </button>

              <button
                onClick={() => setIncludeMetrics(!includeMetrics)}
                className={`py-2 px-3 rounded-xl border text-[11px] font-medium flex items-center gap-2 transition-all ${
                  includeMetrics ? 'bg-indigo-600/10 border-indigo-500 text-indigo-300' : 'bg-slate-900/40 border-slate-850 text-slate-500'
                }`}
              >
                <LucideIcons.Activity className="w-3.5 h-3.5" />
                <span>Metrics</span>
              </button>

              <button
                onClick={() => setIncludeGoals(!includeGoals)}
                className={`py-2 px-3 rounded-xl border text-[11px] font-medium flex items-center gap-2 transition-all ${
                  includeGoals ? 'bg-indigo-600/10 border-indigo-500 text-indigo-300' : 'bg-slate-900/40 border-slate-850 text-slate-500'
                }`}
              >
                <LucideIcons.Target className="w-3.5 h-3.5" />
                <span>Goals</span>
              </button>
            </div>
          </div>

          {/* Custom Notes */}
          <div className="space-y-2 pt-2">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Custom Notes / Directives</h4>
            <textarea
              placeholder="e.g. Discussing heart rate spike, requesting blood panel review..."
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              className="w-full bg-slate-900/60 border border-slate-850 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-200 h-20 resize-none"
            />
          </div>

          {/* System Selection List */}
          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Included Systems</h4>
              <div className="flex gap-2 text-[9px] font-semibold">
                <button onClick={() => selectAllSystems(true)} className="text-indigo-400 hover:underline">All</button>
                <span className="text-slate-700">|</span>
                <button onClick={() => selectAllSystems(false)} className="text-indigo-400 hover:underline">None</button>
              </div>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {systems.map((sys) => (
                <label 
                  key={sys.id} 
                  className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                    selectedSystems[sys.id] 
                      ? 'bg-slate-900/40 border-slate-800 text-slate-200' 
                      : 'bg-slate-950/20 border-slate-900 text-slate-500'
                  }`}
                >
                  <span>{sys.name}</span>
                  <input
                    type="checkbox"
                    checked={selectedSystems[sys.id]}
                    onChange={() => toggleSystem(sys.id)}
                    className="accent-indigo-500 rounded"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            disabled={activeReportSystems.length === 0}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/10"
          >
            <LucideIcons.Printer className="w-4 h-4" />
            <span>Open Browser Print Menu</span>
          </button>
        </div>
      </div>

      {/* RIGHT COLUMN: Document paper preview */}
      <div className="lg:col-span-8 space-y-6">
        <h2 className="font-display font-semibold text-sm text-slate-400 flex items-center gap-1.5 no-print">
          <LucideIcons.Eye className="w-4 h-4" />
          Live Document Preview (A4 Dimensions)
        </h2>

        {/* Paper Container */}
        <div className="bg-white text-slate-900 p-8 md:p-12 shadow-2xl rounded-2xl border border-slate-200 max-w-2xl mx-auto font-sans min-h-[842px] leading-relaxed">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
            <div>
              <h1 className="text-2xl font-bold font-display tracking-tight text-slate-900 m-0">
                BODYOS CLINICAL DOSSIER
              </h1>
              <p className="text-xs text-slate-500 font-mono mt-1">Generated: 2026-07-17 09:00 UTC</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono block">Patient Record</span>
              <span className="text-sm font-semibold text-slate-800">Self-Logged History</span>
            </div>
          </div>

          {/* Metadata Block (Doctor Name, Custom Instructions) */}
          {(providerName || providerSpecialty || customNotes) && (
            <div className="my-6 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
              <div className="grid grid-cols-2 gap-4 border-b border-slate-200 pb-2">
                {providerName && (
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase font-mono block">Prepared For</span>
                    <span className="font-semibold text-slate-800">{providerName}</span>
                  </div>
                )}
                {providerSpecialty && (
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase font-mono block">Specialty</span>
                    <span className="font-semibold text-slate-800">{providerSpecialty}</span>
                  </div>
                )}
              </div>
              {customNotes && (
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase font-mono block">Consultation Objectives / Notes</span>
                  <p className="text-slate-700 italic mt-0.5 whitespace-pre-wrap">{customNotes}</p>
                </div>
              )}
            </div>
          )}

          {/* Overview Grid Table */}
          <div className="my-6">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 border-b border-slate-200 pb-1">
              Systems Bio-Score Summary
            </h2>
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-300 text-slate-500 font-semibold">
                  <th className="py-2">Body System</th>
                  <th className="py-2 text-center">Current Score</th>
                  <th className="py-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {activeReportSystems.map(sys => (
                  <tr key={sys.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="py-2.5 font-semibold text-slate-800">{sys.name}</td>
                    <td className="py-2.5 text-center font-mono font-bold text-slate-800">{sys.score}%</td>
                    <td className="py-2.5 text-right font-semibold">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        sys.status === 'Optimal' ? 'text-emerald-700' :
                        sys.status === 'Stable' ? 'text-blue-700' :
                        sys.status === 'Suboptimal' ? 'text-amber-700' : 'text-rose-700'
                      }`}>
                        {sys.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* System Detailed Breakdown sections */}
          <div className="space-y-6 mt-8">
            {activeReportSystems.map(sys => {
              const sysHabits = habits.filter(h => h.systemId === sys.id && h.isActive);
              const sysEvents = events.filter(e => e.systemId === sys.id);
              const sysMetrics = metrics.filter(m => m.systemId === sys.id);
              const sysGoals = goals.filter(g => g.systemId === sys.id);

              const hasContent = 
                (includeHabits && sysHabits.length > 0) || 
                (includeEvents && sysEvents.length > 0) || 
                (includeMetrics && sysMetrics.length > 0) ||
                (includeGoals && sysGoals.length > 0);

              if (!hasContent) return null;

              return (
                <div key={sys.id} className="print-page-break border-t border-slate-200 pt-4">
                  <div className="flex justify-between items-baseline mb-3">
                    <h3 className="text-sm font-bold text-slate-900 uppercase">
                      {sys.name} System Details
                    </h3>
                    <span className="text-xs font-semibold text-slate-500 font-mono">
                      Current Score: {sys.score}% ({sys.status})
                    </span>
                  </div>

                  {/* Habits */}
                  {includeHabits && sysHabits.length > 0 && (
                    <div className="mb-3.5">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Active Protective Habits & Protocols</span>
                      <ul className="list-disc pl-4 text-xs text-slate-700 space-y-0.5 mt-1">
                        {sysHabits.map(h => (
                          <li key={h.id}>
                            <span className="font-semibold text-slate-800">{h.name}</span> 
                            <span className="text-slate-500 font-mono text-[10px]"> ({h.frequency} - Adherence: {h.adherence}%)</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Metrics Logs */}
                  {includeMetrics && sysMetrics.length > 0 && (
                    <div className="mb-3.5">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Recorded Vitals & Biometrics</span>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        {sysMetrics.slice(0, 4).map(m => (
                          <div key={m.id} className="text-xs flex justify-between bg-slate-50 p-1.5 px-2.5 rounded border border-slate-100">
                            <span className="text-slate-600 font-medium">{m.name}</span>
                            <span className="font-semibold text-slate-850 font-mono">{m.value} {m.unit} <span className="text-[9px] text-slate-400 font-normal">({m.timestamp})</span></span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Goals */}
                  {includeGoals && sysGoals.length > 0 && (
                    <div className="mb-3.5">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Current Health Targets</span>
                      <ul className="list-none text-xs space-y-1 mt-1 pl-1">
                        {sysGoals.map(g => (
                          <li key={g.id} className="flex justify-between items-center text-slate-750">
                            <span>• {g.title} {g.metricTarget && <span className="text-[10px] text-slate-500 bg-slate-50 border border-slate-100 px-1 py-0.2 rounded font-mono">Target: {g.metricTarget}</span>}</span>
                            <span className="text-[10px] font-mono text-slate-500">Status: {g.status} (by {g.targetDate})</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Medical Events timeline */}
                  {includeEvents && sysEvents.length > 0 && (
                    <div className="mb-2">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Clinical Events & Symptom Logs</span>
                      <div className="space-y-2 mt-1 pl-1">
                        {sysEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(e => (
                          <div key={e.id} className="text-xs">
                            <div className="flex justify-between text-[10px] font-mono text-slate-500 font-semibold">
                              <span>[{e.type}] {e.date}</span>
                              {e.severity && <span>Severity: {e.severity}</span>}
                            </div>
                            <h4 className="font-semibold text-slate-850 mt-0.5">{e.title}</h4>
                            <p className="text-slate-600 mt-0.5 leading-relaxed">{e.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer Disclaimer */}
          <div className="border-t border-slate-350 pt-4 mt-8 text-[9px] text-slate-400 leading-normal">
            <strong>Patient Disclaimer:</strong> The values and records listed in this document are self-reported indicators recorded through BodyOS. They are intended for reference and review by qualified healthcare professionals and do not constitute professional clinical diagnostics or therapeutic prescriptions.
          </div>
        </div>
      </div>

    </div>
  );
};
