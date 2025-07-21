import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, Clock, Star, CreditCard as Edit3 } from 'lucide-react-native';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { SleepSession } from '@/types/sleep';
import { StorageService } from '@/services/storage';

export default function History() {
  const [sleepSessions, setSleepSessions] = useState<SleepSession[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');

  const [fontsLoaded] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    loadSleepHistory();
  }, [selectedPeriod]);

  const loadSleepHistory = async () => {
    let sessions: SleepSession[] = [];
    
    switch (selectedPeriod) {
      case 'week':
        sessions = await StorageService.getWeeklySleepSessions();
        break;
      case 'month':
        sessions = await StorageService.getMonthlySleepSessions();
        break;
      case 'year':
        sessions = await StorageService.getYearlySleepSessions();
        break;
    }
    
    setSleepSessions(sessions.sort((a, b) => 
      new Date(b.bedtime).getTime() - new Date(a.bedtime).getTime()
    ));
  };

  const formatDuration = (milliseconds: number): string => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const formatTime = (date: Date): string => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date): string => {
    const today = new Date();
    const sessionDate = new Date(date);
    
    if (sessionDate.toDateString() === today.toDateString()) {
      return 'Hoy';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (sessionDate.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    }
    
    return sessionDate.toLocaleDateString('es-ES', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getQualityColor = (quality: number): string => {
    if (quality >= 80) return '#48bb78';
    if (quality >= 60) return '#ed8936';
    return '#f56565';
  };

  const renderSleepSession = ({ item }: { item: SleepSession }) => (
    <View style={styles.sessionCard}>
      <View style={styles.sessionHeader}>
        <View>
          <Text style={styles.sessionDate}>{formatDate(item.bedtime)}</Text>
          <Text style={styles.sessionTime}>
            {formatTime(item.bedtime)} - {item.wakeTime ? formatTime(item.wakeTime) : 'Aún durmiendo'}
          </Text>
        </View>
        <TouchableOpacity style={styles.editButton}>
          <Edit3 size={16} color="#718096" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.sessionStats}>
        <View style={styles.statItem}>
          <Clock size={20} color="#4fd1c7" />
          <Text style={styles.statValue}>{formatDuration(item.duration)}</Text>
          <Text style={styles.statLabel}>Duración</Text>
        </View>
        
        <View style={styles.statItem}>
          <Star size={20} color={getQualityColor(item.quality)} />
          <Text style={[styles.statValue, { color: getQualityColor(item.quality) }]}>
            {item.quality}%
          </Text>
          <Text style={styles.statLabel}>Calidad</Text>
        </View>
        
        <View style={styles.statItem}>
          <View style={[styles.confidenceIndicator, { 
            backgroundColor: item.confidence > 0.8 ? '#48bb78' : '#ed8936' 
          }]} />
          <Text style={styles.statValue}>
            {item.isManual ? 'Manual' : 'Automático'}
          </Text>
          <Text style={styles.statLabel}>Detección</Text>
        </View>
      </View>
    </View>
  );

  if (!fontsLoaded) {
    return null;
  }

  return (
    <LinearGradient
      colors={['#1a365d', '#2d3748']}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Historial de Sueño</Text>
        
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {(['week', 'month', 'year'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.periodButtonActive
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.periodButtonTextActive
              ]}>
                {period === 'week' ? 'Semana' : period === 'month' ? 'Mes' : 'Año'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>
            {sleepSessions.length > 0 
              ? formatDuration(sleepSessions.reduce((acc, session) => acc + session.duration, 0) / sleepSessions.length)
              : '0h 0m'
            }
          </Text>
          <Text style={styles.summaryLabel}>Sueño Promedio</Text>
        </View>
        
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>
            {sleepSessions.length > 0 
              ? Math.round(sleepSessions.reduce((acc, session) => acc + session.quality, 0) / sleepSessions.length)
              : 0
            }%
          </Text>
          <Text style={styles.summaryLabel}>Calidad Promedio</Text>
        </View>
        
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{sleepSessions.length}</Text>
          <Text style={styles.summaryLabel}>Sesiones</Text>
        </View>
      </View>

      {/* Sleep Sessions List */}
      <FlatList
        data={sleepSessions}
        renderItem={renderSleepSession}
        keyExtractor={(item) => item.id}
        style={styles.sessionsList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.sessionsListContent}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    marginBottom: 24,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: '#4fd1c7',
  },
  periodButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#a0aec0',
  },
  periodButtonTextActive: {
    color: '#1a365d',
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#a0aec0',
    textAlign: 'center',
  },
  sessionsList: {
    flex: 1,
  },
  sessionsListContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  sessionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sessionDate: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#2d3748',
    marginBottom: 4,
  },
  sessionTime: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#718096',
  },
  editButton: {
    padding: 8,
  },
  sessionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#2d3748',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#718096',
  },
  confidenceIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
});