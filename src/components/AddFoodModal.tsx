import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FOOD_CATALOG } from '../constants/foodCatalog';
import { CatalogFoodItem, FoodLog } from '../types';
import { formatDate, getCurrentTimeString } from '../utils/dateUtils';
import { estimateSugarFromAI, SugarEstimateResult } from '../services/aiSugarEstimator';

interface AddFoodModalProps {
  visible: boolean;
  onClose: () => void;
  onAddFood: (item: Omit<FoodLog, 'id' | 'createdAt'>) => void;
  targetDate: string; // YYYY-MM-DD
}

type TabType = 'katalog' | 'ai' | 'manual';

// Food badge abbreviations
const getBadgeText = (name: string): string => {
  const lower = name.toLowerCase();
  if (lower.includes('teh')) return 'TEH';
  if (lower.includes('kopi')) return 'KOPI';
  if (lower.includes('boba')) return 'BOBA';
  if (lower.includes('donat')) return 'DONAT';
  if (lower.includes('nasi')) return 'NASI';
  if (lower.includes('pisang') || lower.includes('apel') || lower.includes('buah')) return 'BUAH';
  if (lower.includes('roti')) return 'ROTI';
  if (lower.includes('air')) return 'AIR';
  if (lower.includes('soda')) return 'SODA';
  if (lower.includes('jus')) return 'JUS';
  if (lower.includes('martabak') || lower.includes('kue') || lower.includes('puding') || lower.includes('cookie')) return 'KUE';
  if (lower.includes('cendol') || lower.includes('doger') || lower.includes('es')) return 'ES';
  if (lower.includes('susu') || lower.includes('yogurt')) return 'SUSU';
  if (lower.includes('cokelat')) return 'COK';
  return name.slice(0, 4).toUpperCase();
};

export const AddFoodModal: React.FC<AddFoodModalProps> = ({
  visible,
  onClose,
  onAddFood,
  targetDate,
}) => {
  const [tab, setTab] = useState<TabType>('katalog');

  // Katalog search
  const [search, setSearch] = useState('');

  // AI Tab State
  const [aiInputText, setAiInputText] = useState('');
  const [isEstimating, setIsEstimating] = useState(false);
  const [aiResult, setAiResult] = useState<SugarEstimateResult | null>(null);

  // Manual Tab State (Murni polos tanpa AI)
  const [pureManualName, setPureManualName] = useState('');
  const [pureManualSugar, setPureManualSugar] = useState('');

  // Animation & Visibility states
  const [modalVisible, setModalVisible] = useState(visible);
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const sheetSlideAnim = useRef(new Animated.Value(450)).current;
  const isClosingRef = useRef(false);

  useEffect(() => {
    if (visible) {
      isClosingRef.current = false;
      setModalVisible(true);
      backdropAnim.setValue(0);
      sheetSlideAnim.setValue(450);
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(sheetSlideAnim, {
          toValue: 0,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    } else if (modalVisible && !isClosingRef.current) {
      isClosingRef.current = true;
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(sheetSlideAnim, {
          toValue: 450,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start(() => {
        setModalVisible(false);
        isClosingRef.current = false;
      });
    }
  }, [visible]);

  const filteredFoods = FOOD_CATALOG.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  // Auto-run AI estimation when typing in AI tab
  useEffect(() => {
    const trimmed = aiInputText.trim();
    if (trimmed.length >= 3) {
      const timer = setTimeout(async () => {
        setIsEstimating(true);
        try {
          const res = await estimateSugarFromAI(trimmed);
          setAiResult(res);
        } catch {
          // ignore
        } finally {
          setIsEstimating(false);
        }
      }, 350);

      return () => clearTimeout(timer);
    } else {
      setAiResult(null);
    }
  }, [aiInputText]);

  const handleSelectCatalog = (item: CatalogFoodItem) => {
    onAddFood({
      date: targetDate,
      name: item.name,
      sugarGrams: item.sugarGrams,
      portion: 1,
      category: item.category,
      time: getCurrentTimeString(),
    });
    handleClose();
  };

  const handleAddFromAI = () => {
    if (!aiInputText.trim() || !aiResult) return;
    onAddFood({
      date: targetDate,
      name: aiInputText.trim(),
      sugarGrams: aiResult.sugarGrams,
      portion: 1,
      category: 'camilan',
      time: getCurrentTimeString(),
      notes: aiResult.servingDesc ? `Estimasi AI: ${aiResult.servingDesc}` : undefined,
    });
    handleClose();
  };

  const handleAddPureManual = () => {
    const amount = parseFloat(pureManualSugar.replace(',', '.'));
    if (!pureManualName.trim() || isNaN(amount) || amount < 0) return;

    onAddFood({
      date: targetDate,
      name: pureManualName.trim(),
      sugarGrams: amount,
      portion: 1,
      category: 'camilan',
      time: getCurrentTimeString(),
    });
    handleClose();
  };

  const handleClose = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(sheetSlideAnim, {
        toValue: 450,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start(() => {
      setModalVisible(false);
      isClosingRef.current = false;
      onClose();
      setSearch('');
      setAiInputText('');
      setAiResult(null);
      setPureManualName('');
      setPureManualSugar('');
      setTab('katalog');
    });
  };

  const formattedDate = targetDate
    ? formatDate(targetDate, { day: 'numeric', month: 'long' })
    : 'Hari ini';

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.modalRoot}>
        {/* Fullscreen Backdrop Overlay with Smooth Fade */}
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View
            style={[
              styles.backdropOverlay,
              { opacity: backdropAnim },
            ]}
          />
        </TouchableWithoutFeedback>

        {/* Animated Bottom Sheet with Smooth Slide-Up */}
        <Animated.View
          style={[
            styles.sheetContainer,
            {
              transform: [{ translateY: sheetSlideAnim }],
            },
          ]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardContainer}
          >
            {/* Handle bar */}
            <View style={styles.handleBar} />

            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.dateSubtitle}>{formattedDate}</Text>
                <Text style={styles.sheetTitle}>Tambah asupan</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} activeOpacity={0.7} onPress={handleClose}>
                <Ionicons name="close" size={20} color="#766A64" />
              </TouchableOpacity>
            </View>

              {/* 3 Segmented Control Tabs */}
              <View style={styles.tabBar}>
                <TouchableOpacity
                  style={[styles.tabButton, tab === 'katalog' && styles.tabButtonActive]}
                  activeOpacity={0.8}
                  onPress={() => setTab('katalog')}
                >
                  <Text style={[styles.tabButtonText, tab === 'katalog' && styles.tabButtonTextActive]}>
                    Katalog
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabButton, tab === 'ai' && styles.tabButtonActive]}
                  activeOpacity={0.8}
                  onPress={() => setTab('ai')}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="sparkles" size={13} color={tab === 'ai' ? '#188F7B' : '#92847D'} />
                    <Text style={[styles.tabButtonText, tab === 'ai' && styles.tabButtonTextActive]}>
                      Tanya AI
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabButton, tab === 'manual' && styles.tabButtonActive]}
                  activeOpacity={0.8}
                  onPress={() => setTab('manual')}
                >
                  <Text style={[styles.tabButtonText, tab === 'manual' && styles.tabButtonTextActive]}>
                    Mandiri
                  </Text>
                </TouchableOpacity>
              </View>

              {/* TAB 1: KATALOG POPULER */}
              {tab === 'katalog' && (
                <View style={styles.tabContentContainer}>
                  <View style={styles.searchBar}>
                    <Ionicons name="search" size={18} color="#9B8F89" />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Cari makanan atau minuman..."
                      placeholderTextColor="#9B8F89"
                      value={search}
                      onChangeText={setSearch}
                      autoCapitalize="none"
                    />
                    {search ? (
                      <TouchableOpacity onPress={() => setSearch('')}>
                        <Ionicons name="close-circle" size={18} color="#9B8F89" />
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  <ScrollView
                    style={styles.foodList}
                    contentContainerStyle={styles.foodListContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                  >
                    {filteredFoods.map((item, index) => {
                      const badgeIndex = index % 3;
                      const badgeBg =
                        badgeIndex === 0 ? '#FFF0E5' : badgeIndex === 1 ? '#E8F8F2' : '#FFF7CD';
                      const badgeColor =
                        badgeIndex === 0 ? '#A65C42' : badgeIndex === 1 ? '#177665' : '#8B6811';

                      return (
                        <TouchableOpacity
                          key={item.id || item.name}
                          style={styles.foodCard}
                          activeOpacity={0.7}
                          onPress={() => handleSelectCatalog(item)}
                        >
                          <View style={[styles.badgeIconBox, { backgroundColor: badgeBg }]}>
                            <Text style={[styles.badgeText, { color: badgeColor }]}>
                              {getBadgeText(item.name)}
                            </Text>
                          </View>

                          <View style={styles.foodInfo}>
                            <Text style={styles.foodName} numberOfLines={1}>
                              {item.name}
                            </Text>
                            <Text style={styles.foodSugar}>{item.sugarGrams} gram gula</Text>
                          </View>

                          <View style={styles.plusBtn}>
                            <Ionicons name="add" size={18} color="#188F7B" />
                          </View>
                        </TouchableOpacity>
                      );
                    })}

                    {filteredFoods.length === 0 && (
                      <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Belum ada makanan yang cocok.</Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              )}

              {/* TAB 2: TANYA AI NUTRISI */}
              {tab === 'ai' && (
                <ScrollView
                  style={styles.tabContentContainer}
                  contentContainerStyle={styles.manualContentContainer}
                  keyboardShouldPersistTaps="handled"
                >
                  <View style={styles.aiBanner}>
                    <View style={styles.aiBadgeIcon}>
                      <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.aiBannerTitle}>Estimasi Gula Otomatis Cerdas</Text>
                      <Text style={styles.aiBannerDesc}>
                        Ketik nama menu apa saja (misal: "Kue klepon 3 butir" atau "Kopi susu gula aren less sugar"). AI akan menghitung takaran gulanya.
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.fieldLabel}>Nama makanan atau minuman</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Contoh: 1 piring martabak manis keju"
                    placeholderTextColor="#A0948E"
                    value={aiInputText}
                    onChangeText={setAiInputText}
                  />

                  {/* AI Result Card */}
                  {isEstimating ? (
                    <View style={styles.loadingAiBox}>
                      <ActivityIndicator size="small" color="#188F7B" />
                      <Text style={styles.loadingAiText}>Mimo AI sedang menganalisis kandungan gula...</Text>
                    </View>
                  ) : aiResult && aiInputText.trim().length >= 3 ? (
                    <View style={styles.aiSuccessCard}>
                      <View style={styles.aiSuccessTop}>
                        <Text style={styles.aiResultSugarVal}>
                          ~{aiResult.sugarGrams}{' '}
                          <Text style={{ fontSize: 14, fontWeight: '700' }}>gram gula</Text>
                        </Text>
                        <View style={styles.servingPill}>
                          <Text style={styles.servingPillText}>{aiResult.servingDesc || '1 porsi'}</Text>
                        </View>
                      </View>

                      <Text style={styles.aiExplanationText}>{aiResult.explanation}</Text>

                      <TouchableOpacity
                        style={styles.submitBtn}
                        activeOpacity={0.8}
                        onPress={handleAddFromAI}
                      >
                        <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                        <Text style={styles.submitBtnText}>Simpan Catatan dari AI</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.aiEmptyHint}>
                      <Ionicons name="bulb-outline" size={24} color="#A89B94" />
                      <Text style={styles.aiEmptyHintText}>
                        Mulai ketik nama makanan di atas untuk melihat estimasi kandungan gula otomatis.
                      </Text>
                    </View>
                  )}
                </ScrollView>
              )}

              {/* TAB 3: INPUT MANDIRI (MURNI MANUAL TANPA AI) */}
              {tab === 'manual' && (
                <ScrollView
                  style={styles.tabContentContainer}
                  contentContainerStyle={styles.manualContentContainer}
                  keyboardShouldPersistTaps="handled"
                >
                  <Text style={styles.fieldLabel}>Nama makanan atau minuman</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Contoh: Roti gandum selai srikaya"
                    placeholderTextColor="#A0948E"
                    value={pureManualName}
                    onChangeText={setPureManualName}
                  />

                  <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Jumlah gula murni</Text>
                  <View style={styles.sugarInputWrapper}>
                    <TextInput
                      style={styles.sugarInput}
                      placeholder="0"
                      placeholderTextColor="#A0948E"
                      keyboardType="numeric"
                      value={pureManualSugar}
                      onChangeText={setPureManualSugar}
                    />
                    <Text style={styles.sugarUnit}>gram</Text>
                  </View>

                  <View style={styles.helperTipBox}>
                    <Ionicons name="pricetag-outline" size={18} color="#7B651F" />
                    <Text style={styles.helperTipText}>
                      Input mandiri sangat cocok jika Anda membaca langsung informasi nilai gizi (nutrition facts) pada label kemasan produk.
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.submitBtn,
                      (!pureManualName.trim() || !pureManualSugar.trim()) && styles.submitBtnDisabled,
                    ]}
                    activeOpacity={0.8}
                    disabled={!pureManualName.trim() || !pureManualSugar.trim()}
                    onPress={handleAddPureManual}
                  >
                    <Text style={styles.submitBtnText}>Simpan Catatan Mandiri</Text>
                  </TouchableOpacity>
                </ScrollView>
              )}
            </KeyboardAvoidingView>
          </Animated.View>
        </View>
      </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    zIndex: 99999,
    ...(Platform.OS === 'web'
      ? ({
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'box-none',
        } as any)
      : {}),
  },
  backdropOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(32, 24, 20, 0.48)',
    ...(Platform.OS === 'web'
      ? ({
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          cursor: 'pointer',
        } as any)
      : {}),
  },
  sheetContainer: {
    backgroundColor: '#FFFDF7',
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 24,
    zIndex: 100000,
    width: '100%',
    maxWidth: 580,
    alignSelf: 'center',
  },
  keyboardContainer: {
    width: '100%',
  },
  handleBar: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#DED3CC',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  dateSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#188F7B',
    marginBottom: 2,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#403936',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#EFE8E2',
    borderRadius: 18,
    marginHorizontal: 20,
    padding: 4,
    marginTop: 8,
    marginBottom: 14,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: 'rgba(83, 65, 56, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92847D',
  },
  tabButtonTextActive: {
    color: '#403936',
  },
  tabContentContainer: {
    paddingHorizontal: 20,
    maxHeight: 460,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#403936',
  },
  foodList: {
    maxHeight: 380,
  },
  foodListContent: {
    paddingBottom: 20,
    gap: 10,
  },
  foodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    gap: 12,
  },
  badgeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#403936',
    marginBottom: 2,
  },
  foodSugar: {
    fontSize: 12,
    color: '#92847D',
  },
  plusBtn: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: '#E9FAF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#91837C',
  },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#E9FAF4',
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
  },
  aiBadgeIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#188F7B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#176E60',
  },
  aiBannerDesc: {
    fontSize: 11,
    lineHeight: 16,
    color: '#4A7A71',
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#403936',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#403936',
  },
  loadingAiBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 24,
  },
  loadingAiText: {
    fontSize: 12,
    color: '#188F7B',
    fontWeight: '600',
  },
  aiSuccessCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#A8E6CF',
    borderRadius: 22,
    padding: 16,
    marginTop: 14,
  },
  aiSuccessTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  aiResultSugarVal: {
    fontSize: 24,
    fontWeight: '900',
    color: '#176E60',
  },
  servingPill: {
    backgroundColor: '#E9FAF4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  servingPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#188F7B',
  },
  aiExplanationText: {
    fontSize: 12,
    lineHeight: 17,
    color: '#6D625D',
    marginBottom: 14,
  },
  aiEmptyHint: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    gap: 8,
  },
  aiEmptyHintText: {
    fontSize: 12,
    color: '#A0958F',
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 18,
  },
  manualContentContainer: {
    paddingBottom: 24,
  },
  sugarInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
    borderRadius: 18,
    paddingHorizontal: 14,
  },
  sugarInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '700',
    color: '#403936',
  },
  sugarUnit: {
    fontSize: 13,
    fontWeight: '700',
    color: '#A0958F',
  },
  helperTipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 243, 176, 0.6)',
    borderRadius: 16,
    padding: 12,
    marginTop: 14,
  },
  helperTipText: {
    flex: 1,
    fontSize: 11,
    color: '#7B651F',
    lineHeight: 16,
  },
  submitBtn: {
    backgroundColor: '#403936',
    borderRadius: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
