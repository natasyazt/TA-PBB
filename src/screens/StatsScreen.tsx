import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../constants/colors';
import { FoodLog, UserProfile } from '../types';
import { shiftDate, dateFromKey, getStatus } from '../utils/dateUtils';

interface StatsScreenProps {
  profile: UserProfile;
  allLogs: FoodLog[];
  activeDate: string;
  onSelectDay?: (date: string) => void;
}

export const StatsScreen: React.FC<StatsScreenProps> = ({
  profile,
  allLogs,
  activeDate,
  onSelectDay,
}) => {
  const limit = profile.dailySugarLimit || 50;

  // 7 days ending at activeDate
  const days = Array.from({ length: 7 }, (_, index) =>
    shiftDate(activeDate || new Date().toISOString().slice(0, 10), index - 6)
  ).map((date) => {
    const total = allLogs
      .filter((entry) => entry.date === date)
      .reduce((sum, entry) => sum + entry.sugarGrams * (entry.portion || 1), 0);
    return { date, total };
  });

  const totalSugar7Days = days.reduce((sum, day) => sum + day.total, 0);
  const average = Math.round(totalSugar7Days / 7);
  const safeDays = days.filter((day) => day.total >= 10 && day.total <= limit).length;

  const totalEntriesIn7Days = allLogs.filter((entry) =>
    days.some((day) => day.date === entry.date)
  ).length;

  // Max value for chart scaling
  const maxScale = Math.max(limit * 1.35, 60);

  // Day name formatter in Indonesian (Sen, Sel, Rab, Kam, Jum, Sab, Min)
  const formatDayName = (dateKey: string) => {
    try {
      const d = dateFromKey(dateKey);
      const str = new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(d);
      return str.slice(0, 3);
    } catch {
      return dateKey.slice(-2);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.subtitle}>Perjalananmu</Text>
          <Text style={styles.title}>Riwayat 7 hari</Text>
          <Text style={styles.description}>
            Lihat pola asupanmu, bukan untuk menghakimi—hanya untuk belajar.
          </Text>
        </View>

        {/* 7-Day Chart Card */}
        <View style={[styles.chartCard, Shadows.card]}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.metricCaption}>RATA-RATA</Text>
              <Text style={styles.metricVal}>
                {average} g <Text style={styles.metricUnit}>/ hari</Text>
              </Text>
            </View>

            <View style={styles.safeBadge}>
              <Text style={styles.safeBadgeVal}>{safeDays}/7</Text>
              <Text style={styles.safeBadgeText}>hari seimbang</Text>
            </View>
          </View>

          {/* Chart Graphic */}
          <View style={styles.chartPlot}>
            {/* Dashed limit line */}
            <View
              style={[
                styles.limitLine,
                {
                  bottom: `${Math.min((limit / maxScale) * 100, 85)}%`,
                },
              ]}
            >
              <Text style={styles.limitLabel}>batas {limit} g</Text>
            </View>

            {/* Bars */}
            <View style={styles.barsContainer}>
              {days.map((day) => {
                const heightPercent =
                  day.total === 0
                    ? 6
                    : Math.max(14, Math.min((day.total / maxScale) * 100, 95));
                const status = getStatus(day.total, limit);
                const isSelected = day.date === activeDate;

                return (
                  <TouchableOpacity
                    key={day.date}
                    style={styles.barColumn}
                    activeOpacity={0.7}
                    onPress={() => onSelectDay && onSelectDay(day.date)}
                  >
                    <Text
                      style={[
                        styles.barValueText,
                        isSelected && styles.barValueSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {day.total > 0 ? `${Math.round(day.total)}g` : ''}
                    </Text>

                    <View style={styles.barPillTrack}>
                      <View
                        style={[
                          styles.barPill,
                          {
                            height: `${heightPercent}%`,
                            backgroundColor: status.color,
                          },
                          isSelected && styles.barPillSelected,
                        ]}
                      />
                    </View>

                    <Text
                      style={[
                        styles.dayLabel,
                        isSelected && styles.dayLabelSelected,
                      ]}
                    >
                      {formatDayName(day.date)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FFF3B0' }]} />
              <Text style={styles.legendText}>Belum cukup</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#B8F2E6' }]} />
              <Text style={styles.legendText}>Cukup</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FFAAA5' }]} />
              <Text style={styles.legendText}>Berlebih</Text>
            </View>
          </View>
        </View>

        {/* 2 Bottom Metric Summary Cards */}
        <View style={styles.summaryRow}>
          {/* Total entries card */}
          <View style={[styles.summaryCard, { backgroundColor: '#FFF0E5' }]}>
            <View style={[styles.summaryIconBox, { backgroundColor: 'rgba(255,255,255,0.7)' }]}>
              <Ionicons name="sparkles" size={18} color="#A65C42" />
            </View>
            <Text style={styles.summaryBigNum}>{totalEntriesIn7Days}</Text>
            <Text style={[styles.summaryLabel, { color: '#A07160' }]}>total catatan</Text>
          </View>

          {/* Safe headroom card */}
          <View style={[styles.summaryCard, { backgroundColor: '#E9FAF4' }]}>
            <View style={[styles.summaryIconBox, { backgroundColor: 'rgba(255,255,255,0.7)' }]}>
              <Ionicons name="water" size={18} color="#177665" />
            </View>
            <Text style={styles.summaryBigNum}>
              {Math.max(0, limit - average)} g
            </Text>
            <Text style={[styles.summaryLabel, { color: '#579B8F' }]}>ruang rata-rata</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFDF7',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#188F7B',
    marginBottom: 2,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#403936',
  },
  description: {
    fontSize: 13,
    color: '#8B7D76',
    marginTop: 6,
    lineHeight: 18,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 20,
    marginBottom: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  metricCaption: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A0948E',
    letterSpacing: 0.8,
  },
  metricVal: {
    fontSize: 24,
    fontWeight: '800',
    color: '#403936',
    marginTop: 2,
  },
  metricUnit: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9A8D86',
  },
  safeBadge: {
    backgroundColor: '#E9FAF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: 'flex-end',
  },
  safeBadgeVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#177665',
  },
  safeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#579B8F',
  },
  chartPlot: {
    height: 180,
    justifyContent: 'flex-end',
    position: 'relative',
    borderBottomWidth: 2,
    borderBottomColor: '#F0E8E2',
    paddingBottom: 4,
  },
  limitLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: '#E4D9D1',
    borderStyle: 'dashed',
    zIndex: 1,
  },
  limitLabel: {
    position: 'absolute',
    right: 0,
    top: -14,
    fontSize: 9,
    fontWeight: '700',
    color: '#B3A49C',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '100%',
    zIndex: 2,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  barValueText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#756963',
    marginBottom: 4,
    minHeight: 12,
  },
  barValueSelected: {
    color: '#188F7B',
    fontWeight: '800',
  },
  barPillTrack: {
    width: 22,
    height: 125,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barPill: {
    width: '100%',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  barPillSelected: {
    borderWidth: 2,
    borderColor: '#403936',
  },
  dayLabel: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: '700',
    color: '#9A8D86',
  },
  dayLabelSelected: {
    color: '#403936',
    fontWeight: '800',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#766A64',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 24,
    padding: 16,
  },
  summaryIconBox: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  summaryBigNum: {
    fontSize: 24,
    fontWeight: '800',
    color: '#403936',
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
});
