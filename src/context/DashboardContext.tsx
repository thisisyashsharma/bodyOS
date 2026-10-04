import React, { createContext, useContext, useState, useEffect } from 'react';
import type { 
  BodySystem, 
  MedicalEvent, 
  ProtectiveHabit, 
  HealthGoal, 
  MetricLog, 
  SystemScoreHistory,
  SystemStatus,
  PrecisionParameter
} from '../types';

interface DashboardContextType {
  systems: BodySystem[];
  events: MedicalEvent[];
  habits: ProtectiveHabit[];
  goals: HealthGoal[];
  metrics: MetricLog[];
  scoreHistory: SystemScoreHistory[];
  userName: string;
  
  // Rating and Precision Mode actions
  updateSystemRating: (systemId: string, rating: number) => void;
  logSystemRating: (systemId: string, rating: number, date: string, time: string) => void;
  togglePrecisionMode: (systemId: string, enabled: boolean) => void;
  updateSystemDescription: (systemId: string, description: string) => void;
  
  // Precision Parameter operations
  addPrecisionParameter: (systemId: string, title: string, rangeStart: number, rangeEnd: number) => void;
  deletePrecisionParameter: (systemId: string, paramId: string) => void;
  updatePrecisionValue: (systemId: string, paramId: string, value: number) => void;
  updatePrecisionWeightages: (systemId: string, weightages: { paramId: string; weightage: number }[]) => void;
  
  // System Tracking operations
  startTrackingSystem: (systemId: string) => void;
  archiveSystem: (systemId: string) => void;
  deleteSystemData: (systemId: string) => void;
  
  // Event operations
  addEvent: (event: Omit<MedicalEvent, 'id'>) => void;
  updateEvent: (event: MedicalEvent) => void;
  deleteEvent: (id: string) => void;
  
  // Habit operations
  addHabit: (habit: Omit<ProtectiveHabit, 'id'>) => void;
  updateHabit: (habit: ProtectiveHabit) => void;
  deleteHabit: (id: string) => void;
  toggleHabitActive: (id: string) => void;
  updateHabitAdherence: (id: string, adherence: number) => void;
  
  // Goal operations
  addGoal: (goal: Omit<HealthGoal, 'id'>) => void;
  updateGoal: (goal: HealthGoal) => void;
  deleteGoal: (id: string) => void;
  
  // Metric operations
  addMetricLog: (log: Omit<MetricLog, 'id'>) => void;
  deleteMetricLog: (id: string) => void;
  
  // Actions
  recalculateScores: () => void;
  resetAllData: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

// Initial Systems definition with isTracking defaults (only respiratory, nervous, and integumentary by default)
const DEFAULT_SYSTEMS: BodySystem[] = [
  { id: 'cardio', name: 'Cardiovascular', description: 'Heart, blood vessels, circulation, heart rate, and blood pressure.', iconName: 'Heart', colorClass: 'cardio', status: 'Stable', score: 80, subjectiveRating: 8, precisionEnabled: false, isTracking: false, precisionParameters: [] },
  { id: 'nervous', name: 'Nervous & Sleep', description: 'Brain, spinal cord, sleep quality, cognitive performance, and mood.', iconName: 'Brain', colorClass: 'nervous', status: 'Stable', score: 80, subjectiveRating: 8, precisionEnabled: false, isTracking: true, precisionParameters: [] },
  { id: 'digestive', name: 'Digestive & Gut', description: 'Stomach, intestines, digestion, microbiome, and nutrient absorption.', iconName: 'Activity', colorClass: 'digestive', status: 'Optimal', score: 90, subjectiveRating: 9, precisionEnabled: false, isTracking: false, precisionParameters: [] },
  { id: 'musculoskeletal', name: 'Musculoskeletal', description: 'Muscles, bones, joints, spine, overall strength, and joint mobility.', iconName: 'Zap', colorClass: 'musculoskeletal', status: 'Stable', score: 80, subjectiveRating: 8, precisionEnabled: false, isTracking: false, precisionParameters: [] },
  { id: 'respiratory', name: 'Respiratory', description: 'Lungs, trachea, breathing patterns, lung capacity, and oxygenation.', iconName: 'Wind', colorClass: 'respiratory', status: 'Optimal', score: 90, subjectiveRating: 9, precisionEnabled: false, isTracking: true, precisionParameters: [] },
  { id: 'immune', name: 'Immune & Lymphatic', description: 'Immune cells, lymph nodes, recovery speed, allergy responses, and defenses.', iconName: 'Shield', colorClass: 'immune', status: 'Stable', score: 80, subjectiveRating: 8, precisionEnabled: false, isTracking: false, precisionParameters: [] },
  { id: 'endocrine', name: 'Endocrine & Metabolic', description: 'Hormones, blood sugar, thyroid, metabolic rate, and energy regulation.', iconName: 'Flame', colorClass: 'endocrine', status: 'Suboptimal', score: 70, subjectiveRating: 7, precisionEnabled: false, isTracking: false, precisionParameters: [] },
  { id: 'integumentary', name: 'Integumentary', description: 'Skin health, hair, nails, and protective barriers.', iconName: 'Sparkles', colorClass: 'integumentary', status: 'Optimal', score: 90, subjectiveRating: 9, precisionEnabled: false, isTracking: true, precisionParameters: [] },
  { id: 'urinary', name: 'Urinary & Renal', description: 'Kidneys, bladder, fluid balance, hydration levels, and toxicity filtration.', iconName: 'Droplet', colorClass: 'urinary', status: 'Optimal', score: 90, subjectiveRating: 9, precisionEnabled: false, isTracking: false, precisionParameters: [] },
  { id: 'reproductive', name: 'Reproductive', description: 'Hormones, libido, sexual health, and fertility markers.', iconName: 'HeartHandshake', colorClass: 'reproductive', status: 'Stable', score: 80, subjectiveRating: 8, precisionEnabled: false, isTracking: false, precisionParameters: [] },
];

// Initial seeded events
const SEED_EVENTS: MedicalEvent[] = [
  { id: 'ev1', systemId: 'cardio', date: '2026-05-10', type: 'Checkup', title: 'Cardiology Consultation', description: 'Annual review. EKG was normal. Blood pressure slightly elevated but within acceptable limits. Advised to log daily.', rating: 8 },
  { id: 'ev2', systemId: 'cardio', date: '2026-07-10', type: 'Symptom', title: 'Palpitations post-caffeine', description: 'Felt light heart fluttering after 3 cups of dark roast coffee in the afternoon.', severity: 'Moderate', rating: 4 },
  { id: 'ev3', systemId: 'nervous', date: '2026-06-15', type: 'Test Result', title: 'Cognitive Baseline Test', description: 'Memory score 92nd percentile, reaction speed average (230ms). Under high stress during test.', rating: 8 },
  { id: 'ev4', systemId: 'nervous', date: '2026-07-14', type: 'Symptom', title: 'Insomnia & Restlessness', description: 'Struggled to sleep until 3 AM. Mind was racing with project details.', severity: 'Moderate', rating: 3 },
  { id: 'ev5', systemId: 'digestive', date: '2026-06-01', type: 'Diagnosis', title: 'Mild Gastric Reflux (GERD)', description: 'Diagnosed by GP. Recommended avoiding laying down after eating and restricting spicy/fatty foods.', rating: 7 },
  { id: 'ev6', systemId: 'digestive', date: '2026-07-05', type: 'Symptom', title: 'Acid Reflux Flare-up', description: 'Reflux occurred after late-night spicy ramen dinner.', severity: 'Severe', rating: 3 },
  { id: 'ev7', systemId: 'musculoskeletal', date: '2024-03-12', type: 'Surgery', title: 'Left Knee Meniscus Repair', description: 'Arthroscopic surgery. Completed 6 months of physiotherapy. Flexion is fully restored.', rating: 9 },
  { id: 'ev8', systemId: 'musculoskeletal', date: '2026-07-16', type: 'Symptom', title: 'Lower Back Stiffness', description: 'Dull ache in lower back after lifting heavy deadlifts with questionable form.', severity: 'Mild', rating: 4 },
  { id: 'ev9', systemId: 'endocrine', date: '2026-07-02', type: 'Checkup', title: 'Fasting Blood Sugar Test', description: 'Fasting glucose was 99 mg/dL. Near upper limit of normal range (100 mg/dL). Cut back on refined sugars.', rating: 6 },
];

// Seed habits
const SEED_HABITS: ProtectiveHabit[] = [
  { id: 'h1', systemId: 'cardio', name: 'Zone 2 Cardio (150 min/wk)', frequency: 'Weekly', adherence: 80, isActive: true },
  { id: 'h2', systemId: 'cardio', name: 'CoQ10 Supplementation (100mg)', frequency: 'Daily', adherence: 90, isActive: true },
  { id: 'h3', systemId: 'cardio', name: 'Limit Coffee to 2 Cups Max', frequency: 'Daily', adherence: 70, isActive: true },
  { id: 'h4', systemId: 'nervous', name: 'No Screens 1 Hour Before Sleep', frequency: 'Daily', adherence: 60, isActive: true },
  { id: 'h5', systemId: 'nervous', name: 'Magnesium Bisglycinate (300mg)', frequency: 'Daily', adherence: 85, isActive: true },
  { id: 'h6', systemId: 'nervous', name: 'Mindfulness Meditation (10 min)', frequency: 'Daily', adherence: 45, isActive: true },
  { id: 'h7', systemId: 'digestive', name: 'Daily Probiotic Capsule', frequency: 'Daily', adherence: 95, isActive: true },
  { id: 'h8', systemId: 'digestive', name: 'Eliminate Dairy Products', frequency: 'Daily', adherence: 90, isActive: true },
  { id: 'h9', systemId: 'digestive', name: 'Chew Food 30 Times Per Bite', frequency: 'Daily', adherence: 50, isActive: true },
  { id: 'h10', systemId: 'musculoskeletal', name: 'Resistance Training 3x/wk', frequency: 'Weekly', adherence: 85, isActive: true },
  { id: 'h11', systemId: 'musculoskeletal', name: 'Post-Workout Mobility Drill', frequency: 'Daily', adherence: 40, isActive: true },
  { id: 'h12', systemId: 'respiratory', name: 'Pranayama Deep Breathing', frequency: 'Daily', adherence: 80, isActive: true },
  { id: 'h13', systemId: 'respiratory', name: 'Replace Bedroom HEPA Filter', frequency: 'Weekly', adherence: 100, isActive: true },
  { id: 'h14', systemId: 'immune', name: 'Vitamin D3 (5000 IU) + K2', frequency: 'Daily', adherence: 95, isActive: true },
  { id: 'h15', systemId: 'endocrine', name: 'Intermittent Fasting (16:8)', frequency: 'Daily', adherence: 75, isActive: true },
];

// Seed goals
const SEED_GOALS: HealthGoal[] = [
  { id: 'g1', systemId: 'cardio', title: 'Bring Resting Heart Rate under 58 bpm', targetDate: '2026-09-01', status: 'In Progress', metricTarget: 'RHR < 58 bpm' },
  { id: 'g2', systemId: 'cardio', title: 'Normalize Systolic Blood Pressure to 118', targetDate: '2026-08-15', status: 'In Progress', metricTarget: 'Systolic BP < 120 mmHg' },
  { id: 'g3', systemId: 'nervous', title: 'Maintain Average Deep Sleep of 90 minutes', targetDate: '2026-10-01', status: 'In Progress', metricTarget: 'Deep Sleep > 1.5h' },
  { id: 'g4', systemId: 'digestive', title: 'Resolve GERD symptoms entirely', targetDate: '2026-08-30', status: 'In Progress' },
  { id: 'g5', systemId: 'musculoskeletal', title: 'Bench press 1.0x bodyweight (80kg)', targetDate: '2026-12-15', status: 'In Progress', metricTarget: '1RM = 80kg' },
  { id: 'g6', systemId: 'endocrine', title: 'Reduce Fasting Glucose below 90 mg/dL', targetDate: '2026-10-30', status: 'In Progress', metricTarget: 'Fasting Glucose < 90 mg/dL' },
];

// Seed metrics
const SEED_METRICS: MetricLog[] = [
  { id: 'm1', systemId: 'cardio', name: 'Resting Heart Rate', value: 65, unit: 'bpm', timestamp: '2026-07-11' },
  { id: 'm2', systemId: 'cardio', name: 'Resting Heart Rate', value: 64, unit: 'bpm', timestamp: '2026-07-12' },
  { id: 'm3', systemId: 'cardio', name: 'Resting Heart Rate', value: 66, unit: 'bpm', timestamp: '2026-07-13' },
  { id: 'm4', systemId: 'cardio', name: 'Resting Heart Rate', value: 63, unit: 'bpm', timestamp: '2026-07-14' },
  { id: 'm5', systemId: 'cardio', name: 'Resting Heart Rate', value: 61, unit: 'bpm', timestamp: '2026-07-15' },
  { id: 'm6', systemId: 'cardio', name: 'Resting Heart Rate', value: 60, unit: 'bpm', timestamp: '2026-07-16' },
  { id: 'm7', systemId: 'cardio', name: 'Resting Heart Rate', value: 59, unit: 'bpm', timestamp: '2026-07-17' },
  { id: 'm8', systemId: 'cardio', name: 'Systolic Blood Pressure', value: 128, unit: 'mmHg', timestamp: '2026-07-14' },
  { id: 'm9', systemId: 'cardio', name: 'Systolic Blood Pressure', value: 122, unit: 'mmHg', timestamp: '2026-07-17' },
  { id: 'm10', systemId: 'nervous', name: 'Deep Sleep', value: 0.9, unit: 'hrs', timestamp: '2026-07-11' },
  { id: 'm11', systemId: 'nervous', name: 'Deep Sleep', value: 1.1, unit: 'hrs', timestamp: '2026-07-12' },
  { id: 'm12', systemId: 'nervous', name: 'Deep Sleep', value: 0.6, unit: 'hrs', timestamp: '2026-07-13' },
  { id: 'm13', systemId: 'nervous', name: 'Deep Sleep', value: 0.4, unit: 'hrs', timestamp: '2026-07-14' },
  { id: 'm14', systemId: 'nervous', name: 'Deep Sleep', value: 0.9, unit: 'hrs', timestamp: '2026-07-15' },
  { id: 'm15', systemId: 'nervous', name: 'Deep Sleep', value: 1.2, unit: 'hrs', timestamp: '2026-07-16' },
  { id: 'm16', systemId: 'nervous', name: 'Deep Sleep', value: 1.4, unit: 'hrs', timestamp: '2026-07-17' },
  { id: 'm17', systemId: 'digestive', name: 'Bloating Index', value: 3, unit: '1-10', timestamp: '2026-07-11' },
  { id: 'm18', systemId: 'digestive', name: 'Bloating Index', value: 1, unit: '1-10', timestamp: '2026-07-17' },
  { id: 'm19', systemId: 'musculoskeletal', name: 'Knee Pain Scale', value: 2, unit: '0-10', timestamp: '2026-07-10' },
  { id: 'm20', systemId: 'musculoskeletal', name: 'Knee Pain Scale', value: 0, unit: '0-10', timestamp: '2026-07-17' },
  { id: 'm21', systemId: 'respiratory', name: 'SpO2 Oxygen Saturation', value: 98, unit: '%', timestamp: '2026-07-17' },
  { id: 'm22', systemId: 'respiratory', name: 'VO2 Max', value: 42.5, unit: 'ml/kg/min', timestamp: '2026-07-01' },
];

// Seed 30 days of historical scores for trend range analysis
const generateHistoricalScores = (): SystemScoreHistory[] => {
  const history: SystemScoreHistory[] = [];
  const days = 30;
  const systemIds = DEFAULT_SYSTEMS.map(s => s.id);
  const now = new Date('2026-07-17');
  
  for (let i = days; i >= 1; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    systemIds.forEach(sysId => {
      let base = 80;
      // Add slight variation for visualization
      const wave = Math.sin(i * 0.45) * 5 + Math.cos(i * 0.22) * 2;
      
      if (sysId === 'cardio') base = 78 + wave;
      else if (sysId === 'nervous') base = 75 + wave;
      else if (sysId === 'digestive') base = 90 + wave * 0.4;
      else if (sysId === 'musculoskeletal') base = 78 + wave;
      else if (sysId === 'respiratory') base = 92 + wave * 0.4;
      else if (sysId === 'endocrine') base = 68 + wave;
      else base = 80 + wave;
      
      history.push({
        systemId: sysId,
        score: Math.min(100, Math.max(0, Math.round(base))),
        date: dateStr
      });
    });
  }
  return history;
};

// Seed daily rating events for the past 30 days for each system to populate the Google Fit monthly bubble chart
const generateHistoricalEvents = (): MedicalEvent[] => {
  const eventsList: MedicalEvent[] = [...SEED_EVENTS];
  const days = 30;
  const systemIds = DEFAULT_SYSTEMS.map(s => s.id);
  const now = new Date('2026-07-17');
  
  // Track existing combinations to avoid duplicates
  const existingKeys = new Set(SEED_EVENTS.map(e => `${e.systemId}-${e.date}`));

  for (let i = days; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    systemIds.forEach(sysId => {
      const key = `${sysId}-${dateStr}`;
      if (existingKeys.has(key)) return;

      let base = 8;
      // Replicate the sin/cos wave of history scores
      const wave = Math.sin(i * 0.45) * 0.5 + Math.cos(i * 0.22) * 0.2;
      
      if (sysId === 'cardio') base = 7.8 + wave;
      else if (sysId === 'nervous') base = 7.5 + wave;
      else if (sysId === 'digestive') base = 9.0 + wave * 0.4;
      else if (sysId === 'musculoskeletal') base = 7.8 + wave;
      else if (sysId === 'respiratory') base = 9.2 + wave * 0.4;
      else if (sysId === 'endocrine') base = 6.8 + wave;
      else base = 8.0 + wave;
      
      const rating = Math.min(10, Math.max(1, Math.round(base)));
      
      eventsList.push({
        id: `ev-gen-${sysId}-${dateStr}`,
        systemId: sysId,
        date: dateStr,
        type: 'Checkup',
        title: `Daily Status: ${rating}/10`,
        description: 'Automated daily wellness check-in.',
        rating
      });
    });
  }
  return eventsList;
};

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [systems, setSystems] = useState<BodySystem[]>(() => {
    const saved = localStorage.getItem('bodyos_systems');
    return saved ? JSON.parse(saved) : DEFAULT_SYSTEMS;
  });

  const [events, setEvents] = useState<MedicalEvent[]>(() => {
    const saved = localStorage.getItem('bodyos_events');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.length < 20) {
        return generateHistoricalEvents();
      }
      return parsed;
    }
    return generateHistoricalEvents();
  });

  const [habits, setHabits] = useState<ProtectiveHabit[]>(() => {
    const saved = localStorage.getItem('bodyos_habits');
    return saved ? JSON.parse(saved) : SEED_HABITS;
  });

  const [goals, setGoals] = useState<HealthGoal[]>(() => {
    const saved = localStorage.getItem('bodyos_goals');
    return saved ? JSON.parse(saved) : SEED_GOALS;
  });

  const [metrics, setMetrics] = useState<MetricLog[]>(() => {
    const saved = localStorage.getItem('bodyos_metrics');
    return saved ? JSON.parse(saved) : SEED_METRICS;
  });

  const [scoreHistory, setScoreHistory] = useState<SystemScoreHistory[]>(() => {
    const saved = localStorage.getItem('bodyos_score_history');
    return saved ? JSON.parse(saved) : generateHistoricalScores();
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('bodyos_systems', JSON.stringify(systems));
  }, [systems]);

  useEffect(() => {
    localStorage.setItem('bodyos_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('bodyos_habits', JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem('bodyos_goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem('bodyos_metrics', JSON.stringify(metrics));
  }, [metrics]);

  useEffect(() => {
    localStorage.setItem('bodyos_score_history', JSON.stringify(scoreHistory));
  }, [scoreHistory]);

  const recalculateScores = () => {
    const todayStr = '2026-07-17';
    
    const updatedSystems = systems.map(sys => {
      // MODE 1: Subjective Mode (Rating out of 10) - Synced in real-time with event ratings
      if (!sys.precisionEnabled) {
        const todayEvents = events.filter(e => e.systemId === sys.id && e.date === todayStr && e.rating !== undefined);
        
        let currentRating = sys.subjectiveRating;
        if (todayEvents.length > 0) {
          const sum = todayEvents.reduce((acc, e) => acc + (e.rating || 0), 0);
          currentRating = Math.round(sum / todayEvents.length);
        } else {
          // Fall back to latest ever
          const allSystemEventsWithRating = events.filter(e => e.systemId === sys.id && e.rating !== undefined);
          if (allSystemEventsWithRating.length > 0) {
            const sorted = [...allSystemEventsWithRating].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
            if (sorted[0].rating !== undefined) {
              currentRating = sorted[0].rating;
            }
          }
        }

        const score = currentRating * 10;
        let status: SystemStatus = 'Stable';
        if (score >= 90) status = 'Optimal';
        else if (score >= 70) status = 'Stable';
        else if (score >= 50) status = 'Suboptimal';
        else status = 'Attention Required';

        return { ...sys, subjectiveRating: currentRating, score, status };
      }

      // MODE 2: Precision scoring mode
      // If custom precision parameters exist, use weighted aggregation
      if (sys.precisionParameters && sys.precisionParameters.length > 0) {
        const { rating, score: precScore } = calculateAggregatedScore(sys.precisionParameters);
        let status: SystemStatus = 'Stable';
        if (precScore >= 90) status = 'Optimal';
        else if (precScore >= 70) status = 'Stable';
        else if (precScore >= 50) status = 'Suboptimal';
        else status = 'Attention Required';
        return { ...sys, subjectiveRating: rating, score: precScore, status };
      }
      
      let score = 100;
      
      // Habits Impact (40%)
      const systemHabits = habits.filter(h => h.systemId === sys.id && h.isActive);
      if (systemHabits.length > 0) {
        const avgAdherence = systemHabits.reduce((acc, h) => acc + h.adherence, 0) / systemHabits.length;
        score -= (100 - avgAdherence) * 0.4;
      }
      
      // Symptoms Impact (up to 20 points deduction)
      const startDate = new Date('2026-07-03');
      const endDate = new Date('2026-07-17');
      const recentSymptoms = events.filter(e => {
        if (e.systemId !== sys.id || e.type !== 'Symptom') return false;
        const evDate = new Date(e.date);
        return evDate >= startDate && evDate <= endDate;
      });
      
      recentSymptoms.forEach(symptom => {
        if (symptom.severity === 'Severe') score -= 20;
        else if (symptom.severity === 'Moderate') score -= 10;
        else if (symptom.severity === 'Mild') score -= 5;
      });
      
      // Metrics range check
      const sysMetrics = metrics.filter(m => m.systemId === sys.id);
      if (sys.id === 'cardio') {
        const systolicLogs = sysMetrics.filter(m => m.name.toLowerCase().includes('systolic'));
        const rhrLogs = sysMetrics.filter(m => m.name.toLowerCase().includes('rate'));
        if (systolicLogs.length > 0) {
          const latestSys = systolicLogs.reduce((latest, current) => new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest);
          if (latestSys.value > 140) score -= 15;
          else if (latestSys.value > 130) score -= 8;
        }
        if (rhrLogs.length > 0) {
          const latestRhr = rhrLogs.reduce((latest, current) => new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest);
          if (latestRhr.value > 85) score -= 15;
          else if (latestRhr.value > 75) score -= 8;
        }
      } else if (sys.id === 'nervous') {
        const sleepLogs = sysMetrics.filter(m => m.name.toLowerCase().includes('sleep'));
        if (sleepLogs.length > 0) {
          const latestSleep = sleepLogs.reduce((latest, current) => new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest);
          if (latestSleep.value < 0.6) score -= 15;
          else if (latestSleep.value < 0.9) score -= 8;
        }
      } else if (sys.id === 'respiratory') {
        const spo2Logs = sysMetrics.filter(m => m.name.toLowerCase().includes('spo2') || m.name.toLowerCase().includes('oxygen'));
        if (spo2Logs.length > 0) {
          const latestSpo2 = spo2Logs.reduce((latest, current) => new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest);
          if (latestSpo2.value < 92) score -= 25;
          else if (latestSpo2.value < 95) score -= 12;
        }
      }
      
      const finalScore = Math.round(Math.min(100, Math.max(0, score)));
      let status: SystemStatus = 'Optimal';
      if (finalScore < 60) status = 'Attention Required';
      else if (finalScore < 75) status = 'Suboptimal';
      else if (finalScore < 90) status = 'Stable';
      
      return {
        ...sys,
        score: finalScore,
        status
      };
    });

    setSystems(updatedSystems);

    // Update today's score history
    setScoreHistory(prev => {
      const filtered = prev.filter(h => h.date !== todayStr);
      const todaysHistory = updatedSystems.map(sys => ({
        systemId: sys.id,
        score: sys.score,
        date: todayStr
      }));
      return [...filtered, ...todaysHistory];
    });
  };

  useEffect(() => {
    recalculateScores();
  }, [events, habits, metrics]);

  // Operations
  const updateSystemRating = (systemId: string, rating: number) => {
    const parsedRating = Math.min(10, Math.max(1, rating));
    const todayStr = '2026-07-17';

    // Insert or update rating event in the wellness event logs to keep synced in real-time
    setEvents(prev => {
      const todayRatingEventIndex = prev.findIndex(
        e => e.systemId === systemId && e.date === todayStr && e.rating !== undefined
      );

      if (todayRatingEventIndex > -1) {
        const updated = [...prev];
        updated[todayRatingEventIndex] = {
          ...updated[todayRatingEventIndex],
          rating: parsedRating,
          title: updated[todayRatingEventIndex].title.startsWith('Daily Status') || updated[todayRatingEventIndex].title.startsWith('Rated')
            ? `Rated ${parsedRating}/10`
            : updated[todayRatingEventIndex].title
        };
        return updated;
      } else {
        const newEvent: MedicalEvent = {
          id: `ev-rating-${Date.now()}`,
          systemId,
          date: todayStr,
          type: 'Checkup',
          title: `Rated ${parsedRating}/10`,
          description: 'Quick rating update.',
          rating: parsedRating
        };
        return [newEvent, ...prev];
      }
    });

    // Automatically delegate to logSystemRating with today's date and the current time (hours and minutes)
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    logSystemRating(systemId, rating, todayStr, timeStr);
  };

  const logSystemRating = (systemId: string, rating: number, dateStr: string, timeStr: string) => {
    const parsedRating = Math.min(10, Math.max(1, rating));

    // Insert or update rating event in the wellness event logs for the specific date and time
    setEvents(prev => {
      const existingEventIndex = prev.findIndex(
        e => e.systemId === systemId && e.date === dateStr && e.time === timeStr && e.rating !== undefined
      );

      if (existingEventIndex > -1) {
        const updated = [...prev];
        updated[existingEventIndex] = {
          ...updated[existingEventIndex],
          rating: parsedRating,
          title: `Rated ${parsedRating}/10`
        };
        return updated;
      } else {
        const newEvent: MedicalEvent = {
          id: `ev-rating-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          systemId,
          date: dateStr,
          time: timeStr,
          type: 'Checkup',
          title: `Rated ${parsedRating}/10`,
          description: 'Subjective rating log.',
          rating: parsedRating
        };
        return [newEvent, ...prev];
      }
    });

    // Update system active rating in memory if the date matches today (2026-07-17 in seed data)
    const todayStr = '2026-07-17';
    if (dateStr === todayStr) {
      setSystems(prev => prev.map(s => {
        if (s.id === systemId) {
          const score = parsedRating * 10;
          let status: SystemStatus = 'Stable';
          if (score >= 90) status = 'Optimal';
          else if (score >= 70) status = 'Stable';
          else if (score >= 50) status = 'Suboptimal';
          else status = 'Attention Required';
          return { ...s, subjectiveRating: parsedRating, score, status };
        }
        return s;
      }));
    }

    // Instantly append to history for that specific date to force chart visual refresh
    setScoreHistory(prev => {
      const filtered = prev.filter(h => !(h.systemId === systemId && h.date === dateStr));
      return [...filtered, {
        systemId,
        score: parsedRating * 10,
        date: dateStr
      }];
    });
  };

  const startTrackingSystem = (systemId: string) => {
    setSystems(prev => prev.map(s => s.id === systemId ? { ...s, isTracking: true } : s));
  };

  const archiveSystem = (systemId: string) => {
    setSystems(prev => prev.map(s => s.id === systemId ? { ...s, isTracking: false } : s));
  };

  const deleteSystemData = (systemId: string) => {
    setSystems(prev => prev.map(s => s.id === systemId ? { ...s, isTracking: false } : s));
    setEvents(prev => prev.filter(e => e.systemId !== systemId));
    setHabits(prev => prev.filter(h => h.systemId !== systemId));
    setGoals(prev => prev.filter(g => g.systemId !== systemId));
    setMetrics(prev => prev.filter(m => m.systemId !== systemId));
    setScoreHistory(prev => prev.filter(h => h.systemId !== systemId));
  };

  const togglePrecisionMode = (systemId: string, enabled: boolean) => {
    setSystems(prev => prev.map(s => s.id === systemId ? { ...s, precisionEnabled: enabled } : s));
  };

  const updateSystemDescription = (systemId: string, description: string) => {
    setSystems(prev => prev.map(s => s.id === systemId ? { ...s, description } : s));
  };

  const addEvent = (event: Omit<MedicalEvent, 'id'>) => {
    const newEvent: MedicalEvent = {
      ...event,
      id: `ev-${Date.now()}`
    };
    setEvents(prev => [newEvent, ...prev]);
  };

  const updateEvent = (updatedEvent: MedicalEvent) => {
    setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
  };

  const deleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const addHabit = (habit: Omit<ProtectiveHabit, 'id'>) => {
    const newHabit: ProtectiveHabit = {
      ...habit,
      id: `h-${Date.now()}`
    };
    setHabits(prev => [...prev, newHabit]);
  };

  const updateHabit = (updatedHabit: ProtectiveHabit) => {
    setHabits(prev => prev.map(h => h.id === updatedHabit.id ? updatedHabit : h));
  };

  const deleteHabit = (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
  };

  const toggleHabitActive = (id: string) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, isActive: !h.isActive } : h));
  };

  const updateHabitAdherence = (id: string, adherence: number) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, adherence: Math.min(100, Math.max(0, adherence)) } : h));
  };

  const addGoal = (goal: Omit<HealthGoal, 'id'>) => {
    const newGoal: HealthGoal = {
      ...goal,
      id: `g-${Date.now()}`
    };
    setGoals(prev => [...prev, newGoal]);
  };

  const updateGoal = (updatedGoal: HealthGoal) => {
    setGoals(prev => prev.map(g => g.id === updatedGoal.id ? updatedGoal : g));
  };

  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const addMetricLog = (log: Omit<MetricLog, 'id'>) => {
    const newLog: MetricLog = {
      ...log,
      id: `m-${Date.now()}`
    };
    setMetrics(prev => [newLog, ...prev]);
  };

  const deleteMetricLog = (id: string) => {
    setMetrics(prev => prev.filter(m => m.id !== id));
  };

  const resetAllData = () => {
    setSystems(DEFAULT_SYSTEMS);
    setEvents(SEED_EVENTS);
    setHabits(SEED_HABITS);
    setGoals(SEED_GOALS);
    setMetrics(SEED_METRICS);
    setScoreHistory(generateHistoricalScores());
  };

  // Calculate aggregated score from precision parameters
  const calculateAggregatedScore = (params: PrecisionParameter[]): { rating: number; score: number } => {
    if (params.length === 0) return { rating: 0, score: 0 };
    let weightedSum = 0;
    let totalWeightage = 0;
    params.forEach(p => {
      const range = p.rangeEnd - p.rangeStart;
      if (range <= 0) return;
      const normalized = (p.currentValue - p.rangeStart) / range; // 0 to 1
      weightedSum += normalized * p.weightage;
      totalWeightage += p.weightage;
    });
    if (totalWeightage === 0) return { rating: 0, score: 0 };
    const normalizedScore = weightedSum / totalWeightage; // 0 to 1
    const rating = Math.round(normalizedScore * 9 + 1); // 1 to 10
    const score = Math.round(normalizedScore * 100); // 0 to 100
    return { rating: Math.min(10, Math.max(1, rating)), score: Math.min(100, Math.max(0, score)) };
  };

  const addPrecisionParameter = (systemId: string, title: string, rangeStart: number, rangeEnd: number) => {
    setSystems(prev => prev.map(sys => {
      if (sys.id !== systemId) return sys;
      const newParam: PrecisionParameter = {
        id: `pp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        systemId,
        title,
        rangeStart,
        rangeEnd,
        weightage: 0,
        currentValue: rangeStart,
      };
      const existingParams = sys.precisionParameters;
      let updatedParams: PrecisionParameter[];
      if (existingParams.length === 0) {
        // First parameter gets 100%
        newParam.weightage = 100;
        updatedParams = [newParam];
      } else {
        // Take weightage from the last parameter
        const lastParam = existingParams[existingParams.length - 1];
        const takeFromLast = Math.floor(lastParam.weightage / 2);
        newParam.weightage = takeFromLast;
        updatedParams = existingParams.map((p, i) => 
          i === existingParams.length - 1 
            ? { ...p, weightage: p.weightage - takeFromLast }
            : p
        );
        updatedParams.push(newParam);
      }
      return { ...sys, precisionParameters: updatedParams };
    }));
  };

  const deletePrecisionParameter = (systemId: string, paramId: string) => {
    setSystems(prev => prev.map(sys => {
      if (sys.id !== systemId) return sys;
      const remaining = sys.precisionParameters.filter(p => p.id !== paramId);
      if (remaining.length === 0) {
        return { ...sys, precisionParameters: [] };
      }
      if (remaining.length === 1) {
        // Single param gets 100%
        return { ...sys, precisionParameters: [{ ...remaining[0], weightage: 100 }] };
      }
      // Redistribute deleted param's weightage to last param
      const deletedParam = sys.precisionParameters.find(p => p.id === paramId);
      const freedWeightage = deletedParam?.weightage || 0;
      const updatedRemaining = remaining.map((p, i) => 
        i === remaining.length - 1 
          ? { ...p, weightage: p.weightage + freedWeightage }
          : p
      );
      const { rating, score } = calculateAggregatedScore(updatedRemaining);
      let status: SystemStatus = 'Stable';
      if (score >= 90) status = 'Optimal';
      else if (score >= 70) status = 'Stable';
      else if (score >= 50) status = 'Suboptimal';
      else status = 'Attention Required';
      return { ...sys, precisionParameters: updatedRemaining, subjectiveRating: rating, score, status };
    }));
  };

  const updatePrecisionValue = (systemId: string, paramId: string, value: number) => {
    setSystems(prev => prev.map(sys => {
      if (sys.id !== systemId) return sys;
      const updatedParams = sys.precisionParameters.map(p => 
        p.id === paramId 
          ? { ...p, currentValue: Math.min(p.rangeEnd, Math.max(p.rangeStart, value)) }
          : p
      );
      // Recalculate aggregated score
      const { rating, score } = calculateAggregatedScore(updatedParams);
      let status: SystemStatus = 'Stable';
      if (score >= 90) status = 'Optimal';
      else if (score >= 70) status = 'Stable';
      else if (score >= 50) status = 'Suboptimal';
      else status = 'Attention Required';
      return { ...sys, precisionParameters: updatedParams, subjectiveRating: rating, score, status };
    }));
  };

  const updatePrecisionWeightages = (systemId: string, weightages: { paramId: string; weightage: number }[]) => {
    setSystems(prev => prev.map(sys => {
      if (sys.id !== systemId) return sys;
      const updatedParams = sys.precisionParameters.map(p => {
        const w = weightages.find(w => w.paramId === p.id);
        return w ? { ...p, weightage: w.weightage } : p;
      });
      // Recalculate aggregated score
      const { rating, score } = calculateAggregatedScore(updatedParams);
      let status: SystemStatus = 'Stable';
      if (score >= 90) status = 'Optimal';
      else if (score >= 70) status = 'Stable';
      else if (score >= 50) status = 'Suboptimal';
      else status = 'Attention Required';
      return { ...sys, precisionParameters: updatedParams, subjectiveRating: rating, score, status };
    }));
  };

  return (
    <DashboardContext.Provider value={{
      systems,
      events,
      habits,
      goals,
      metrics,
      scoreHistory,
      userName: 'wwwYa',
      updateSystemRating,
      logSystemRating,
      togglePrecisionMode,
      updateSystemDescription,
      startTrackingSystem,
      archiveSystem,
      deleteSystemData,
      addEvent,
      updateEvent,
      deleteEvent,
      addHabit,
      updateHabit,
      deleteHabit,
      toggleHabitActive,
      updateHabitAdherence,
      addGoal,
      updateGoal,
      deleteGoal,
      addMetricLog,
      deleteMetricLog,
      recalculateScores,
      resetAllData,
      addPrecisionParameter,
      deletePrecisionParameter,
      updatePrecisionValue,
      updatePrecisionWeightages
    }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};
