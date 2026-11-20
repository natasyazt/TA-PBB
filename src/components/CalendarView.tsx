import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../constants/colors';
import { parseDateString, toDateString } from '../utils/dateUtils';
import { SugarStatus } from '../types';

interface CalendarDayData {
  dateStr: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  totalSugar?: number;
  status?: SugarStatus;
}

interface CalendarViewProps {
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  dayStatuses: Record<string, { totalSugar: number; status: SugarStatus }>;
}

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const WEEK_DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export const CalendarView: React.FC<CalendarViewProps> = ({
  selectedDate,
  onSelectDate,
  dayStatuses,
}) => {
  const initialDate = parseDateString(selectedDate);
  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth()); // 0-indexed

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const generateGrid = (): CalendarDayData[] => {
    const grid: CalendarDayData[] = [];
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sunday
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevDate = new Date(viewYear, viewMonth - 1, dayNum);
      const dateStr = toDateString(prevDate);
      grid.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        totalSugar: dayStatuses[dateStr]?.totalSugar,
        status: dayStatuses[dateStr]?.status,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const currDate = new Date(viewYear, viewMonth, i);
      const dateStr = toDateString(currDate);
      grid.push({
        dateStr,
        dayNumber: i,
        isCurrentMonth: true,
        totalSugar: dayStatuses[dateStr]?.totalSugar,
        status: dayStatuses[dateStr]?.status,
      });
    }

    // Next month padding
    const remaining = 35 - grid.length;
    const paddingCount = remaining > 0 ? remaining : 42 - grid.length;
    for (let i = 1; i <= paddingCount; i++) {
      const nextDate = new Date(viewYear, viewMonth + 1, i);
      const dateStr = toDateString(nextDate);
      grid.push({
        dateStr,
        dayNumber: i,
        isCurrentMonth: false,
        totalSugar: dayStatuses[dateStr]?.totalSugar,
        status: dayStatuses[dateStr]?.status,
      });
    }

    return grid;
  };

  const gridDays = generateGrid();

  const getStatusDotColor = (status?: SugarStatus, totalSugar?: number) => {
    if (status === undefined || totalSugar === undefined || totalSugar === 0) {
      return '#E8E1D5';
    }
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
    <View style={[styles.container, Shadows.card]}>
      {/* Month & Year Navigation Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.navButton}
          activeOpacity={0.7}
          onPress={handlePrevMonth}
        >
          <Ionicons name="chevron-back" size={18} color={Colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.monthBadge}>
          <Text style={styles.monthTitle}>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.navButton}
          activeOpacity={0.7}
          onPress={handleNextMonth}
        >
          <Ionicons name="chevron-forward" size={18} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Weekdays Row */}
      <View style={styles.weekRow}>
        {WEEK_DAYS.map((w, idx) => (
          <Text key={idx} style={styles.weekDayText}>
            {w}
          </Text>
        ))}
      </View>

      {/* Days Grid */}
      <View style={styles.daysGrid}>
        {gridDays.map((item) => {
          const isSelected = item.dateStr === selectedDate;
          const hasData = item.totalSugar !== undefined && item.totalSugar > 0;
          const dotColor = getStatusDotColor(item.status, item.totalSugar);

          return (
            <TouchableOpacity
              key={item.dateStr}
              style={[
                styles.dayCell,
                isSelected && styles.selectedCell,
                !item.isCurrentMonth && styles.otherMonthCell,
              ]}
              activeOpacity={0.65}
              onPress={() => onSelectDate(item.dateStr)}
            >
              <Text
                style={[
                  styles.dayNumber,
                  !item.isCurrentMonth && styles.otherMonthDayNumber,
                  isSelected && styles.selectedDayNumber,
                ]}
              >
                {item.dayNumber}
              </Text>

              {/* Status Dot */}
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: dotColor },
                  hasData && styles.activeDot,
                ]}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Flo-style Clean Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.primaryMintDark }]} />
          <Text style={styles.legendText}>Gula Cukup</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.statusLow.badge }]} />
          <Text style={styles.legendText}>Kurang</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.statusHigh.badge }]} />
          <Text style={styles.legendText}>Berlebih</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F6EFE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthBadge: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    backgroundColor: '#FFF2EB',
    borderRadius: 18,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3EDE4',
  },
  weekDayText: {
    width: 36,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  dayCell: {
    width: '14.28%',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    marginVertical: 2,
  },
  selectedCell: {
    backgroundColor: '#FFEBD9',
    borderWidth: 1.5,
    borderColor: '#FFBA8B',
  },
  otherMonthCell: {
    opacity: 0.35,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  otherMonthDayNumber: {
    color: Colors.textMuted,
  },
  selectedDayNumber: {
    color: '#D9531E',
    fontWeight: '800',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F5ECE1',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
