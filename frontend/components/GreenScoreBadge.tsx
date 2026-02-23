import React, { FC } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../constants/Colors';

interface GreenScoreBadgeProps {
  score: string; // e.g. 'A+', 'A', 'B', etc.
  value?: number; // Numeric value for the score (0-100)
  label?: string; // Optional label
  size?: 'small' | 'normal' | 'large'; // Size variant
}

const GreenScoreBadge: FC<GreenScoreBadgeProps> = ({ 
  score, 
  value, 
  label = 'Green Score',
  size = 'normal'
}) => {
  // Get color based on green score
  const getScoreColor = (scoreGrade: string) => {
    if (!scoreGrade) return Colors.textSecondary;
    const normalizedScore = scoreGrade.toUpperCase();
    switch (normalizedScore) {
      case 'A+':
      case 'A':
        return Colors.gradeA;
      case 'B':
        return Colors.gradeB;
      case 'C':
        return Colors.gradeC;
      case 'D':
        return Colors.gradeD;
      case 'F':
        return Colors.gradeF;
      default:
        return Colors.textSecondary;
    }
  };

  // Get size dimensions
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: styles.smallContainer,
          scoreText: styles.smallScoreText,
          labelText: styles.smallLabelText,
        };
      case 'large':
        return {
          container: styles.largeContainer,
          scoreText: styles.largeScoreText,
          labelText: styles.largeLabelText,
        };
      default: // normal
        return {
          container: styles.normalContainer,
          scoreText: styles.normalScoreText,
          labelText: styles.normalLabelText,
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const scoreColor = getScoreColor(score);

  return (
    <View style={[styles.container, sizeStyles.container, { borderColor: scoreColor }]}>
      <View style={styles.header}>
        <Text style={[styles.labelText, sizeStyles.labelText, { color: scoreColor }]}>
          {label}
        </Text>
        {value !== undefined && (
          <Text style={[styles.valueText, sizeStyles.labelText, { color: Colors.textSecondary }]}>
            {value.toFixed(1)}
          </Text>
        )}
      </View>
      <View style={styles.content}>
        <Text style={[styles.scoreText, sizeStyles.scoreText, { color: scoreColor }]}>
          {score}
        </Text>
        <MaterialIcons 
          name="eco" 
          size={size === 'small' ? 16 : size === 'large' ? 28 : 22} 
          color={scoreColor} 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 12,
    minWidth: 120,
  },
  smallContainer: {
    padding: 8,
    minWidth: 90,
  },
  largeContainer: {
    padding: 16,
    minWidth: 150,
  },
  normalContainer: {
    padding: 12,
    minWidth: 120,
  },
  normalScoreText: {
    fontSize: 24,
  },
  normalLabelText: {
    fontSize: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  smallLabelText: {
    fontSize: 10,
  },
  largeLabelText: {
    fontSize: 14,
  },
  valueText: {
    fontSize: 10,
    fontWeight: '500',
  },
  scoreText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 8,
  },
  smallScoreText: {
    fontSize: 18,
  },
  largeScoreText: {
    fontSize: 32,
  },
});

export default GreenScoreBadge;