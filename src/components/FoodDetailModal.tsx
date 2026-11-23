import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
  Animated,
  Easing,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { FoodLog } from '../types';
import { Colors, Shadows } from '../constants/colors';

interface FoodDetailModalProps {
  visible: boolean;
  item: FoodLog | null;
  dailySugarLimit: number;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export const FoodDetailModal: React.FC<FoodDetailModalProps> = ({
  visible,
  item,
  dailySugarLimit,
  onClose,
  onDelete,
}) => {
  const [modalVisible, setModalVisible] = useState(visible);
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const sheetSlideAnim = useRef(new Animated.Value(450)).current;
  const isClosingRef = useRef(false);

  useEffect(() => {
    if (visible && item) {
      isClosingRef.current = false;
      setModalVisible(true);
      backdropAnim.setValue(0);
      sheetSlideAnim.setValue(450);
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 250,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(sheetSlideAnim, {
          toValue: 0,
          duration: 270,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    } else if (modalVisible && !isClosingRef.current) {
      isClosingRef.current = true;
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 180,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(sheetSlideAnim, {
          toValue: 450,
          duration: 180,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start(() => {
        setModalVisible(false);
        isClosingRef.current = false;
      });
    }
  }, [visible, item]);

  const handleClose = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(sheetSlideAnim, {
        toValue: 450,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start(() => {
      setModalVisible(false);
      isClosingRef.current = false;
      onClose();
    });
  };

  if (!item && !modalVisible) return null;

  const totalSugar = item ? item.sugarGrams * (item.portion || 1) : 0;
  const teaspoons = (totalSugar / 4.2).toFixed(1); // 1 tsp sugar = ~4.2g
  const percentOfDaily = dailySugarLimit > 0 ? Math.round((totalSugar / dailySugarLimit) * 100) : 0;
  const caloriesFromSugar = Math.round(totalSugar * 4); // 1g sugar = 4 kcal
  const walkMinutes = Math.max(5, Math.round(caloriesFromSugar / 4)); // ~4 kcal burned per min walking

  const getCategoryInfo = (category: string) => {
    switch (category) {
      case 'minuman':
        return { name: 'cup-water' as const, label: 'Minuman Manis', color: '#188F7B', bg: '#E6FAF6' };
      case 'camilan':
        return { name: 'cookie' as const, label: 'Camilan & Kudapan', color: '#DD6B20', bg: '#FEEBC8' };
      case 'buah':
        return { name: 'food-apple' as const, label: 'Buah Alami', color: '#E53E3E', bg: '#FED7D7' };
      case 'makanan':
        return { name: 'bowl-mix' as const, label: 'Makanan Utama', color: '#4A5568', bg: '#EDF2F7' };
      default:
        return { name: 'silverware-fork-knife' as const, label: 'Lainnya', color: '#718096', bg: '#F7FAFC' };
    }
  };

  const cat = getCategoryInfo(item?.category || 'lainnya');

  const getRiskBadge = () => {
    if (percentOfDaily >= 60) {
      return { label: 'Porsi Gula Sangat Tinggi', bg: '#FFF0F0', text: '#D9383A', icon: 'warning-outline' };
    }
    if (percentOfDaily >= 30) {
      return { label: 'Porsi Gula Sedang', bg: '#FFFBEA', text: '#B7791F', icon: 'alert-circle-outline' };
    }
    return { label: 'Porsi Gula Ringan', bg: '#EBFBF5', text: '#188F7B', icon: 'checkmark-circle-outline' };
  };

  const risk = getRiskBadge();

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.modalRoot}>
        {/* Backdrop Overlay with smooth fade */}
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View style={[styles.backdropOverlay, { opacity: backdropAnim }]} />
        </TouchableWithoutFeedback>

        {/* Bottom Sheet Detail */}
        <Animated.View
          style={[
            styles.sheetContainer,
            { transform: [{ translateY: sheetSlideAnim }] },
          ]}
        >
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.categoryBadge, { backgroundColor: cat.bg }]}>
              <MaterialCommunityIcons name={cat.name} size={16} color={cat.color} />
              <Text style={[styles.categoryBadgeText, { color: cat.color }]}>{cat.label}</Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} activeOpacity={0.7} onPress={handleClose}>
              <Ionicons name="close" size={20} color="#766A64" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentScroll}
          >
            {/* Title & Metadata */}
            <Text style={styles.foodTitle}>{item?.name}</Text>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={14} color="#8A7B74" />
                <Text style={styles.metaText}>{item?.time || 'Hari ini'}</Text>
              </View>
              <Text style={styles.metaDot}>•</Text>
              <View style={styles.metaItem}>
                <Ionicons name="restaurant-outline" size={14} color="#8A7B74" />
                <Text style={styles.metaText}>{item?.portion || 1}x Porsi</Text>
              </View>
            </View>

            {/* Sugar Value Big Card */}
            <View style={[styles.sugarHighlightCard, Shadows.soft]}>
              <View style={styles.sugarMainValRow}>
                <View>
                  <Text style={styles.sugarSubCaption}>TOTAL KANDUNGAN GULA</Text>
                  <Text style={styles.sugarBigNum}>
                    {totalSugar.toFixed(1)} <Text style={styles.sugarUnit}>gram</Text>
                  </Text>
                </View>
                <View style={[styles.riskPill, { backgroundColor: risk.bg }]}>
                  <Ionicons name={risk.icon as any} size={14} color={risk.text} />
                  <Text style={[styles.riskPillText, { color: risk.text }]}>{risk.label}</Text>
                </View>
              </View>

              {/* Equivalence Visualizer */}
              <View style={styles.teaspoonRow}>
                <Text style={{ fontSize: 20 }}>🥄</Text>
                <Text style={styles.teaspoonText}>
                  Setara dengan <Text style={{ fontWeight: '800', color: '#403936' }}>{teaspoons} sendok teh</Text> gula pasir
                </Text>
              </View>

              {/* Quota Impact Bar */}
              <View style={styles.quotaSection}>
                <View style={styles.quotaHeader}>
                  <Text style={styles.quotaLabel}>Dampak pada batas harianmu ({dailySugarLimit}g)</Text>
                  <Text style={styles.quotaPercent}>{percentOfDaily}% kuota</Text>
                </View>
                <View style={styles.quotaTrack}>
                  <View
                    style={[
                      styles.quotaFill,
                      {
                        width: `${Math.min(100, percentOfDaily)}%`,
                        backgroundColor: percentOfDaily >= 60 ? '#FFAAA5' : percentOfDaily >= 30 ? '#F6E05E' : '#70D6B2',
                      },
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* Health Burn-off Tips Card */}
            <View style={styles.burnTipsCard}>
              <View style={styles.burnHeader}>
                <Text style={{ fontSize: 18 }}>🏃‍♂️</Text>
                <Text style={styles.burnTitle}>Tips Pembakaran & Kesehatan</Text>
              </View>
              <Text style={styles.burnDesc}>
                Gula pada makanan ini menyumbang sekitar <Text style={{ fontWeight: '700' }}>{caloriesFromSugar} kkal</Text> energi instan.
              </Text>
              <View style={styles.burnList}>
                <View style={styles.burnItem}>
                  <Ionicons name="walk" size={16} color="#188F7B" />
                  <Text style={styles.burnItemText}>
                    Dapat dibakar dengan <Text style={{ fontWeight: '700' }}>jalan santai ~{walkMinutes} menit</Text>.
                  </Text>
                </View>
                <View style={styles.burnItem}>
                  <Ionicons name="water" size={16} color="#3182CE" />
                  <Text style={styles.burnItemText}>
                    Minum 1-2 gelas air putih untuk membantu tubuh menetralkan konsentrasi gula darah.
                  </Text>
                </View>
              </View>
            </View>

            {/* Notes if available */}
            {item?.notes ? (
              <View style={styles.notesCard}>
                <Text style={styles.notesLabel}>Catatan Tambahan:</Text>
                <Text style={styles.notesContent}>{item.notes}</Text>
              </View>
            ) : null}

            {/* Actions */}
            <View style={styles.actionButtons}>
              {onDelete && item ? (
                <TouchableOpacity
                  style={styles.deleteActionBtn}
                  activeOpacity={0.8}
                  onPress={() => {
                    handleClose();
                    onDelete(item.id);
                  }}
                >
                  <Ionicons name="trash-outline" size={18} color="#E53E3E" />
                  <Text style={styles.deleteActionText}>Hapus dari Catatan</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                style={styles.closeActionBtn}
                activeOpacity={0.8}
                onPress={handleClose}
              >
                <Text style={styles.closeActionText}>Kembali</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
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
    paddingHorizontal: 22,
    paddingVertical: 10,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EFE7DA',
  },
  contentScroll: {
    paddingHorizontal: 22,
    paddingBottom: 20,
  },
  foodTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#403936',
    marginTop: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#8A7B74',
    fontWeight: '600',
  },
  metaDot: {
    color: '#D4C7C0',
  },
  sugarHighlightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F0E8DD',
    marginBottom: 14,
  },
  sugarMainValRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sugarSubCaption: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9C8E87',
    letterSpacing: 0.6,
  },
  sugarBigNum: {
    fontSize: 32,
    fontWeight: '900',
    color: '#403936',
    marginTop: 2,
  },
  sugarUnit: {
    fontSize: 18,
    fontWeight: '700',
    color: '#7D706A',
  },
  riskPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  riskPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  teaspoonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FAF5EE',
    padding: 12,
    borderRadius: 16,
    marginBottom: 14,
  },
  teaspoonText: {
    fontSize: 13,
    color: '#655A54',
  },
  quotaSection: {
    marginTop: 4,
  },
  quotaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  quotaLabel: {
    fontSize: 12,
    color: '#83746E',
    fontWeight: '600',
  },
  quotaPercent: {
    fontSize: 12,
    fontWeight: '800',
    color: '#188F7B',
  },
  quotaTrack: {
    height: 8,
    backgroundColor: '#EFE7DE',
    borderRadius: 4,
    overflow: 'hidden',
  },
  quotaFill: {
    height: '100%',
    borderRadius: 4,
  },
  burnTipsCard: {
    backgroundColor: '#F0FAF6',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D4EFE5',
    marginBottom: 14,
  },
  burnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  burnTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#176E60',
  },
  burnDesc: {
    fontSize: 12,
    color: '#466C63',
    lineHeight: 18,
    marginBottom: 10,
  },
  burnList: {
    gap: 6,
  },
  burnItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  burnItemText: {
    flex: 1,
    fontSize: 12,
    color: '#345750',
    lineHeight: 16,
  },
  notesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F0E8DD',
    marginBottom: 14,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A7B74',
    marginBottom: 4,
  },
  notesContent: {
    fontSize: 13,
    color: '#403936',
  },
  actionButtons: {
    gap: 10,
    marginTop: 6,
  },
  deleteActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 18,
    backgroundColor: '#FFF1F0',
    borderWidth: 1,
    borderColor: '#FED7D7',
  },
  deleteActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E53E3E',
  },
  closeActionBtn: {
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: '#403936',
    alignItems: 'center',
    ...Shadows.soft,
  },
  closeActionText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
