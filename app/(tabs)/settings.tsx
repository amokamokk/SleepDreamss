import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, Shield, Smartphone, Moon, Download, Trash2, CircleHelp as HelpCircle, ChevronRight } from 'lucide-react-native';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { SleepDetectionService } from '@/services/sleepDetection';
import { StorageService } from '@/services/storage';

interface SettingItem {
  id: string;
  title: string;
  description: string;
  type: 'toggle' | 'navigation' | 'action';
  icon: React.ReactNode;
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
}

export default function Settings() {
  const [autoDetectionEnabled, setAutoDetectionEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [batteryOptimized, setBatteryOptimized] = useState(true);

  const [fontsLoaded] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const settings = await StorageService.getSettings();
    setAutoDetectionEnabled(settings.autoDetectionEnabled ?? true);
    setNotificationsEnabled(settings.notificationsEnabled ?? false);
    setBatteryOptimized(settings.batteryOptimized ?? true);
  };

  const handleAutoDetectionToggle = async (value: boolean) => {
    setAutoDetectionEnabled(value);
    await StorageService.updateSettings({ autoDetectionEnabled: value });
    
    if (value) {
      await SleepDetectionService.startTracking();
    } else {
      await SleepDetectionService.stopTracking();
    }
  };

  const handleNotificationsToggle = async (value: boolean) => {
    setNotificationsEnabled(value);
    await StorageService.updateSettings({ notificationsEnabled: value });
  };

  const handleBatteryOptimizationToggle = async (value: boolean) => {
    setBatteryOptimized(value);
    await StorageService.updateSettings({ batteryOptimized: value });
  };

  const handleExportData = async () => {
    try {
      const sessions = await StorageService.getAllSleepSessions();
      // In a real implementation, this would trigger a file export
      Alert.alert(
        'Exportar Datos',
        `Se encontraron ${sessions.length} sesiones de sueño. La funcionalidad de exportación se implementará en una actualización futura.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudieron exportar los datos. Por favor intenta de nuevo.');
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Borrar Todos los Datos',
      'Esto eliminará permanentemente todos tus datos de sueño. Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            await StorageService.clearAllData();
            Alert.alert('Éxito', 'Todos los datos de sueño han sido eliminados.');
          }
        }
      ]
    );
  };

  const settingSections = [
    {
      title: 'Detección del Sueño',
      items: [
        {
          id: 'auto-detection',
          title: 'Detección Automática',
          description: 'Rastrea automáticamente el sueño basado en la inactividad del teléfono',
          type: 'toggle' as const,
          icon: <Moon size={24} color="#4fd1c7" />,
          value: autoDetectionEnabled,
          onToggle: handleAutoDetectionToggle,
        },
        {
          id: 'battery-optimization',
          title: 'Optimización de Batería',
          description: 'Reduce el uso de batería durante el seguimiento del sueño',
          type: 'toggle' as const,
          icon: <Smartphone size={24} color="#4fd1c7" />,
          value: batteryOptimized,
          onToggle: handleBatteryOptimizationToggle,
        },
      ],
    },
    {
      title: 'Notificaciones',
      items: [
        {
          id: 'notifications',
          title: 'Recordatorios de Sueño',
          description: 'Recibe notificaciones sobre horarios de dormir y despertar',
          type: 'toggle' as const,
          icon: <Bell size={24} color="#4fd1c7" />,
          value: notificationsEnabled,
          onToggle: handleNotificationsToggle,
        },
      ],
    },
    {
      title: 'Datos y Privacidad',
      items: [
        {
          id: 'privacy',
          title: 'Política de Privacidad',
          description: 'Aprende cómo protegemos tus datos',
          type: 'navigation' as const,
          icon: <Shield size={24} color="#4fd1c7" />,
          onPress: () => {
            Alert.alert('Política de Privacidad', 'Todos los datos de sueño se almacenan localmente en tu dispositivo y nunca se comparten con terceros.');
          },
        },
        {
          id: 'export',
          title: 'Exportar Datos',
          description: 'Descarga tus datos de sueño',
          type: 'action' as const,
          icon: <Download size={24} color="#4fd1c7" />,
          onPress: handleExportData,
        },
        {
          id: 'clear',
          title: 'Borrar Todos los Datos',
          description: 'Elimina permanentemente todos los registros de sueño',
          type: 'action' as const,
          icon: <Trash2 size={24} color="#f56565" />,
          onPress: handleClearData,
        },
      ],
    },
    {
      title: 'Soporte',
      items: [
        {
          id: 'help',
          title: 'Ayuda y Preguntas Frecuentes',
          description: 'Obtén ayuda para usar la aplicación',
          type: 'navigation' as const,
          icon: <HelpCircle size={24} color="#4fd1c7" />,
          onPress: () => {
            Alert.alert('Ayuda', 'Para soporte, por favor contáctanos en soporte@sleeptracker.app');
          },
        },
      ],
    },
  ];

  const renderSettingItem = (item: SettingItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.settingItem}
      onPress={item.onPress}
      disabled={item.type === 'toggle'}
    >
      <View style={styles.settingContent}>
        <View style={styles.settingIcon}>
          {item.icon}
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{item.title}</Text>
          <Text style={styles.settingDescription}>{item.description}</Text>
        </View>
        <View style={styles.settingAction}>
          {item.type === 'toggle' && (
            <Switch
              value={item.value}
              onValueChange={item.onToggle}
              trackColor={{ false: '#4a5568', true: '#4fd1c7' }}
              thumbColor={item.value ? '#ffffff' : '#a0aec0'}
            />
          )}
          {item.type === 'navigation' && (
            <ChevronRight size={20} color="#718096" />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

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
          <Text style={styles.title}>Configuración</Text>
          <Text style={styles.subtitle}>Personaliza tu experiencia de seguimiento del sueño</Text>
        </View>

        {/* Settings Sections */}
        {settingSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map(renderSettingItem)}
            </View>
          </View>
        ))}

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoTitle}>Rastreador de Sueño</Text>
          <Text style={styles.appInfoVersion}>Versión 1.0.0</Text>
          <Text style={styles.appInfoDescription}>
            Una aplicación de seguimiento del sueño enfocada en la privacidad que monitorea tus patrones de sueño automáticamente.
          </Text>
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
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
    marginBottom: 16,
  },
  sectionContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingItem: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  settingIcon: {
    marginRight: 16,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#a0aec0',
    lineHeight: 20,
  },
  settingAction: {
    marginLeft: 16,
  },
  appInfo: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  appInfoTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  appInfoVersion: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#4fd1c7',
    marginBottom: 16,
  },
  appInfoDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#a0aec0',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
});