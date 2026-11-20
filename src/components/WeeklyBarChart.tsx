import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { DaySummary } from '../types';
import { Colors } from '../constants/colors';
import { formatDayShort, formatShortDate } from '../utils/dateUtils';

interface WeeklyBarChartProps {
  days: DaySummary[];
  dailyLimit: number;
  onSelectDate?: (dateStr: string) => void;
  selectedDate?: string;
}

export const WeeklyBarChart: React.FC<WeeklyBarChartProps> = ({
  days,
  dailyLimit,
  onSelectDate,
  selectedDate,
}) => {
  const [activeDate, setActiveDate] = useState<string | null>(selectedDate || null);

  // Maximum value for scale calculation (at least dailyLimit * 1.25)
  const maxSugarRecorded = Math.max(...days.map((d) => d.totalSugar), dailyLimit);
  const chartMax = Math.ceil((maxSugarRecorded * 1.2) / 10) * 10;

  const getBarColor = (item: DaySummary) => {
    if (item.totalSugar === 0) return '#E2D9CD';
    switch (item.status) {
      case 'low':
        return Colors.statusLow.badge;
      case 'high':
        return Colors.statusHigh.badge;
      case 'optimal':
      default:
        return Colors.primaryMintDark;
    }
  };

  const currentActiveItem = days.find((d) => d.date === (activeDate || selectedDate)) || days[days.length - 1];

  return (
    <View style={styles.container}>
      {/* Selected Day Info Pill */}
      {currentActiveItem && (
        <View style={styles.infoPill}>
          <Text style={styles.infoPillDate}>
            📅 {formatShortDate(currentActiveItem.date)}:
          </Text>
          <Text style={styles.infoPillSugar}>
            {currentActiveItem.totalSugar.toFixed(1)}g Gula
          </Text>
          <Text
            style={[
              styles.infoPillStatus,
              {
                color:
                  currentActiveItem.status === 'optimal'
                    ? Colors.statusOptimal.text
                    : currentActiveItem.status === 'high'
                    ? Colors.statusHigh.text
                    : Colors.statusLow.text,
              },
            ]}
          >
            ({currentActiveItem.status === 'optimal'
              ? 'Gula Cukup'
              : currentActiveItem.status === 'high'
              ? 'Berlebih'
              : 'Kurang'})
          </Text>
        </View>
      )}

      {/* Bar Chart Area */}
      <View style={styles.chartWrapper}>
        {/* Daily limit reference line */}
        <View
          style={[
            styles.limitLine,
            { bottom: `${(dailyLimit / chartMax) * 100}%` },
          ]}
        >
          <View style={styles.limitDashed} />
          <Text style={styles.limitLabel}>Batas {dailyLimit}g</Text>
        </View>

        {/* 7 Bars */}
        <View style={styles.barsRow}>
          {days.map((item) => {
            const barHeightPct = Math.min(
              100,
              Math.max(4, (item.totalSugar / chartMax) * 100)
            );
            const isSelected = item.date === (activeDate || selectedDate);

            return (
              <TouchableOpacity
                key={item.date}
                style={styles.barColumn}
                activeOpacity={0.7}
                onPress={() => {
                  setActiveDate(item.date);
                  if (onSelectDate) onSelectDate(item.date);
                }}
              >
                {/* Sugar amount label on top of bar */}
                <Text style={styles.barTopText}>
                  {item.totalSugar > 0 ? `${item.totalSugar.toFixed(0)}` : '0'}
                </Text>

                {/* Bar Pill */}
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: `${barHeightPct}%`,
                        backgroundColor: getBarColor(item),
                      },
                      isSelected && styles.barSelected,
                    ]}
                  />
                </View>

                {/* Day label */}
                <Text
                  style={[
                    styles.dayLabel,
                    isSelected && styles.dayLabelSelected,
                  ]}
                >
                  {formatDayShort(item.date)}
                </Text>

                {/* Date number */}
                <Text style={styles.dateNumLabel}>
                  {formatShortDate(item.date).split(' ')[0]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 8,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F3EC',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 16,
    alignSelf: 'center',
    gap: 6,
  },
  infoPillDate: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  infoPillSugar: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  infoPillStatus: {
    fontSize: 12,
    fontWeight: '700',
  },
  chartWrapper: {
    height: 190,
    position: 'relative',
    justifyContent: 'flex-end',
    paddingBottom: 28,
  },
  limitLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  limitDashed: {
    flex: 1,
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#E87A75',
  },
  limitLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D44C47',
    backgroundColor: '#FFF2F2',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 4,
  },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingHorizontal: 4,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTopText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  barTrack: {
    width: 22,
    height: '100%',
    justifyContent: 'flex-end',
    backgroundColor: '#F6EFE6',
    borderRadius: 12,
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 12,
  },
  barSelected: {
    borderWidth: 2,
    borderColor: '#4A3B32',
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 6,
  },
  dayLabelSelected: {
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  dateNumLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500',
  },
});
