import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Image,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../constants/colors';
import { FoodLog, UserProfile } from '../types';
import { formatDate } from '../utils/dateUtils';
import { getSugarStatus } from '../utils/sugarCalculator';
import { Mascot } from '../components/Mascot';
import { WeekStrip } from '../components/WeekStrip';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { MimoChatModal } from '../components/MimoChatModal';
import { WaterTrackerCard } from '../components/WaterTrackerCard';
import { MythFactChallengeCard } from '../components/MythFactChallengeCard';
import { FoodDetailModal } from '../components/FoodDetailModal';

interface HomeScreenProps {
  profile: UserProfile;
  todayLogs: FoodLog[];
  activeDate: string;
  virtualDate: string;
  onSelectDate: (dateStr: string) => void;
  onOpenAddModal: () => void;
  onDeleteLog: (id: string) => void;
  onRefresh: () => void;
  onGoToSettings: () => void;
  onOpenCalendar: () => void;
  onQuickLogWater?: () => void;
  onQuickRemoveWater?: () => void;
  isRefreshing?: boolean;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  profile,
  todayLogs,
  activeDate,
  virtualDate,
  onSelectDate,
  onOpenAddModal,
  onDeleteLog,
  onRefresh,
  onGoToSettings,
  onOpenCalendar,
  onQuickLogWater,
  onQuickRemoveWater,
  isRefreshing = false,
}) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedDetailItem, setSelectedDetailItem] = useState<FoodLog | null>(null);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [visibleCount, setVisibleCount] = useState<number>(5);

  useEffect(() => {
    setVisibleCount(5);
    setSearchQuery('');
  }, [activeDate]);

  const waterLogs = todayLogs.filter(
    (log) =>
      log.sugarGrams === 0 &&
      (log.name.toLowerCase().includes('air') || log.notes?.toLowerCase().includes('hidrasi'))
  );
  const waterCount = waterLogs.length;

  const filteredTodayLogs = todayLogs.filter((entry) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      entry.name.toLowerCase().includes(q) ||
      (entry.category && entry.category.toLowerCase().includes(q)) ||
      (entry.notes && entry.notes.toLowerCase().includes(q))
    );
  });

  const displayedLogs = filteredTodayLogs.slice(0, visibleCount);
  const hasMore = visibleCount < filteredTodayLogs.length;
  const remainingCount = filteredTodayLogs.length - visibleCount;

  const limit = profile.dailySugarLimit || 50;
  const totalSugar = todayLogs.reduce((acc, curr) => acc + curr.sugarGrams * curr.portion, 0);
  const statusKey = getSugarStatus(totalSugar, limit);
  const userGreetingName =
    profile.nickname?.trim() ||
    (profile.name?.trim() ? profile.name.trim().split(' ')[0] : 'Teman Manis');

  // Status mapping matching Figma GulaMate
  const getStatusDetails = () => {
    if (totalSugar < 10) {
      return {
        title: 'Belum Cukup',
        fullTitle: 'Tidak Cukup Gula',
        message: 'Tubuhmu butuh energi. Yuk, makan teratur hari ini.',
        color: '#FFF3B0',
        accent: '#8B6811',
        barColor: '#D4A72C',
      };
    }
    if (totalSugar <= limit) {
      return {
        title: 'Gula Cukup',
        fullTitle: 'Gula Cukup',
        message: 'Hebat! Asupanmu masih dalam batas yang pas.',
        color: '#B8F2E6',
        accent: '#176E60',
        barColor: '#188F7B',
      };
    }
    return {
      title: 'Gula Berlebih',
      fullTitle: 'Gula Berlebih',
      message: 'Tidak apa-apa. Minum air putih dan pilih yang segar, ya.',
      color: '#FFAAA5',
      accent: '#9A2A27',
      barColor: '#D95E5A',
    };
  };

  const status = getStatusDetails();
  const progress = Math.min((totalSugar / limit) * 100, 100);
  const isToday = activeDate === virtualDate;

  const confirmDelete = () => {
    if (deleteId) {
      onDeleteLog(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Calendar Week Strip from Figma */}
        <WeekStrip
          activeDate={activeDate}
          virtualDate={virtualDate}
          onSelectDate={onSelectDate}
          onOpenCalendar={onOpenCalendar}
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="#403936"
            />
          }
        >
          {/* Header Row: Greeting + Avatar + Flame Streak + Settings Gear */}
          <View style={styles.headerBar}>
            <TouchableOpacity
              style={styles.greetingLeft}
              activeOpacity={0.8}
              onPress={onGoToSettings}
            >
              <View style={styles.headerAvatarCircle}>
                {profile.avatarUri ? (
                  <Image source={{ uri: profile.avatarUri }} style={styles.headerAvatarImg} />
                ) : (
                  <Text style={styles.headerAvatarText}>
                    {(profile.name?.[0] || 'M').toUpperCase()}
                  </Text>
                )}
              </View>
              <View>
                <Text style={styles.greetingSub}>{isToday ? 'Halo' : 'Catatan untuk'}</Text>
                <Text style={styles.greetingName}>
                  {isToday ? `${userGreetingName}!` : formatDate(activeDate)}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.headerRight}>
              {/* Flame Streak Badge */}
              <View style={styles.streakBadge}>
                <Ionicons name="flame" size={17} color="#8B6811" />
                <Text style={styles.streakText}>{profile.currentStreak || 1} hari</Text>
              </View>

              {/* Settings Gear Icon Button */}
              <TouchableOpacity
                style={styles.settingsBtn}
                activeOpacity={0.8}
                onPress={onGoToSettings}
              >
                <Ionicons name="settings-outline" size={20} color="#403936" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Hero Sugar Status Card (Figma 30px rounded card) */}
          <View style={[styles.heroCard, { backgroundColor: status.color }]}>
            <View style={styles.heroBubbleCircle} />
            <View style={styles.heroContentRow}>
              <View style={styles.heroTextCol}>
                {/* Status tag */}
                <View style={styles.statusPill}>
                  <Text style={[styles.statusPillText, { color: status.accent }]}>
                    {status.fullTitle}
                  </Text>
                </View>

                {/* Gram number / limit */}
                <View style={styles.sugarNumRow}>
                  <Text style={styles.totalSugarNum}>{totalSugar.toFixed(0)}</Text>
                  <Text style={styles.limitUnitText}>/ {limit} gram</Text>
                </View>

                {/* Friendly message */}
                <Text style={styles.statusMessageText}>{status.message}</Text>
              </View>

              {/* Animated Mascot Mimo with Tap-to-Chat Feature */}
              <TouchableOpacity
                style={styles.mascotWrapper}
                activeOpacity={0.85}
                onPress={() => setIsChatOpen(true)}
              >
                <View style={styles.chatPromptPill}>
                  <Ionicons name="chatbubble-ellipses" size={11} color="#176E60" />
                  <Text style={styles.chatPromptPillText}>Tanya Mimo</Text>
                </View>
                <Mascot status={statusKey} size={115} compact />
              </TouchableOpacity>
            </View>

            {/* Progress bar inside hero card */}
            <View style={styles.progressSection}>
              <View style={styles.progressLabelRow}>
                <Text style={styles.progressLabel}>Asupan gula</Text>
                <Text style={styles.progressPercentage}>{Math.round(progress)}%</Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progress}%`,
                      backgroundColor: status.barColor,
                    },
                  ]}
                />
              </View>
            </View>
          </View>

          {/* Interactive Feature 1: Target Hidrasi Air Putih */}
          <WaterTrackerCard
            todaySugar={totalSugar}
            currentGlasses={waterCount}
            onLogWater={onQuickLogWater}
            onRemoveWater={onQuickRemoveWater}
          />

          {/* Asupan Hari Ini Section */}
          <View style={styles.entriesSection}>
            <View style={styles.entriesHeaderRow}>
              <View>
                <Text style={styles.entriesTitle}>Asupan hari ini</Text>
                <Text style={styles.entriesSubtitle}>
                  {searchQuery.trim()
                    ? `Ditemukan ${filteredTodayLogs.length} dari ${todayLogs.length} catatan`
                    : `${todayLogs.length} makanan dan minuman tercatat`}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.addMiniBtn}
                activeOpacity={0.8}
                onPress={onOpenAddModal}
              >
                <Text style={styles.addMiniBtnText}>+ Tambah</Text>
              </TouchableOpacity>
            </View>

            {/* Search Bar on Asupan Hari Ini */}
            {todayLogs.length > 0 && (
              <View style={styles.searchBarContainer}>
                <Ionicons name="search-outline" size={17} color="#8D7E77" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Cari di asupan hari ini..."
                  placeholderTextColor="#A2958E"
                  value={searchQuery}
                  onChangeText={(text) => {
                    setSearchQuery(text);
                    setVisibleCount(5);
                  }}
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    style={styles.searchClearBtn}
                    onPress={() => {
                      setSearchQuery('');
                      setVisibleCount(5);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close-circle" size={18} color="#B4A7A0" />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {todayLogs.length === 0 ? (
              <TouchableOpacity
                style={styles.emptyDashedCard}
                activeOpacity={0.8}
                onPress={onOpenAddModal}
              >
                <View style={styles.emptyPlusCircle}>
                  <Ionicons name="add" size={24} color="#188F7B" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.emptyCardTitle}>Belum ada catatan</Text>
                  <Text style={styles.emptyCardSub}>
                    Ketuk untuk menambahkan asupan pertamamu.
                  </Text>
                </View>
              </TouchableOpacity>
            ) : filteredTodayLogs.length === 0 ? (
              <View style={styles.noSearchResultCard}>
                <Ionicons name="search-outline" size={30} color="#C4B7AF" />
                <Text style={styles.noSearchResultTitle}>Tidak ditemukan</Text>
                <Text style={styles.noSearchResultSub}>
                  Tidak ada catatan asupan yang cocok dengan "{searchQuery}"
                </Text>
                <TouchableOpacity
                  style={styles.resetSearchBtn}
                  onPress={() => setSearchQuery('')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.resetSearchBtnText}>Reset Pencarian</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.entriesList}>
                  {displayedLogs.map((entry, index) => (
                    <TouchableOpacity
                      key={entry.id}
                      style={[styles.entryCard, Shadows.soft]}
                      activeOpacity={0.75}
                      onPress={() => setSelectedDetailItem(entry)}
                    >
                      <View
                        style={[
                          styles.entryAvatarCircle,
                          {
                            backgroundColor:
                              entry.sugarGrams === 0
                                ? '#E9FAF4'
                                : index % 2 === 0
                                ? '#FFF0E5'
                                : '#E8F8F2',
                          },
                        ]}
                      >
                        {entry.sugarGrams === 0 ? (
                          <Ionicons name="water-outline" size={20} color="#187764" />
                        ) : (
                          <Text
                            style={[
                              styles.entryInitialsText,
                              {
                                color: index % 2 === 0 ? '#A65C42' : '#187764',
                              },
                            ]}
                          >
                            {entry.name.slice(0, 2).toUpperCase()}
                          </Text>
                        )}
                      </View>

                      <View style={styles.entryDetails}>
                        <Text style={styles.entryName} numberOfLines={1}>
                          {entry.name}
                        </Text>
                        <Text style={styles.entrySugarSub}>
                          {(entry.sugarGrams * entry.portion).toFixed(1)} gram gula
                          {entry.portion !== 1 ? ` • ${entry.portion}x porsi` : ''}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={styles.trashBtn}
                        activeOpacity={0.7}
                        onPress={(e) => {
                          e.stopPropagation?.();
                          setDeleteId(entry.id);
                        }}
                      >
                        <Ionicons name="trash-outline" size={17} color="#B4A7A0" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Pagination Controls / Load More */}
                <View style={styles.paginationContainer}>
                  {hasMore && (
                    <TouchableOpacity
                      style={[styles.loadMoreBtn, Shadows.soft]}
                      activeOpacity={0.8}
                      onPress={() => setVisibleCount((prev) => prev + 5)}
                    >
                      <Text style={styles.loadMoreBtnText}>
                        Muat Lebih Banyak ({remainingCount} lagi)
                      </Text>
                      <Ionicons name="chevron-down" size={16} color="#188F7B" />
                    </TouchableOpacity>
                  )}

                  {!hasMore && filteredTodayLogs.length > 5 && (
                    <View style={styles.paginationEndInfo}>
                      <Text style={styles.paginationEndText}>
                        Menampilkan semua {filteredTodayLogs.length} asupan hari ini
                      </Text>
                      <TouchableOpacity
                        style={styles.collapseMiniBtn}
                        onPress={() => setVisibleCount(5)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="chevron-up" size={14} color="#8D7E77" />
                        <Text style={styles.collapseMiniText}>Ciutkan</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </>
            )}
          </View>

          {/* Interactive Feature 2: Tantangan Edukasi Mitos vs Fakta Harian */}
          <MythFactChallengeCard />
        </ScrollView>

        {/* Food Detail Modal (Syarat 4: Klik Item List -> Halaman Detail) */}
        <FoodDetailModal
          visible={selectedDetailItem !== null}
          item={selectedDetailItem}
          dailySugarLimit={limit}
          onClose={() => setSelectedDetailItem(null)}
          onDelete={(id) => {
            setSelectedDetailItem(null);
            setDeleteId(id);
          }}
        />

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          visible={deleteId !== null}
          title="Hapus Catatan Ini?"
          message="Catatan makanan ini akan dihapus dari riwayat harianmu."
          confirmLabel="Hapus"
          cancelLabel="Batal"
          isDestructive
          onConfirm={confirmDelete}
          onCancel={() => setDeleteId(null)}
        />

        {/* Interactive Feature 3: Ngobrol Bareng Mimo (AI Mascot Companion) */}
        <MimoChatModal
          visible={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          userName={userGreetingName}
          todaySugar={totalSugar}
          sugarLimit={limit}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 40,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  greetingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 18,
    backgroundColor: '#B8F2E6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...Shadows.soft,
  },
  headerAvatarImg: {
    width: '100%',
    height: '100%',
  },
  headerAvatarEmoji: {
    fontSize: 22,
  },
  headerAvatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#176E60',
  },
  greetingSub: {
    fontSize: 13,
    color: '#8D7E77',
    fontWeight: '500',
  },
  greetingName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#403936',
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFF3B0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#8B6811',
  },
  settingsBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(83, 65, 56, 0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  heroCard: {
    borderRadius: 30,
    padding: 22,
    marginHorizontal: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  heroBubbleCircle: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  heroContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroTextCol: {
    flex: 1,
    paddingRight: 10,
  },
  statusPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginBottom: 10,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  sugarNumRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 6,
  },
  totalSugarNum: {
    fontSize: 38,
    fontWeight: '900',
    color: '#403936',
    lineHeight: 42,
  },
  limitUnitText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#403936',
  },
  statusMessageText: {
    fontSize: 12,
    color: '#403936',
    lineHeight: 18,
    opacity: 0.85,
    maxWidth: 180,
  },
  mascotWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  chatPromptPill: {
    position: 'absolute',
    top: -12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    zIndex: 10,
    shadowColor: 'rgba(83, 65, 56, 0.15)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
  chatPromptPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#176E60',
  },
  progressSection: {
    marginTop: 18,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#403936',
  },
  progressPercentage: {
    fontSize: 11,
    fontWeight: '800',
    color: '#403936',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  entriesSection: {
    marginTop: 18,
    marginHorizontal: 20,
  },
  entriesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  entriesTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#403936',
  },
  entriesSubtitle: {
    fontSize: 12,
    color: '#8D7E77',
    marginTop: 2,
  },
  addMiniBtn: {
    backgroundColor: '#E9FAF4',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
  },
  addMiniBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#188F7B',
  },
  emptyDashedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFFDF7',
    borderWidth: 2,
    borderColor: '#EFE7DF',
    borderStyle: 'dashed',
    borderRadius: 22,
    padding: 18,
  },
  emptyPlusCircle: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#E9FAF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#403936',
  },
  emptyCardSub: {
    fontSize: 12,
    color: '#8D7E77',
    marginTop: 2,
  },
  entriesList: {
    gap: 10,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 12,
    gap: 12,
  },
  entryAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryInitialsText: {
    fontSize: 13,
    fontWeight: '800',
  },
  entryDetails: {
    flex: 1,
  },
  entryName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#403936',
  },
  entrySugarSub: {
    fontSize: 12,
    color: '#8D7E77',
    marginTop: 2,
  },
  trashBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 7,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#403936',
    paddingVertical: 0,
  },
  searchClearBtn: {
    padding: 2,
    marginLeft: 6,
  },
  noSearchResultCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: '#EFE7DF',
  },
  noSearchResultTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#403936',
    marginTop: 8,
  },
  noSearchResultSub: {
    fontSize: 12,
    color: '#8D7E77',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  resetSearchBtn: {
    backgroundColor: '#F3ECE7',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
  },
  resetSearchBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#534741',
  },
  paginationContainer: {
    marginTop: 12,
    width: '100%',
  },
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EAF8F4',
    borderWidth: 1.5,
    borderColor: '#B8EDDF',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: '100%',
  },
  loadMoreBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#188F7B',
  },
  paginationEndInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  paginationEndText: {
    fontSize: 12,
    color: '#9C8F89',
    fontWeight: '600',
  },
  collapseMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  collapseMiniText: {
    fontSize: 12,
    color: '#8D7E77',
    fontWeight: '700',
  },
});
