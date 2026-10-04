export type SystemStatus = 'Optimal' | 'Stable' | 'Suboptimal' | 'Attention Required';

export interface PrecisionParameter {
  id: string;
  systemId: string;
  title: string;         // e.g., "Sleep Hours", "Relaxed Neck"
  rangeStart: number;    // e.g., 0
  rangeEnd: number;      // e.g., 8, or 10
  weightage: number;     // Percentage (0-100), all params in a system must sum to 100
  currentValue: number;  // Current daily input value (within range)
}

export interface BodySystem {
  id: string;
  name: string;
  description: string;
  iconName: string;
  colorClass: string; // e.g., 'cardio', 'nervous'
  status: SystemStatus;
  score: number; // 0 to 100
  subjectiveRating: number; // 1 to 10 scale
  precisionEnabled: boolean; // true if the user wants detailed tracking
  isTracking: boolean; // true if system is actively tracked
  precisionParameters: PrecisionParameter[]; // User-defined precision parameters
}

export type EventType = 'Symptom' | 'Diagnosis' | 'Surgery' | 'Test Result' | 'Checkup' | 'Medication Change';

export interface MedicalEvent {
  id: string;
  systemId: string;
  date: string; // YYYY-MM-DD
  type: EventType;
  title: string;
  description: string;
  severity?: 'Mild' | 'Moderate' | 'Severe';
  rating?: number; // Subjective rating out of 10 logged with this event
  notes?: string;
  time?: string; // HH:MM (e.g. 14:30)
}

export interface ProtectiveHabit {
  id: string;
  systemId: string;
  name: string;
  frequency: 'Daily' | 'Weekly' | 'As Needed';
  adherence: number; // Adherence percentage (0 - 100)
  isActive: boolean;
  notes?: string;
}

export interface HealthGoal {
  id: string;
  systemId: string;
  title: string;
  targetDate: string; // YYYY-MM-DD
  status: 'In Progress' | 'Achieved' | 'Stalled';
  metricTarget?: string;
}

export interface MetricLog {
  id: string;
  systemId: string;
  name: string; // e.g., 'Resting Heart Rate', 'Systolic BP', 'Deep Sleep'
  value: number;
  unit: string;
  timestamp: string; // ISO date string (YYYY-MM-DD)
}

export interface SystemScoreHistory {
  systemId: string;
  score: number;
  date: string; // YYYY-MM-DD
}
