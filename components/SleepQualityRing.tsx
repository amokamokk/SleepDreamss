import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useFonts, Inter_600SemiBold } from '@expo-google-fonts/inter';

interface SleepQualityRingProps {
  quality: number; // 0-100 percentage
  size?: number;
}

export default function SleepQualityRing({ quality, size = 120 }: SleepQualityRingProps) {
  const progress = useSharedValue(0);
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;

  const [fontsLoaded] = useFonts({
    'Inter-SemiBold': Inter_600SemiBold,
  });

  useEffect(() => {
    progress.value = withTiming(quality / 100, {
      duration: 1500,
      easing: Easing.out(Easing.cubic),
    });
  }, [quality]);

  const animatedStyle = useAnimatedStyle(() => {
    const strokeDashoffset = circumference * (1 - progress.value);
    return {
      strokeDashoffset,
    };
  });

  const getQualityColor = (quality: number): string => {
    if (quality >= 80) return '#48bb78';
    if (quality >= 60) return '#ed8936';
    return '#f56565';
  };

  const getQualityLabel = (quality: number): string => {
    if (quality >= 80) return 'Excelente';
    if (quality >= 60) return 'Buena';
    if (quality >= 40) return 'Regular';
    return 'Mala';
  };

  if (!fontsLoaded) {
    return null;
  }

  const qualityColor = getQualityColor(quality);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e2e8f0"
          strokeWidth="8"
          fill="transparent"
        />
        {/* Progress circle */}
        <Animated.Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={qualityColor}
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={circumference}
          strokeLinecap="round"
          style={[
            {
              transform: [{ rotate: '-90deg' }],
              transformOrigin: `${size / 2}px ${size / 2}px`,
            },
            animatedStyle,
          ]}
        />
      </Svg>
      
      <View style={styles.centerContent}>
        <Text style={[styles.qualityNumber, { color: qualityColor }]}>
          {Math.round(quality)}%
        </Text>
        <Text style={styles.qualityLabel}>
          {getQualityLabel(quality)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  svg: {
    position: 'absolute',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  qualityNumber: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  qualityLabel: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#718096',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});