import React, { useState, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import type { EventType } from '../types';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSystemId?: string;
}

const COMMON_METRICS = [
  { name: 'Resting Heart Rate', unit: 'bpm', systemId: 'cardio' },
  { name: 'Systolic Blood Pressure', unit: 'mmHg', systemId: 'cardio' },
  { name: 'Diastolic Blood Pressure', unit: 'mmHg', systemId: 'cardio' },
  { name: 'Deep Sleep', unit: 'hrs', systemId: 'nervous' },
  { name: 'Total Sleep', unit: 'hrs', systemId: 'nervous' },
  { name: 'Stress Index', unit: '1-10', systemId: 'nervous' },
  { name: 'Bloating Index', unit: '1-10', systemId: 'digestive' },
  { name: 'Knee Pain Scale', unit: '0-10', systemId: 'musculoskeletal' },
  { name: 'Joint Pain Scale', unit: '0-10', systemId: 'musculoskeletal' },
  { name: 'SpO2 Oxygen Saturation', unit: '%', systemId: 'respiratory' },
  { name: 'VO2 Max', unit: 'ml/kg/min', systemId: 'respiratory' },
  { name: 'Body Temperature', unit: '°C', systemId: 'immune' },
  { name: 'Fasting Blood Glucose', unit: 'mg/dL', systemId: 'endocrine' },
  { name: 'Body Weight', unit: 'kg', systemId: 'endocrine' },
  { name: 'Urination Frequency', unit: 'times/day', systemId: 'urinary' },
  { name: 'Water Intake', unit: 'ml', systemId: 'urinary' },
];

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  defaultSystemId,
}) => {
  const { systems, addEvent, addMetricLog } = useDashboard();
  
  // Toggles for simplifications
  const [advancedMode, setAdvancedMode] = useState(false);

  // Form fields state
  const [systemId, setSystemId] = useState('');
  const [logType, setLogType] = useState<'Event' | 'Metric'>('Event');
  const [eventType, setEventType] = useState<EventType>('Symptom');
  const [date, setDate] = useState('2026-07-17'); // Matching our app time
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'Mild' | 'Moderate' | 'Severe'>('Mild');
  
  // Metric specific states
  const [metricName, setMetricName] = useState('');
  const [metricValue, setMetricValue] = useState('');
  const [metricUnit, setMetricUnit] = useState('');

  // Reset states
  useEffect(() => {
    if (isOpen) {
      setSystemId(defaultSystemId || systems[0]?.id || '');
      setLogType('Event');
      setEventType('Checkup'); // Default simple note to checkup
      setDate('2026-07-17');
      setTitle('');
      setDescription('');
      setSeverity('Mild');
      setMetricName('');
      setMetricValue('');
      setMetricUnit('');
      setAdvancedMode(false);
    }
  }, [isOpen, defaultSystemId, systems]);

  const handleMetricNameChange = (name: string) => {
    setMetricName(name);
    const matched = COMMON_METRICS.find(m => m.name.toLowerCase() === name.toLowerCase());
    if (matched) {
      setMetricUnit(matched.unit);
      if (matched.systemId) {
        setSystemId(matched.systemId);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!systemId) return;

    if (!advancedMode) {
      // In simple mode, always record as a simple "Checkup" event log
      if (!title.trim()) return;
      addEvent({
        systemId,
        date,
        type: 'Checkup',
        title,
        description,
      });
    } else if (logType === 'Event') {
      if (!title.trim()) return;
      addEvent({
        systemId,
        date,
        type: eventType,
        title,
        description,
        ...(eventType === 'Symptom' ? { severity } : {})
      });
    } else {
      if (!metricName.trim() || !metricValue.trim()) return;
      addMetricLog({
        systemId,
        name: metricName,
        value: parseFloat(metricValue),
        unit: metricUnit,
        timestamp: date
      });
    }

    onClose();
  };

  if (!isOpen) return null;

  const filteredMetricSuggestions = COMMON_METRICS.filter(
    m => !systemId || m.systemId === systemId
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative glass-panel rounded-2xl border border-slate-800 w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in text-slate-200">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800/80 bg-slate-900/40">
          <h3 className="font-display font-semibold text-base text-slate-100 flex items-center gap-2">
            <LucideIcons.PlusCircle className="w-5 h-5 text-indigo-400" />
            {advancedMode ? 'Clinical Health Logger' : 'Quick Health Note'}
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1 hover:bg-slate-800/50 rounded-lg"
          >
            <LucideIcons.X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Advanced Mode Toggle at top */}
          <div className="flex items-center justify-between bg-slate-900/35 p-3 rounded-xl border border-slate-850">
            <div className="text-left">
              <span className="text-xs font-semibold text-slate-200 block">Advanced log parameters</span>
              <span className="text-[10px] text-slate-500 block">Unlock exact vitals logging and clinical categories</span>
            </div>
            <button
              type="button"
              onClick={() => setAdvancedMode(!advancedMode)}
              className={`w-9 h-5 rounded-full p-0.5 transition-colors shrink-0 ${
                advancedMode ? 'bg-indigo-650' : 'bg-slate-800'
              }`}
            >
              <div 
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  advancedMode ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* ADVANCED SELECTOR: Event vs Metric tabs (Only in advanced mode) */}
          {advancedMode && (
            <div className="flex bg-slate-900/60 p-1 rounded-xl border border-slate-800 animate-fade-in">
              <button
                type="button"
                onClick={() => setLogType('Event')}
                className={`flex-1 py-2 text-center text-xs font-semibold rounded-lg transition-all ${
                  logType === 'Event' 
                    ? 'bg-indigo-650 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Clinical Event
              </button>
              <button
                type="button"
                onClick={() => setLogType('Metric')}
                className={`flex-1 py-2 text-center text-xs font-semibold rounded-lg transition-all ${
                  logType === 'Metric' 
                    ? 'bg-indigo-650 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Vitals & Biometrics
              </button>
            </div>
          )}

          {/* System Selection */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Target Body System</label>
            <select
              value={systemId}
              onChange={(e) => setSystemId(e.target.value)}
              className="bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-200"
              required
            >
              <option value="" disabled>Select system...</option>
              {systems.map((sys) => (
                <option key={sys.id} value={sys.id}>{sys.name}</option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Date of Record</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-200"
              required
            />
          </div>

          {/* FORM CONTENTS */}
          {(!advancedMode || logType === 'Event') ? (
            <>
              {/* Event Type selector (Only in advanced mode) */}
              {advancedMode && (
                <div className="flex flex-col space-y-1.5 animate-fade-in">
                  <label className="text-xs font-semibold text-slate-400">Event Category</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Symptom', 'Diagnosis', 'Surgery', 'Test Result', 'Checkup', 'Medication Change'] as EventType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setEventType(type)}
                        className={`py-1.5 px-2 rounded-lg border text-[10px] font-medium transition-all ${
                          eventType === type
                            ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                            : 'border-slate-800/80 bg-slate-900/30 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Title input */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Record Title</label>
                <input
                  type="text"
                  placeholder={advancedMode ? "e.g., Blood Pressure Spike" : "e.g., Felt good after stretching, slight joint soreness"}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-200"
                  required
                />
              </div>

              {/* Severity Selection (Only for Symptoms, in advanced mode) */}
              {advancedMode && eventType === 'Symptom' && (
                <div className="flex flex-col space-y-1.5 animate-fade-in">
                  <label className="text-xs font-semibold text-slate-400">Symptom Severity</label>
                  <div className="flex gap-2">
                    {(['Mild', 'Moderate', 'Severe'] as const).map((sev) => (
                      <button
                        key={sev}
                        type="button"
                        onClick={() => setSeverity(sev)}
                        className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                          severity === sev
                            ? sev === 'Mild' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                              : sev === 'Moderate' ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                              : 'border-rose-500 bg-rose-500/10 text-rose-300'
                            : 'border-slate-800 bg-slate-900/30 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Description input */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Details / Description</label>
                <textarea
                  placeholder="Type any notes, observations, or descriptions here..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-200 h-20 resize-none"
                />
              </div>
            </>
          ) : (
            // ADVANCED MODE METRIC LOGGING
            <div className="space-y-4 animate-fade-in">
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Metric Name</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g., Systolic Blood Pressure"
                    value={metricName}
                    onChange={(e) => handleMetricNameChange(e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-200"
                    required
                    list="metric-suggestions"
                  />
                  <datalist id="metric-suggestions">
                    {filteredMetricSuggestions.map((m, i) => (
                      <option key={i} value={m.name} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Value</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g., 120"
                    value={metricValue}
                    onChange={(e) => setMetricValue(e.target.value)}
                    className="bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-200"
                    required
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Unit</label>
                  <input
                    type="text"
                    placeholder="e.g., mmHg, bpm"
                    value={metricUnit}
                    onChange={(e) => setMetricUnit(e.target.value)}
                    className="bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-200"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-850 hover:bg-slate-800/40 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
            >
              Save Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
