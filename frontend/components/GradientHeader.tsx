import React, { FC } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

interface GradientHeaderProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  style?: ViewStyle;
}

const GradientHeader: FC<GradientHeaderProps> = ({ 
  title, 
  subtitle, 
  icon, 
  style 
}) => {
  return (
    <LinearGradient
      colors={['#22c55e', '#16a34a']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, style]}
    >
      <View style={styles.content}>
        {icon && (
          <MaterialIcons 
            name={icon} 
            size={24} 
            color="white" 
            style={styles.icon} 
          />
        )}
        <View>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingTop: 50, // Extra padding for status bar
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  icon: {
    marginRight: 12,
  },
});

export default GradientHeader;