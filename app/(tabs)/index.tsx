import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Moon, Sun, CreditCard as Edit3, Calendar } from 'lucide-react-native';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { SleepSession } from '@/types/sleep';
import SleepDetectionService from '@/services/sleepDetection';
import { StorageService } from '@/services/storage';
import SleepDurationDisplay from '@/components/SleepDurationDisplay';
import SleepQualityRing from '@/components/SleepQualityRing';
import WeeklyTrendChart from '@/components/WeeklyTrendChart';

const { width } = Dimensions.get('window');

export default function Dashboard() {
  const [currentSession, setCurrentSession] = useState<SleepSession | null>(null);
  const [weeklyData, setWeeklyData] = useState<SleepSession[]>([]);
  const [isTracking, setIsTracking] = useState(false);

  const [fontsLoaded] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    loadTodaysSleep();
    loadWeeklyData();
    initializeSleepTracking();
  }, []);

  const loadTodaysSleep = async () => {
    const today = new Date().toDateString();
    const sessions = await StorageService.getSleepSessions();
    const todaySession = sessions.find(session => 
      new Date(session.bedtime).toDateString() === today
    );
    setCurrentSession(todaySession || null);
  };

  const loadWeeklyData = async () => {
    const sessions = await StorageService.getWeeklySleepSessions();
    setWeeklyData(sessions);
  };

  const initializeSleepTracking = async () => {
    const trackingStatus = await SleepDetectionService.isTracking();
    setIsTracking(trackingStatus);
    
    if (!trackingStatus) {
      await SleepDetectionService.startTracking();
      setIsTracking(true);
    }
  };

  const handleManualSleepToggle = async () => {
    if (currentSession && !currentSession.wakeTime) {
      // Mark as awake
      const updatedSession = {
        ...currentSession,
        wakeTime: new Date(),
        duration: Date.now() - new Date(currentSession.bedtime).getTime(),
      };
      await StorageService.saveSleepSession(updatedSession);
      setCurrentSession(updatedSession);
    } else {
      // Start new sleep session
      const newSession: SleepSession = {
        id: Date.now().toString(),
        bedtime: new Date(),
        wakeTime: null,
        duration: 0,
        quality: 0,
        isManual: true,
        confidence: 1.0,
      };
      await StorageService.saveSleepSession(newSession);
      setCurrentSession(newSession);
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  const isCurrentlyAsleep = currentSession && !currentSession.wakeTime;
  const sleepDuration = currentSession?.duration || 0;
  const sleepQuality = currentSession?.quality || 0;

  return (
    <LinearGradient
      colors={['#1a365d', '#2d3748']}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Buenas {isCurrentlyAsleep ? 'Noches' : 'Días'}</Text>
          <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          })}</Text>
        </View>

        {/* Main Sleep Display */}
        <View style={styles.mainCard}>
          <LinearGradient
            colors={['#ffffff', '#f7fafc']}
            style={styles.cardGradient}
          >
            <View style={styles.sleepStatusContainer}>
              {isCurrentlyAsleep ? (
                <Moon size={32} color="#4fd1c7" />
              ) : (
                <Sun size={32} color="#ed8936" />
              )}
              <Text style={styles.sleepStatus}>
                {isCurrentlyAsleep ? 'Durmiendo' : 'Despierto'}
              </Text>
            </View>

            <SleepDurationDisplay 
              duration={sleepDuration}
              isCurrentlyAsleep={isCurrentlyAsleep}
            />

            {!isCurrentlyAsleep && sleepDuration > 0 && (
              <SleepQualityRing quality={sleepQuality} />
            )}

            <TouchableOpacity 
              style={styles.manualButton}
              onPress={handleManualSleepToggle}
            >
              <Text style={styles.manualButtonText}>
                {isCurrentlyAsleep ? 'Marcar como Despierto' : 'Iniciar Sesión de Sueño'}
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>7h 32m</Text>
            <Text style={styles.statLabel}>Promedio Semanal</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>85%</Text>
            <Text style={styles.statLabel}>Calidad del Sueño</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>6/7</Text>
            <Text style={styles.statLabel}>Días Registrados</Text>
          </View>
        </View>

        {/* Weekly Trend */}
        <View style={styles.trendCard}>
          <View style={styles.trendHeader}>
            <Text style={styles.trendTitle}>Tendencia Semanal</Text>
            <TouchableOpacity>
              <Calendar size={20} color="#4fd1c7" />
            </TouchableOpacity>
          </View>
          <WeeklyTrendChart data={weeklyData} />
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton}>
            <Edit3 size={20} color="#1a365d" />
            <Text style={styles.actionText}>Editar Último Sueño</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  greeting: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#a0aec0',
  },
  mainCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  cardGradient: {
    padding: 32,
    alignItems: 'center',
  },
  sleepStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  sleepStatus: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#2d3748',
    marginLeft: 12,
  },
  manualButton: {
    backgroundColor: '#4fd1c7',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    marginTop: 24,
  },
  manualButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1a365d',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#a0aec0',
    textAlign: 'center',
  },
  trendCard: {
    marginHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  trendTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  actionsContainer: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 20,
    borderRadius: 16,
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1a365d',
    marginLeft: 12,
  },
});