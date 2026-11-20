import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../constants/colors';
import { dateFromKey, shiftDate, formatDate, toDateKey } from '../utils/dateUtils';

interface WeekStripProps {
  activeDate: string; // YYYY-MM-DD
  virtualDate: string; // Real-time today date
  onSelectDate: (dateStr: string) => void;
  onOpenCalendar?: () => void;
}

export const WeekStrip: React.FC<WeekStripProps> = ({
  activeDate,
  virtualDate,
  onSelectDate,
  onOpenCalendar,
}) => {
  // 7 dates centered around virtualDate (index - 3 to + 3) as in Figma
  const dates = Array.from({ length: 7 }, (_, index) => shiftDate(virtualDate, index - 3));

  const parsedActive = dateFromKey(activeDate);
  const monthYearLabel = formatDate(parsedActive, { month: 'long', year: 'numeric' });

  return (
    <View style={styles.container}>
      {/* Top row */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.catatanLabel}>CATATAN HARIAN</Text>
          <Text style={styles.monthTitle}>{monthYearLabel}</Text>
        </View>

        <TouchableOpacity
          style={[styles.calendarIconBtn, Shadows.soft]}
          activeOpacity={0.7}
          onPress={onOpenCalendar}
        >
          <Ionicons name="calendar-outline" size={20} color="#5B504B" />
        </TouchableOpacity>
      </View>

      {/* 7 Days Row */}
      <View style={styles.daysGrid}>
        {dates.map((date) => {
          const parsed = dateFromKey(date);
          const isActive = date === activeDate;
          const isToday = date === virtualDate;
          const dayName = new Intl.DateTimeFormat('id-ID', { weekday: 'short' })
            .format(parsed)
            .slice(0, 2);

          return (
            <TouchableOpacity
              key={date}
              style={[
                styles.dayButton,
                isActive && styles.dayButtonActive,
              ]}
              activeOpacity={0.8}
              onPress={() => onSelectDate(date)}
            >
              <Text
                style={[
                  styles.dayNameText,
                  isActive ? styles.dayNameActive : styles.dayNameInactive,
                ]}
              >
                {dayName}
              </Text>
              <Text
                style={[
                  styles.dateNumText,
                  isActive ? styles.dateNumActive : styles.dateNumInactive,
                ]}
              >
                {parsed.getDate()}
              </Text>
              <View
                style={[
                  styles.todayIndicatorDot,
                  { backgroundColor: isToday ? '#FF8F87' : 'transparent' },
                ]}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF6EE', // Warm peach from Figma
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  catatanLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B1806A',
    letterSpacing: 1.5,
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#403936',
    marginTop: 2,
  },
  calendarIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 18,
    marginHorizontal: 2,
    gap: 4,
  },
  dayButtonActive: {
    backgroundColor: '#403936',
    ...Shadows.soft,
  },
  dayNameText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  dayNameActive: {
    color: '#CFF4E8',
  },
  dayNameInactive: {
    color: '#AA9B94',
  },
  dateNumText: {
    fontSize: 16,
    fontWeight: '800',
  },
  dateNumActive: {
    color: '#FFFFFF',
  },
  dateNumInactive: {
    color: '#786B65',
  },
  todayIndicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
});
