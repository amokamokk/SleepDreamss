export interface SleepSession {
  id: string;
  bedtime: Date;
  wakeTime: Date | null;
  duration: number; // in milliseconds
  quality: number; // 0-100 percentage
  isManual: boolean;
  confidence: number; // 0-1 confidence level for automatic detection
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SleepSettings {
  autoDetectionEnabled: boolean;
  notificationsEnabled: boolean;
  batteryOptimized: boolean;
  bedtimeReminder?: Date;
  wakeUpReminder?: Date;
  sleepGoalHours: number;
  detectionSensitivity: 'low' | 'medium' | 'high';
}

export interface SleepAnalytics {
  averageDuration: number;
  averageQuality: number;
  consistencyScore: number;
  sleepDebt: number;
  weeklyTrend: 'improving' | 'declining' | 'stable';
  bestSleepDay: string;
  worstSleepDay: string;
}

export interface DeviceMotionData {
  timestamp: number;
  acceleration: {
    x: number;
    y: number;
    z: number;
  };
  rotation: {
    alpha: number;
    beta: number;
    gamma: number;
  };
}

export interface SleepDetectionState {
  isTracking: boolean;
  currentSession: SleepSession | null;
  lastActivity: Date;
  inactivityDuration: number;
  sleepProbability: number;
}