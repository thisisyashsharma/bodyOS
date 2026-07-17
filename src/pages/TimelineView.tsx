import React, { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import type { EventType } from '../types';

export const TimelineView: React.FC = () => {
  const { events, systems, deleteEvent } = useDashboard();
  
  // Filter States
  const [selectedSystem, setSelectedSystem] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Color mapping by system ID for visual tags
  const systemColors: Record<string, string> = {
    cardio: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    nervous: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    digestive: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    musculoskeletal: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    respiratory: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    immune: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    endocrine: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    integumentary: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    urinary: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    reproductive: 'bg-rose-400/10 text-rose-300 border-rose-400/20',
  };

  const getSystemName = (id: string) => {
    return systems.find(s => s.id === id)?.name || id;
  };

  // Perform filtration
  const filteredEvents = events.filter((ev) => {
    const matchesSystem = selectedSystem === 'all' || ev.systemId === selectedSystem;
    const matchesType = selectedType === 'all' || ev.type === selectedType;
    const matchesSeverity = selectedSeverity === 'all' || ev.severity === selectedSeverity;
    
    const term = searchQuery.toLowerCase().trim();
    const matchesSearch = !term || 
      ev.title.toLowerCase().includes(term) || 
      ev.description.toLowerCase().includes(term) ||
      getSystemName(ev.systemId).toLowerCase().includes(term);

    return matchesSystem && matchesType && matchesSeverity && matchesSearch;
  });

  // Perform Sorting
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const timeA = new Date(a.date).getTime();
    const timeB = new Date(b.date).getTime();
    return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
  });

  const eventTypes: EventType[] = ['Symptom', 'Diagnosis', 'Surgery', 'Test Result', 'Checkup', 'Medication Change'];

  return (
    <div className="space-y-6 animate-fade-in text-slate-200">
      {/* Title */}
      <div>
        <h1 className="font-display font-bold text-2xl md:text-3xl text-slate-100 m-0">
          Chronological Health Timeline
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Review all logged medical symptoms, consultations, biometrics updates, and clinical interventions.
        </p>
      </div>

      {/* Filters Panel */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800/60 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
          <LucideIcons.Filter className="w-4 h-4 text-indigo-400" />
          Filter Log Entries
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search title, details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/60 border border-slate-850 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-200"
            />
            <LucideIcons.Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          </div>

          {/* System Selection */}
          <select
            value={selectedSystem}
            onChange={(e) => setSelectedSystem(e.target.value)}
            className="bg-slate-900/60 border border-slate-850 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-300"
          >
            <option value="all">All Systems</option>
            {systems.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {/* Event Type Selection */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-900/60 border border-slate-850 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-300"
          >
            <option value="all">All Event Categories</option>
            {eventTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Sorting */}
          <select
            value={sortOrder}
            onChange={(e: any) => setSortOrder(e.target.value)}
            className="bg-slate-900/60 border border-slate-850 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-300"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
          </select>
        </div>

        {/* Extended filter for severity (symptoms only) */}
        {(selectedType === 'all' || selectedType === 'Symptom') && (
          <div className="flex items-center gap-3 pt-2 border-t border-slate-850 animate-fade-in">
            <span className="text-[10px] font-semibold text-slate-400">Severity filter:</span>
            <div className="flex gap-1.5">
              {['all', 'Mild', 'Moderate', 'Severe'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSelectedSeverity(sev)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                    selectedSeverity === sev
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {sev === 'all' ? 'All' : sev}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Timeline List */}
      {sortedEvents.length > 0 ? (
        <div className="relative pl-6 border-l-2 border-slate-800 space-y-6 ml-2">
          {sortedEvents.map((ev) => {
            const systemStyle = systemColors[ev.systemId] || 'bg-slate-800 text-slate-300';
            return (
              <div 
                key={ev.id} 
                className="relative glass-panel rounded-2xl p-5 border border-slate-800/50 hover:border-slate-700/60 transition-all flex flex-col md:flex-row md:items-start justify-between gap-4 group"
              >
                {/* Timeline dot */}
                <span className={`absolute -left-[32px] top-6 w-3 h-3 rounded-full bg-slate-950 border-2 ${
                  ev.type === 'Symptom' ? 'border-rose-500' :
                  ev.type === 'Diagnosis' ? 'border-amber-500' :
                  ev.type === 'Surgery' ? 'border-violet-500' : 'border-indigo-400'
                }`} />

                <div className="space-y-2 flex-grow">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-indigo-400">{ev.date}{ev.time && ` @ ${ev.time}`}</span>
                    
                    {/* System Tag */}
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${systemStyle}`}>
                      {getSystemName(ev.systemId)}
                    </span>
                    
                    {/* Event Type Tag */}
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-800/80 text-slate-400 font-mono">
                      {ev.type}
                    </span>

                    {/* Symptom Severity Tag */}
                    {ev.severity && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                        ev.severity === 'Severe' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        ev.severity === 'Moderate' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {ev.severity}
                      </span>
                    )}
                  </div>

                  <h3 className="font-display font-semibold text-sm md:text-base text-slate-100 mt-1">
                    {ev.title}
                  </h3>
                  
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {ev.description}
                  </p>

                  {ev.notes && (
                    <div className="mt-2 text-[11px] text-slate-500 bg-slate-950/40 p-2.5 rounded-lg border border-slate-900">
                      <span className="font-semibold block text-slate-400 text-[10px] uppercase mb-0.5">Notes</span>
                      {ev.notes}
                    </div>
                  )}
                </div>

                <div className="flex md:flex-col items-center justify-end gap-2 shrink-0">
                  <button
                    onClick={() => {
                      if (window.confirm("Are you sure you want to delete this event?")) {
                        deleteEvent(ev.id);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-slate-900 hover:bg-rose-950/30 border border-slate-800 hover:border-rose-900/30 text-slate-500 hover:text-rose-400 transition-all"
                  >
                    <LucideIcons.Trash className="w-3.5 h-3.5" />
                    <span>Delete Record</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-panel rounded-2xl p-10 text-center border border-slate-800/60 space-y-3">
          <LucideIcons.SearchX className="w-8 h-8 text-slate-600 mx-auto" />
          <h3 className="font-display font-semibold text-slate-300">No events matched the filters</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query, selecting different system categories, or resetting the filters.
          </p>
          <button
            onClick={() => {
              setSelectedSystem('all');
              setSelectedType('all');
              setSelectedSeverity('all');
              setSearchQuery('');
            }}
            className="text-xs font-semibold text-indigo-400 hover:underline mt-2"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};
