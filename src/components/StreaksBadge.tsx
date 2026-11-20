import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../constants/colors';

interface StreaksBadgeProps {
  streak: number;
}

export const StreaksBadge: React.FC<StreaksBadgeProps> = ({ streak }) => {
  return (
    <View style={[styles.container, Shadows.soft]}>
      <View style={styles.iconCircle}>
        <Ionicons name="flame" size={17} color="#FF6B4A" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.countText}>{streak}</Text>
        <Text style={styles.labelText}>Hari</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#FFE0D6',
    borderWidth: 1.5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFF2EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  countText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#D94822',
  },
  labelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9E3B1E',
  },
});
