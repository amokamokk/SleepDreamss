import { SleepSession } from '@/types/sleep';

export class SleepAnalytics {
  private sessions: SleepSession[];

  constructor(sessions: SleepSession[]) {
    this.sessions = sessions.filter(session => session.wakeTime !== null);
  }

  getAverageDuration(): number {
    if (this.sessions.length === 0) return 0;
    
    const totalDuration = this.sessions.reduce((sum, session) => sum + session.duration, 0);
    return totalDuration / this.sessions.length;
  }

  getAverageQuality(): number {
    if (this.sessions.length === 0) return 0;
    
    const totalQuality = this.sessions.reduce((sum, session) => sum + session.quality, 0);
    return totalQuality / this.sessions.length;
  }

  getConsistencyScore(): number {
    if (this.sessions.length < 2) return 0;
    
    // Calculate bedtime consistency
    const bedtimes = this.sessions.map(session => {
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

  getDurationTrend(): string {
    if (this.sessions.length < 3) return 'Estable';
    
    const recentSessions = this.sessions.slice(-7); // Last 7 sessions
    const olderSessions = this.sessions.slice(-14, -7); // Previous 7 sessions
    
    if (olderSessions.length === 0) return 'Estable';
    
    const recentAvg = recentSessions.reduce((sum, s) => sum + s.duration, 0) / recentSessions.length;
    const olderAvg = olderSessions.reduce((sum, s) => sum + s.duration, 0) / olderSessions.length;
    
    const difference = recentAvg - olderAvg;
    const threshold = 30 * 60 * 1000; // 30 minutes
    
    if (difference > threshold) return 'Mejorando';
    if (difference < -threshold) return 'Empeorando';
    return 'Estable';
  }

  getSleepDebt(): string {
    const debtHours = this.getSleepDebtHours();
    
    if (debtHours <= 0) return 'Sin deuda';
    if (debtHours <= 2) return `${debtHours.toFixed(1)}h deuda`;
    return `${debtHours.toFixed(1)}h deuda (Alta)`;
  }

  getSleepDebtHours(): number {
    const targetSleep = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
    const recentSessions = this.sessions.slice(-7); // Last week
    
    if (recentSessions.length === 0) return 0;
    
    const totalDebt = recentSessions.reduce((debt, session) => {
      const sessionDebt = Math.max(0, targetSleep - session.duration);
      return debt + sessionDebt;
    }, 0);
    
    return totalDebt / (1000 * 60 * 60); // Convert to hours
  }

  getBestSleepDay(): string {
    if (this.sessions.length === 0) return 'N/D';
    
    const dayQuality: { [key: string]: { total: number; count: number } } = {};
    
    this.sessions.forEach(session => {
      const day = new Date(session.bedtime).toLocaleDateString('es-ES', { weekday: 'long' });
      if (!dayQuality[day]) {
        dayQuality[day] = { total: 0, count: 0 };
      }
      dayQuality[day].total += session.quality;
      dayQuality[day].count += 1;
    });
    
    let bestDay = '';
    let bestAverage = 0;
    
    Object.entries(dayQuality).forEach(([day, data]) => {
      const average = data.total / data.count;
      if (average > bestAverage) {
        bestAverage = average;
        bestDay = day;
      }
    });
    
    return bestDay || 'N/D';
  }

  getWorstSleepDay(): string {
    if (this.sessions.length === 0) return 'N/D';
    
    const dayQuality: { [key: string]: { total: number; count: number } } = {};
    
    this.sessions.forEach(session => {
      const day = new Date(session.bedtime).toLocaleDateString('es-ES', { weekday: 'long' });
      if (!dayQuality[day]) {
        dayQuality[day] = { total: 0, count: 0 };
      }
      dayQuality[day].total += session.quality;
      dayQuality[day].count += 1;
    });
    
    let worstDay = '';
    let worstAverage = 100;
    
    Object.entries(dayQuality).forEach(([day, data]) => {
      const average = data.total / data.count;
      if (average < worstAverage) {
        worstAverage = average;
        worstDay = day;
      }
    });
    
    return worstDay || 'N/D';
  }

  getWeeklyTrendData(): Array<{ day: string; duration: number; quality: number }> {
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const daySession = this.sessions.find(session => {
        const sessionDate = new Date(session.bedtime);
        return sessionDate.toDateString() === date.toDateString();
      });
      
      last7Days.push({
        day: date.toLocaleDateString('es-ES', { weekday: 'short' }),
        duration: daySession ? daySession.duration / (1000 * 60 * 60) : 0, // Convert to hours
        quality: daySession ? daySession.quality : 0,
      });
    }
    
    return last7Days;
  }

  getRecommendations(): string[] {
    const recommendations: string[] = [];
    const avgDuration = this.getAverageDuration() / (1000 * 60 * 60); // Convert to hours
    const consistency = this.getConsistencyScore();
    const avgQuality = this.getAverageQuality();
    
    if (avgDuration < 7) {
      recommendations.push('Trata de dormir al menos 7-8 horas por noche para una salud óptima.');
    }
    
    if (consistency < 70) {
      recommendations.push('Mantén un horario de sueño consistente, incluso los fines de semana.');
    }
    
    if (avgQuality < 70) {
      recommendations.push('Considera mejorar tu ambiente de sueño - manténlo fresco, oscuro y silencioso.');
    }
    
    const sleepDebt = this.getSleepDebtHours();
    if (sleepDebt > 2) {
      recommendations.push('Tienes una deuda de sueño significativa. Trata de recuperarte gradualmente.');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('¡Excelente trabajo! Tus patrones de sueño se ven saludables. ¡Sigue así!');
    }
    
    return recommendations;
  }
}