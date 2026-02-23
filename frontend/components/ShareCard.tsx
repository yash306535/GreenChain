import React, { FC } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Share from 'react-native-share';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../constants/Colors';

interface ShareCardProps {
  title: string;
  description: string;
  shareContent: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
}

const ShareCard: FC<ShareCardProps> = ({ 
  title, 
  description, 
  shareContent, 
  icon = 'share' 
}) => {
  const handleShare = async () => {
    try {
      const result = await Share.open({
        message: shareContent,
        title: title,
      });
      console.log(result);
    } catch (error) {
      console.log('Sharing failed:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <MaterialIcons name={icon} size={24} color={Colors.primary} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
        <MaterialIcons name="share" size={20} color={Colors.surface} />
        <Text style={styles.shareButtonText}>Share</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  iconContainer: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    padding: 8,
    borderRadius: 8,
    marginRight: 12,
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 12,
  },
  shareButtonText: {
    color: Colors.surface,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default ShareCard;