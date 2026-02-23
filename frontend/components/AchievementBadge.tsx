import React, { FC } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../constants/Colors';

interface AchievementBadgeProps {
  achievement: {
    id: string;
    title: string;
    description: string;
    earned: boolean;
    earned_date?: string;
    icon: string; // Material icon name
    points: number;
  };
}

const AchievementBadge: FC<AchievementBadgeProps> = ({ achievement }) => {
  const isEarned = achievement.earned;
  
  return (
    <View style={[styles.container, isEarned ? styles.earnedContainer : styles.lockedContainer]}>
      <View style={styles.badgeContent}>
        <View style={[styles.iconContainer, isEarned ? styles.earnedIcon : styles.lockedIcon]}>
          <MaterialIcons 
            name={achievement.icon as any} 
            size={32} 
            color={isEarned ? Colors.surface : Colors.textSecondary} 
          />
          {!isEarned && <MaterialIcons name="lock" size={16} color={Colors.surface} style={styles.lockIcon} />}
        </View>
        
        <View style={styles.textContainer}>
          <Text style={[styles.title, isEarned ? styles.earnedTitle : styles.lockedTitle]}>
            {achievement.title}
          </Text>
          <Text style={[styles.description, isEarned ? styles.earnedDescription : styles.lockedDescription]}>
            {achievement.description}
          </Text>
          
          {isEarned && achievement.earned_date && (
            <Text style={styles.date}>
              Earned: {new Date(achievement.earned_date).toLocaleDateString()}
            </Text>
          )}
        </View>
        
        <View style={styles.pointsContainer}>
          <Text style={styles.points}>{achievement.points}</Text>
          <MaterialIcons name="emoji-events" size={16} color={Colors.warning} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  earnedContainer: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)', // Light green
    borderWidth: 1,
    borderColor: Colors.success,
  },
  lockedContainer: {
    backgroundColor: 'rgba(107, 114, 128, 0.1)', // Light gray
    borderWidth: 1,
    borderColor: Colors.textSecondary,
  },
  badgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  earnedIcon: {
    backgroundColor: Colors.success,
  },
  lockedIcon: {
    backgroundColor: Colors.textSecondary,
  },
  lockIcon: {
    position: 'absolute',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  earnedTitle: {
    color: Colors.textPrimary,
  },
  lockedTitle: {
    color: Colors.textSecondary,
  },
  description: {
    fontSize: 12,
    marginBottom: 4,
  },
  earnedDescription: {
    color: Colors.textPrimary,
  },
  lockedDescription: {
    color: Colors.textSecondary,
  },
  date: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  pointsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  points: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.warning,
  },
});

export default AchievementBadge;