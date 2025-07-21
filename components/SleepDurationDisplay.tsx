import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';

interface SleepDurationDisplayProps {
  duration: number; // in milliseconds
  isCurrentlyAsleep: boolean;
}

export default function SleepDurationDisplay({ duration, isCurrentlyAsleep }: SleepDurationDisplayProps) {
  const [fontsLoaded] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Bold': Inter_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  const formatDuration = (milliseconds: number): { hours: string; minutes: string } => {
    const totalMinutes = Math.floor(milliseconds / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return {
      hours: hours.toString(),
      minutes: minutes.toString().padStart(2, '0'),
    };
  };

  const { hours, minutes } = formatDuration(duration);

  return (
    <View style={styles.container}>
      <View style={styles.timeContainer}>
        <Text style={styles.timeNumber}>{hours}</Text>
        <Text style={styles.timeUnit}>h</Text>
        <Text style={styles.timeSeparator}> </Text>
        <Text style={styles.timeNumber}>{minutes}</Text>
        <Text style={styles.timeUnit}>m</Text>
      </View>
      <Text style={styles.label}>
        {isCurrentlyAsleep ? 'Duración del Sueño' : 'Sueño de Anoche'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 20,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  timeNumber: {
    fontSize: 48,
    fontFamily: 'Inter-Bold',
    color: '#1a365d',
    lineHeight: 56,
  },
  timeUnit: {
    fontSize: 24,
    fontFamily: 'Inter-Regular',
    color: '#718096',
    marginLeft: 4,
  },
  timeSeparator: {
    fontSize: 48,
    fontFamily: 'Inter-Bold',
    color: '#1a365d',
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#718096',
  },
});