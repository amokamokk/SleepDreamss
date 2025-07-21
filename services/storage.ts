import AsyncStorage from '@react-native-async-storage/async-storage';
import { SleepSession, SleepSettings } from '@/types/sleep';

class StorageService {
  private static readonly SLEEP_SESSIONS_KEY = 'sleep_sessions';
  private static readonly SETTINGS_KEY = 'sleep_settings';

  static async saveSleepSession(session: SleepSession): Promise<void> {
    try {
      const existingSessions = await this.getSleepSessions();
      const sessionIndex = existingSessions.findIndex(s => s.id === session.id);
      
      if (sessionIndex >= 0) {
        existingSessions[sessionIndex] = session;
      } else {
        existingSessions.push(session);
      }
      
      await AsyncStorage.setItem(
        this.SLEEP_SESSIONS_KEY,
        JSON.stringify(existingSessions)
      );
    } catch (error) {
      console.error('Failed to save sleep session:', error);
      throw error;
    }
  }

  static async getSleepSessions(): Promise<SleepSession[]> {
    try {
      const sessionsJson = await AsyncStorage.getItem(this.SLEEP_SESSIONS_KEY);
      if (!sessionsJson) return [];
      
      const sessions = JSON.parse(sessionsJson);
      return sessions.map((session: any) => ({
        ...session,
        bedtime: new Date(session.bedtime),
        wakeTime: session.wakeTime ? new Date(session.wakeTime) : null,
        createdAt: session.createdAt ? new Date(session.createdAt) : undefined,
        updatedAt: session.updatedAt ? new Date(session.updatedAt) : undefined,
      }));
    } catch (error) {
      console.error('Failed to get sleep sessions:', error);
      return [];
    }
  }

  static async getWeeklySleepSessions(): Promise<SleepSession[]> {
    const sessions = await this.getSleepSessions();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return sessions.filter(session => 
      new Date(session.bedtime) >= oneWeekAgo
    );
  }

  static async getMonthlySleepSessions(): Promise<SleepSession[]> {
    const sessions = await this.getSleepSessions();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    return sessions.filter(session => 
      new Date(session.bedtime) >= oneMonthAgo
    );
  }

  static async getYearlySleepSessions(): Promise<SleepSession[]> {
    const sessions = await this.getSleepSessions();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    return sessions.filter(session => 
      new Date(session.bedtime) >= oneYearAgo
    );
  }

  static async getAllSleepSessions(): Promise<SleepSession[]> {
    return this.getSleepSessions();
  }

  static async deleteSleepSession(sessionId: string): Promise<void> {
    try {
      const sessions = await this.getSleepSessions();
      const filteredSessions = sessions.filter(session => session.id !== sessionId);
      
      await AsyncStorage.setItem(
        this.SLEEP_SESSIONS_KEY,
        JSON.stringify(filteredSessions)
      );
    } catch (error) {
      console.error('Failed to delete sleep session:', error);
      throw error;
    }
  }

  static async getSettings(): Promise<Partial<SleepSettings>> {
    try {
      const settingsJson = await AsyncStorage.getItem(this.SETTINGS_KEY);
      if (!settingsJson) {
        return this.getDefaultSettings();
      }
      
      const settings = JSON.parse(settingsJson);
      return {
        ...this.getDefaultSettings(),
        ...settings,
      };
    } catch (error) {
      console.error('Failed to get settings:', error);
      return this.getDefaultSettings();
    }
  }

  static async updateSettings(newSettings: Partial<SleepSettings>): Promise<void> {
    try {
      const currentSettings = await this.getSettings();
      const updatedSettings = { ...currentSettings, ...newSettings };
      
      await AsyncStorage.setItem(
        this.SETTINGS_KEY,
        JSON.stringify(updatedSettings)
      );
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  }

  static async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.SLEEP_SESSIONS_KEY,
        this.SETTINGS_KEY,
      ]);
    } catch (error) {
      console.error('Failed to clear all data:', error);
      throw error;
    }
  }

  private static getDefaultSettings(): SleepSettings {
    return {
      autoDetectionEnabled: true,
      notificationsEnabled: false,
      batteryOptimized: true,
      sleepGoalHours: 8,
      detectionSensitivity: 'medium',
    };
  }

  // Utility methods for data analysis
  static async getAverageSleepDuration(days: number = 7): Promise<number> {
    const sessions = await this.getSleepSessions();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const recentSessions = sessions.filter(session => 
      new Date(session.bedtime) >= cutoffDate && session.wakeTime
    );
    
    if (recentSessions.length === 0) return 0;
    
    const totalDuration = recentSessions.reduce((sum, session) => sum + session.duration, 0);
    return totalDuration / recentSessions.length;
  }

  static async getSleepConsistency(days: number = 7): Promise<number> {
    const sessions = await this.getSleepSessions();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const recentSessions = sessions.filter(session => 
      new Date(session.bedtime) >= cutoffDate && session.wakeTime
    );
    
    if (recentSessions.length < 2) return 0;
    
    // Calculate standard deviation of bedtimes
    const bedtimes = recentSessions.map(session => {
      const bedtime = new Date(session.bedtime);
      return bedtime.getHours() * 60 + bedtime.getMinutes();
    });
    
    const mean = bedtimes.reduce((sum, time) => sum + time, 0) / bedtimes.length;
    const variance = bedtimes.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) / bedtimes.length;
    const stdDev = Math.sqrt(variance);
    
    // Convert to consistency score (lower std dev = higher consistency)
    const maxStdDev = 120; // 2 hours
    const consistency = Math.max(0, (maxStdDev - stdDev) / maxStdDev) * 100;
    
    return Math.round(consistency);
  }
}

export { StorageService };