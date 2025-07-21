import { DeviceMotion } from 'expo-sensors';
import * as Battery from 'expo-battery';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { SleepSession, DeviceMotionData, SleepDetectionState } from '@/types/sleep';
import { StorageService } from './storage';

class SleepDetectionService {
  private static instance: SleepDetectionService;
  private _isServiceActive = false;
  private motionSubscription: any = null;
  private detectionInterval: NodeJS.Timeout | null = null;
  private lastActivity: Date = new Date();
  private motionBuffer: DeviceMotionData[] = [];
  private currentSession: SleepSession | null = null;

  // Detection thresholds
  private readonly INACTIVITY_THRESHOLD = 15 * 60 * 1000; // 15 minutes
  private readonly MOTION_THRESHOLD = 0.1; // Accelerometer threshold
  private readonly SLEEP_CONFIDENCE_THRESHOLD = 0.8;
  private readonly DETECTION_INTERVAL = 30 * 1000; // 30 seconds

  static getInstance(): SleepDetectionService {
    if (!SleepDetectionService.instance) {
      SleepDetectionService.instance = new SleepDetectionService();
    }
    return SleepDetectionService.instance;
  }

  async startTracking(): Promise<void> {
    if (this._isServiceActive) return;

    try {
      // Request motion permissions (only on native platforms)
      if (Platform.OS !== 'web') {
        const { status } = await DeviceMotion.requestPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Motion permissions not granted');
        }
      }

      this._isServiceActive = true;
      this.lastActivity = new Date();
      
      // Start motion monitoring (only on native platforms)
      if (Platform.OS !== 'web') {
        this.startMotionMonitoring();
      }
      
      // Start periodic sleep detection
      this.startPeriodicDetection();
      
      await AsyncStorage.setItem('sleepTracking', 'true');
      console.log('Sleep tracking started');
    } catch (error) {
      console.error('Failed to start sleep tracking:', error);
      this._isServiceActive = false;
    }
  }

  async stopTracking(): Promise<void> {
    this._isServiceActive = false;
    
    if (this.motionSubscription) {
      this.motionSubscription.remove();
      this.motionSubscription = null;
    }
    
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
    }
    
    await AsyncStorage.setItem('sleepTracking', 'false');
    console.log('Sleep tracking stopped');
  }

  async isTracking(): Promise<boolean> {
    const trackingStatus = await AsyncStorage.getItem('sleepTracking');
    return trackingStatus === 'true';
  }

  private startMotionMonitoring(): void {
    if (Platform.OS === 'web') return;
    
    DeviceMotion.setUpdateInterval(1000); // 1 second intervals
    
    this.motionSubscription = DeviceMotion.addListener((motionData) => {
      if (!this._isServiceActive) return;

      const now = new Date();
      const motion: DeviceMotionData = {
        timestamp: now.getTime(),
        acceleration: motionData.acceleration || { x: 0, y: 0, z: 0 },
        rotation: motionData.rotation || { alpha: 0, beta: 0, gamma: 0 },
      };

      // Add to motion buffer (keep last 5 minutes)
      this.motionBuffer.push(motion);
      if (this.motionBuffer.length > 300) { // 5 minutes at 1 second intervals
        this.motionBuffer.shift();
      }

      // Check for significant motion
      if (this.hasSignificantMotion(motion)) {
        this.lastActivity = now;
      }
    });
  }

  private startPeriodicDetection(): void {
    this.detectionInterval = setInterval(() => {
      this.performSleepDetection();
    }, this.DETECTION_INTERVAL);
  }

  private hasSignificantMotion(motion: DeviceMotionData): boolean {
    const { acceleration } = motion;
    const magnitude = Math.sqrt(
      acceleration.x ** 2 + acceleration.y ** 2 + acceleration.z ** 2
    );
    return magnitude > this.MOTION_THRESHOLD;
  }

  private async performSleepDetection(): Promise<void> {
    const now = new Date();
    const inactivityDuration = now.getTime() - this.lastActivity.getTime();
    
    // Calculate sleep probability
    const sleepProbability = this.calculateSleepProbability(inactivityDuration, now);
    
    // Check if we should start a new sleep session
    if (!this.currentSession && sleepProbability > this.SLEEP_CONFIDENCE_THRESHOLD) {
      await this.startSleepSession(sleepProbability);
    }
    
    // Check if we should end the current sleep session
    if (this.currentSession && sleepProbability < 0.3) {
      await this.endSleepSession();
    }
  }

  private calculateSleepProbability(inactivityDuration: number, currentTime: Date): number {
    let probability = 0;
    
    // Inactivity factor (0-0.4)
    const inactivityFactor = Math.min(inactivityDuration / this.INACTIVITY_THRESHOLD, 1) * 0.4;
    probability += inactivityFactor;
    
    // Time of day factor (0-0.3)
    const hour = currentTime.getHours();
    let timeOfDayFactor = 0;
    if (hour >= 22 || hour <= 6) {
      timeOfDayFactor = 0.3; // Night time
    } else if (hour >= 13 && hour <= 15) {
      timeOfDayFactor = 0.15; // Afternoon nap time
    }
    probability += timeOfDayFactor;
    
    // Motion factor (0-0.2)
    const recentMotion = this.getRecentMotionLevel();
    const motionFactor = (1 - recentMotion) * 0.2;
    probability += motionFactor;
    
    // Battery charging factor (0-0.1)
    // Note: Battery status would need to be checked here
    // For now, we'll assume a small boost if it's typical charging time
    if (hour >= 23 || hour <= 6) {
      probability += 0.1;
    }
    
    return Math.min(probability, 1);
  }

  private getRecentMotionLevel(): number {
    if (this.motionBuffer.length === 0) return 0;
    
    const recentMotions = this.motionBuffer.slice(-60); // Last minute
    const motionSum = recentMotions.reduce((sum, motion) => {
      const magnitude = Math.sqrt(
        motion.acceleration.x ** 2 + 
        motion.acceleration.y ** 2 + 
        motion.acceleration.z ** 2
      );
      return sum + magnitude;
    }, 0);
    
    return Math.min(motionSum / recentMotions.length / this.MOTION_THRESHOLD, 1);
  }

  private async startSleepSession(confidence: number): Promise<void> {
    const bedtime = new Date(this.lastActivity.getTime() + this.INACTIVITY_THRESHOLD);
    
    this.currentSession = {
      id: Date.now().toString(),
      bedtime,
      wakeTime: null,
      duration: 0,
      quality: 0,
      isManual: false,
      confidence,
    };
    
    console.log('Sleep session started:', this.currentSession);
  }

  private async endSleepSession(): Promise<void> {
    if (!this.currentSession) return;
    
    const wakeTime = new Date();
    const duration = wakeTime.getTime() - this.currentSession.bedtime.getTime();
    
    // Calculate sleep quality based on duration and motion patterns
    const quality = this.calculateSleepQuality(duration);
    
    const completedSession: SleepSession = {
      ...this.currentSession,
      wakeTime,
      duration,
      quality,
    };
    
    await StorageService.saveSleepSession(completedSession);
    this.currentSession = null;
    
    console.log('Sleep session ended:', completedSession);
  }

  private calculateSleepQuality(duration: number): number {
    const hours = duration / (1000 * 60 * 60);
    
    // Base quality on duration (optimal: 7-9 hours)
    let quality = 0;
    if (hours >= 7 && hours <= 9) {
      quality = 90;
    } else if (hours >= 6 && hours <= 10) {
      quality = 75;
    } else if (hours >= 5 && hours <= 11) {
      quality = 60;
    } else {
      quality = 40;
    }
    
    // Adjust based on motion patterns during sleep
    const motionQuality = this.calculateMotionQuality();
    quality = (quality + motionQuality) / 2;
    
    return Math.round(Math.max(0, Math.min(100, quality)));
  }

  private calculateMotionQuality(): number {
    // Analyze motion patterns during sleep to determine quality
    // Less motion generally indicates better sleep quality
    const avgMotion = this.getRecentMotionLevel();
    return Math.round((1 - avgMotion) * 100);
  }

  getCurrentSession(): SleepSession | null {
    return this.currentSession;
  }

  getDetectionState(): SleepDetectionState {
    const now = new Date();
    return {
      isTracking: this._isServiceActive,
      currentSession: this.currentSession,
      lastActivity: this.lastActivity,
      inactivityDuration: now.getTime() - this.lastActivity.getTime(),
      sleepProbability: this.calculateSleepProbability(
        now.getTime() - this.lastActivity.getTime(),
        now
      ),
    };
  }
}

export { SleepDetectionService };
export default SleepDetectionService.getInstance();