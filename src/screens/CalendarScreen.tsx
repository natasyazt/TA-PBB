import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../constants/colors';
import { FoodLog, SugarStatus, UserProfile } from '../types';
import { formatDate } from '../utils/dateUtils';
import { getSugarStatus, getStatusInfo } from '../utils/sugarCalculator';
import { CalendarView } from '../components/CalendarView';
import { FoodItemCard } from '../components/FoodItemCard';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { FoodDetailModal } from '../components/FoodDetailModal';

interface CalendarScreenProps {
  profile: UserProfile;
  allLogs: FoodLog[];
  activeDate: string;
  onOpenAddModalForDate: (dateStr: string) => void;
  onDeleteLog: (id: string) => void;
}

export const CalendarScreen: React.FC<CalendarScreenProps> = ({
  profile,
  allLogs,
  activeDate,
  onOpenAddModalForDate,
  onDeleteLog,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(activeDate);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedDetailItem, setSelectedDetailItem] = useState<FoodLog | null>(null);

  const dayStatuses: Record<string, { totalSugar: number; status: SugarStatus }> = {};
  allLogs.forEach((log) => {
    const prev = dayStatuses[log.date]?.totalSugar || 0;
    const added = log.sugarGrams * log.portion;
    const newTotal = prev + added;
    dayStatuses[log.date] = {
      totalSugar: newTotal,
      status: getSugarStatus(newTotal, profile.dailySugarLimit),
    };
  });

  const selectedLogs = allLogs.filter((log) => log.date === selectedDate);
  const selectedTotalSugar = selectedLogs.reduce(
    (acc, curr) => acc + curr.sugarGrams * curr.portion,
    0
  );
  const selectedStatus = getSugarStatus(selectedTotalSugar, profile.dailySugarLimit);
  const selectedStatusInfo = getStatusInfo(
    selectedStatus,
    selectedTotalSugar,
    profile.dailySugarLimit
  );

  const getStatusBadgeStyle = () => {
    switch (selectedStatus) {
      case 'low':
        return {
          bg: Colors.statusLow.bg,
          border: Colors.statusLow.border,
          text: Colors.statusLow.darkText,
        };
      case 'high':
        return {
          bg: Colors.statusHigh.bg,
          border: Colors.statusHigh.border,
          text: Colors.statusHigh.darkText,
        };
      case 'optimal':
      default:
        return {
          bg: Colors.statusOptimal.bg,
          border: Colors.statusOptimal.border,
          text: Colors.statusOptimal.darkText,
        };
    }
  };

  const badgeStyle = getStatusBadgeStyle();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.subtitle}>Jelajah Waktu</Text>
            <Text style={styles.title}>Kalender Asupan</Text>
            <Text style={styles.description}>
              Pantau kepatuhan konsumsi harianmu secara visual di setiap tanggal.
            </Text>
          </View>
          {selectedDate !== activeDate && (
            <TouchableOpacity
              style={styles.todayBtn}
              activeOpacity={0.8}
              onPress={() => setSelectedDate(activeDate)}
            >
              <Text style={styles.todayBtnText}>Hari Ini</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Calendar Widget */}
          <View style={[styles.calendarCard, Shadows.card]}>
            <CalendarView
              selectedDate={selectedDate}
              onSelectDate={(date) => setSelectedDate(date)}
              dayStatuses={dayStatuses}
            />
          </View>

          {/* Selected Date Summary Card */}
          <View style={[styles.daySummaryCard, Shadows.card]}>
            <View style={styles.summaryTopRow}>
              <View>
                <Text style={styles.summaryDateLabel}>
                  {formatDate(selectedDate, {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </Text>
                <Text style={styles.summarySugarNum}>
                  Total Gula: <Text style={styles.boldNum}>{selectedTotalSugar.toFixed(1)}g</Text>
                  <Text style={styles.limitSub}> / {profile.dailySugarLimit}g</Text>
                </Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: badgeStyle.bg,
                    borderColor: badgeStyle.border,
                  },
                ]}
              >
                <Text style={[styles.statusBadgeText, { color: badgeStyle.text }]}>
                  {selectedTotalSugar > 0 ? selectedStatusInfo.title : 'Kosong'}
                </Text>
              </View>
            </View>

            <Text style={styles.summaryAdvice}>
              {selectedTotalSugar > 0
                ? selectedStatusInfo.detailedMessage
                : 'Belum ada catatan asupan gula pada tanggal ini.'}
            </Text>
          </View>

          {/* Food List for Selected Date */}
          <View style={styles.logsListSection}>
            <View style={styles.listHeaderRow}>
              <Text style={styles.sectionTitle}>
                Log Makanan ({selectedLogs.length})
              </Text>

              <TouchableOpacity
                style={styles.addBtn}
                activeOpacity={0.8}
                onPress={() => onOpenAddModalForDate(selectedDate)}
              >
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <Text style={styles.addBtnText}>Catat Makanan</Text>
              </TouchableOpacity>
            </View>

            {selectedLogs.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="nutrition-outline" size={28} color="#A0948E" />
                <Text style={styles.emptyText}>
                  Tidak ada makanan yang tercatat pada hari ini.
                </Text>
              </View>
            ) : (
              selectedLogs.map((item) => (
                <FoodItemCard
                  key={item.id}
                  item={item}
                  onPress={(food) => setSelectedDetailItem(food)}
                  onDelete={(id) => setDeleteId(id)}
                />
              ))
            )}
          </View>
        </ScrollView>

        {/* Food Detail Modal (Syarat 4: Item List Dapat Diklik ke Halaman Detail) */}
        <FoodDetailModal
          visible={selectedDetailItem !== null}
          item={selectedDetailItem}
          dailySugarLimit={profile.dailySugarLimit || 50}
          onClose={() => setSelectedDetailItem(null)}
          onDelete={(id) => {
            setSelectedDetailItem(null);
            setDeleteId(id);
          }}
        />

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          visible={deleteId !== null}
          title="Hapus Makanan Ini?"
          message="Catatan gula ini akan dihapus dari log tanggal terpilih."
          confirmLabel="Hapus"
          cancelLabel="Batal"
          isDestructive
          onConfirm={() => {
            if (deleteId) {
              onDeleteLog(deleteId);
              setDeleteId(null);
            }
          }}
          onCancel={() => setDeleteId(null)}
        />
      </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
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
    marginTop: 4,
    lineHeight: 18,
  },
  todayBtn: {
    backgroundColor: '#E9FAF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#A8E6CF',
    marginTop: 6,
  },
  todayBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#188F7B',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 16,
    marginBottom: 16,
  },
  daySummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryDateLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#403936',
    marginBottom: 2,
  },
  summarySugarNum: {
    fontSize: 13,
    color: '#6D625D',
  },
  boldNum: {
    fontSize: 16,
    fontWeight: '800',
    color: '#403936',
  },
  limitSub: {
    fontSize: 12,
    color: '#91837C',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  summaryAdvice: {
    fontSize: 12,
    color: '#6D625D',
    lineHeight: 17,
  },
  logsListSection: {
    marginTop: 10,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#403936',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#403936',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFE7DF',
    gap: 6,
  },
  emptyText: {
    fontSize: 13,
    color: '#8A7B74',
    textAlign: 'center',
  },
});
