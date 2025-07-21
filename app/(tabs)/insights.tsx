import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, Target, Award, CircleAlert as AlertCircle } from 'lucide-react-native';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { SleepSession } from '@/types/sleep';
import { StorageService } from '@/services/storage';
import { SleepAnalytics } from '@/services/analytics';

interface InsightCard {
  id: string;
  title: string;
  value: string;
  description: string;
  type: 'positive' | 'neutral' | 'warning';
  icon: React.ReactNode;
}

export default function Insights() {
  const [sleepSessions, setSleepSessions] = useState<SleepSession[]>([]);
  const [insights, setInsights] = useState<InsightCard[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month'>('week');

  const [fontsLoaded] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    loadSleepData();
  }, [selectedTimeframe]);

  const loadSleepData = async () => {
    const sessions = selectedTimeframe === 'week' 
      ? await StorageService.getWeeklySleepSessions()
      : await StorageService.getMonthlySleepSessions();
    
    setSleepSessions(sessions);
    generateInsights(sessions);
  };

  const generateInsights = (sessions: SleepSession[]) => {
    const analytics = new SleepAnalytics(sessions);
    
    const newInsights: InsightCard[] = [
      {
        id: 'consistency',
        title: 'Consistencia del Sueño',
        value: `${analytics.getConsistencyScore()}%`,
        description: analytics.getConsistencyScore() > 80 
          ? '¡Excelente! Tu horario de sueño es muy consistente.'
          : 'Trata de mantener un horario de sueño más regular.',
        type: analytics.getConsistencyScore() > 80 ? 'positive' : 'warning',
        icon: <Target size={24} color={analytics.getConsistencyScore() > 80 ? '#48bb78' : '#ed8936'} />
      },
      {
        id: 'duration',
        title: 'Tendencia de Duración',
        value: analytics.getDurationTrend(),
        description: analytics.getAverageDuration() >= 7 * 60 * 60 * 1000
          ? 'Estás durmiendo la cantidad adecuada de tiempo.'
          : 'Considera acostarte más temprano para mejor salud.',
        type: analytics.getAverageDuration() >= 7 * 60 * 60 * 1000 ? 'positive' : 'warning',
        icon: <TrendingUp size={24} color="#4fd1c7" />
      },
      {
        id: 'quality',
        title: 'Calidad del Sueño',
        value: `${Math.round(analytics.getAverageQuality())}%`,
        description: analytics.getAverageQuality() > 75
          ? '¡Tu calidad de sueño es excelente!'
          : 'Enfócate en mejorar tu ambiente de sueño.',
        type: analytics.getAverageQuality() > 75 ? 'positive' : 'neutral',
        icon: <Award size={24} color={analytics.getAverageQuality() > 75 ? '#48bb78' : '#718096'} />
      },
      {
        id: 'debt',
        title: 'Deuda de Sueño',
        value: analytics.getSleepDebt(),
        description: analytics.getSleepDebtHours() > 2
          ? 'Tienes una deuda de sueño significativa. Considera recuperarte.'
          : 'Tu deuda de sueño es manejable.',
        type: analytics.getSleepDebtHours() > 2 ? 'warning' : 'positive',
        icon: <AlertCircle size={24} color={analytics.getSleepDebtHours() > 2 ? '#f56565' : '#48bb78'} />
      }
    ];

    setInsights(newInsights);
  };

  const getInsightCardStyle = (type: string) => {
    switch (type) {
      case 'positive':
        return { backgroundColor: 'rgba(72, 187, 120, 0.1)', borderColor: '#48bb78' };
      case 'warning':
        return { backgroundColor: 'rgba(237, 137, 54, 0.1)', borderColor: '#ed8936' };
      default:
        return { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: '#718096' };
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <LinearGradient
      colors={['#1a365d', '#2d3748']}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Análisis del Sueño</Text>
          <Text style={styles.subtitle}>Análisis personalizado de tus patrones de sueño</Text>
          
          {/* Timeframe Selector */}
          <View style={styles.timeframeSelector}>
            <TouchableOpacity
              style={[
                styles.timeframeButton,
                selectedTimeframe === 'week' && styles.timeframeButtonActive
              ]}
              onPress={() => setSelectedTimeframe('week')}
            >
              <Text style={[
                styles.timeframeButtonText,
                selectedTimeframe === 'week' && styles.timeframeButtonTextActive
              ]}>
                Esta Semana
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.timeframeButton,
                selectedTimeframe === 'month' && styles.timeframeButtonActive
              ]}
              onPress={() => setSelectedTimeframe('month')}
            >
              <Text style={[
                styles.timeframeButtonText,
                selectedTimeframe === 'month' && styles.timeframeButtonTextActive
              ]}>
                Este Mes
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Key Metrics */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>
              {sleepSessions.length > 0 
                ? `${Math.floor((sleepSessions.reduce((acc, s) => acc + s.duration, 0) / sleepSessions.length) / (1000 * 60 * 60))}h ${Math.floor(((sleepSessions.reduce((acc, s) => acc + s.duration, 0) / sleepSessions.length) % (1000 * 60 * 60)) / (1000 * 60))}m`
                : '0h 0m'
              }
            </Text>
            <Text style={styles.metricLabel}>Sueño Promedio</Text>
          </View>
          
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>
              {sleepSessions.length > 0 
                ? `${Math.round(sleepSessions.reduce((acc, s) => acc + s.quality, 0) / sleepSessions.length)}%`
                : '0%'
              }
            </Text>
            <Text style={styles.metricLabel}>Calidad Promedio</Text>
          </View>
        </View>

        {/* Insights Cards */}
        <View style={styles.insightsContainer}>
          {insights.map((insight) => (
            <View 
              key={insight.id} 
              style={[styles.insightCard, getInsightCardStyle(insight.type)]}
            >
              <View style={styles.insightHeader}>
                {insight.icon}
                <View style={styles.insightTitleContainer}>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <Text style={styles.insightValue}>{insight.value}</Text>
                </View>
              </View>
              <Text style={styles.insightDescription}>{insight.description}</Text>
            </View>
          ))}
        </View>

        {/* Sleep Goals */}
        <View style={styles.goalsContainer}>
          <Text style={styles.sectionTitle}>Objetivos de Sueño</Text>
          
          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Text style={styles.goalTitle}>Meta Diaria de Sueño</Text>
              <Text style={styles.goalValue}>8h 0m</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '85%' }]} />
            </View>
            <Text style={styles.goalProgress}>85% logrado esta semana</Text>
          </View>

          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Text style={styles.goalTitle}>Meta de Consistencia</Text>
              <Text style={styles.goalValue}>90%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '72%' }]} />
            </View>
            <Text style={styles.goalProgress}>72% puntuación de consistencia</Text>
          </View>
        </View>

        {/* Recommendations */}
        <View style={styles.recommendationsContainer}>
          <Text style={styles.sectionTitle}>Recomendaciones</Text>
          
          <View style={styles.recommendationCard}>
            <Text style={styles.recommendationTitle}>💡 Optimiza tu Hora de Dormir</Text>
            <Text style={styles.recommendationText}>
              Basado en tus patrones, intenta acostarte 30 minutos antes para mejorar la calidad del sueño.
            </Text>
          </View>

          <View style={styles.recommendationCard}>
            <Text style={styles.recommendationTitle}>🌙 Consistencia de Fin de Semana</Text>
            <Text style={styles.recommendationText}>
              Mantén tu horario de sueño de días laborables en los fines de semana para mejor consistencia general.
            </Text>
          </View>
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
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#a0aec0',
    marginBottom: 24,
  },
  timeframeSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 4,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  timeframeButtonActive: {
    backgroundColor: '#4fd1c7',
  },
  timeframeButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#a0aec0',
  },
  timeframeButtonTextActive: {
    color: '#1a365d',
  },
  metricsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 32,
    gap: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#a0aec0',
  },
  insightsContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  insightCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightTitleContainer: {
    marginLeft: 16,
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
    marginBottom: 4,
  },
  insightValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#4fd1c7',
  },
  insightDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#e2e8f0',
    lineHeight: 20,
  },
  goalsContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  goalCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  goalValue: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#4fd1c7',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4fd1c7',
    borderRadius: 4,
  },
  goalProgress: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#a0aec0',
  },
  recommendationsContainer: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  recommendationCard: {
    backgroundColor: 'rgba(79, 209, 199, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#4fd1c7',
  },
  recommendationTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#e2e8f0',
    lineHeight: 20,
  },
});