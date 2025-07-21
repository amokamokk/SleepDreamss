import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { SleepSession } from '@/types/sleep';
import { useFonts, Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';

interface WeeklyTrendChartProps {
  data: SleepSession[];
}

const { width } = Dimensions.get('window');
const chartWidth = width - 80; // Account for padding

export default function WeeklyTrendChart({ data }: WeeklyTrendChartProps) {
  const [fontsLoaded] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-SemiBold': Inter_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  const getLast7Days = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const daySession = data.find(session => {
        const sessionDate = new Date(session.bedtime);
        return sessionDate.toDateString() === date.toDateString();
      });
      
      days.push({
        day: date.toLocaleDateString('es-ES', { weekday: 'short' }),
        duration: daySession ? daySession.duration / (1000 * 60 * 60) : 0, // Convert to hours
        quality: daySession ? daySession.quality : 0,
        hasData: !!daySession,
      });
    }
    
    return days;
  };

  const weekData = getLast7Days();
  const maxDuration = Math.max(...weekData.map(d => d.duration), 8); // Minimum 8 hours for scale
  const barWidth = (chartWidth - 60) / 7; // Account for spacing

  const getBarHeight = (duration: number): number => {
    const maxHeight = 80;
    return (duration / maxDuration) * maxHeight;
  };

  const getQualityColor = (quality: number): string => {
    if (quality >= 80) return '#48bb78';
    if (quality >= 60) return '#ed8936';
    if (quality > 0) return '#f56565';
    return '#4a5568';
  };

  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        {weekData.map((day, index) => (
          <View key={index} style={styles.barContainer}>
            <View style={styles.barWrapper}>
              <View
                style={[
                  styles.bar,
                  {
                    height: getBarHeight(day.duration),
                    backgroundColor: day.hasData ? getQualityColor(day.quality) : '#4a5568',
                    opacity: day.hasData ? 1 : 0.3,
                    width: barWidth - 8,
                  },
                ]}
              />
            </View>
            <Text style={styles.dayLabel}>{day.day}</Text>
            <Text style={styles.durationLabel}>
              {day.hasData ? `${day.duration.toFixed(1)}h` : '--'}
            </Text>
          </View>
        ))}
      </View>
      
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#48bb78' }]} />
         <Text style={styles.legendText}>Excelente</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#ed8936' }]} />
         <Text style={styles.legendText}>Buena</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#f56565' }]} />
         <Text style={styles.legendText}>Mala</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    width: chartWidth,
    marginBottom: 20,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  barWrapper: {
    height: 80,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 8,
  },
  bar: {
    borderRadius: 4,
    minHeight: 4,
  },
  dayLabel: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
    marginBottom: 4,
  },
  durationLabel: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#a0aec0',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#a0aec0',
  },
});