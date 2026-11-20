import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SugarStatus } from '../types';
import { Colors } from '../constants/colors';

interface SugarProgressBarProps {
  currentSugar: number;
  dailyLimit: number;
  status: SugarStatus;
}

export const SugarProgressBar: React.FC<SugarProgressBarProps> = ({
  currentSugar,
  dailyLimit,
  status,
}) => {
  const percentage = Math.min(100, Math.max(0, (currentSugar / dailyLimit) * 100));

  const getBarColor = () => {
    switch (status) {
      case 'low':
        return Colors.statusLow.badge;
      case 'high':
        return Colors.statusHigh.badge;
      case 'optimal':
      default:
        return Colors.primaryMintDark;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelsRow}>
        <Text style={styles.valueText}>
          <Text style={styles.boldValue}>{currentSugar.toFixed(1)}g</Text>
          <Text style={styles.subValue}> / {dailyLimit}g</Text>
        </Text>
        <Text style={styles.percentageText}>{percentage.toFixed(0)}%</Text>
      </View>

      {/* Progress Track */}
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {
              width: `${percentage}%`,
              backgroundColor: getBarColor(),
            },
          ]}
        />
      </View>

      {/* Mini Helper Labels */}
      <View style={styles.bottomRow}>
        <Text style={styles.bottomNote}>0g</Text>
        <Text style={styles.bottomNote}>Batas: {dailyLimit}g/hari</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 6,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  valueText: {
    fontSize: 15,
    color: Colors.textPrimary,
  },
  boldValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  track: {
    height: 14,
    backgroundColor: '#F0E6D8',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  fill: {
    height: '100%',
    borderRadius: 10,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  bottomNote: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
});
