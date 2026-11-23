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
import { CatalogFoodItem } from '../types';
import { Colors, Shadows } from '../constants/colors';

interface KatalogFoodDetailModalProps {
  visible: boolean;
  item: CatalogFoodItem | null;
  dailySugarLimit: number;
  onClose: () => void;
  onQuickLog?: (item: CatalogFoodItem) => void;
}

export const KatalogFoodDetailModal: React.FC<KatalogFoodDetailModalProps> = ({
  visible,
  item,
  dailySugarLimit,
  onClose,
  onQuickLog,
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

  const totalSugar = item ? item.sugarGrams : 0;
  const teaspoons = (totalSugar / 4.2).toFixed(1);
  const percentOfDaily = dailySugarLimit > 0 ? Math.round((totalSugar / dailySugarLimit) * 100) : 0;
  const calories = Math.round(totalSugar * 4);
  const walkMinutes = Math.max(5, Math.round(calories / 4));

  const getCategoryInfo = (category: string) => {
    switch (category) {
      case 'minuman':
        return { name: 'cup-water' as const, label: 'Minuman Manis', color: '#188F7B', bg: '#E6FAF6' };
      case 'camilan':
        return { name: 'cookie' as const, label: 'Camilan & Kudapan', color: '#DD6B20', bg: '#FEEBC8' };
      case 'buah':
        return { name: 'food-apple' as const, label: 'Buah Alami', color: '#E53E3E', bg: '#FED7D7' };
      case 'makanan':
        return { name: 'bowl-mix' as const, label: 'Makanan Pokok', color: '#4A5568', bg: '#EDF2F7' };
      default:
        return { name: 'silverware-fork-knife' as const, label: 'Lainnya', color: '#718096', bg: '#F7FAFC' };
    }
  };

  const cat = getCategoryInfo(item?.category || 'lainnya');

  const getGlycemicIndex = (sugar: number) => {
    if (sugar >= 25) return { level: 'Tinggi', color: '#E53E3E', bg: '#FFF0F0' };
    if (sugar >= 12) return { level: 'Sedang', color: '#DD6B20', bg: '#FFFBEA' };
    return { level: 'Rendah', color: '#188F7B', bg: '#EBFBF5' };
  };

  const gi = getGlycemicIndex(totalSugar);

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.modalRoot}>
        {/* Backdrop Overlay */}
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
            {/* Title */}
            <Text style={styles.foodTitle}>{item?.name}</Text>
            <Text style={styles.foodSubTitle}>Katalog Kandungan Gizi & Fakta Kesehatan</Text>

            {/* Sugar Value Big Card */}
            <View style={[styles.sugarHighlightCard, Shadows.soft]}>
              <View style={styles.sugarMainValRow}>
                <View>
                  <Text style={styles.sugarSubCaption}>ESTIMASI KANDUNGAN GULA</Text>
                  <Text style={styles.sugarBigNum}>
                    {totalSugar} <Text style={styles.sugarUnit}>gram</Text>
                  </Text>
                </View>
                <View style={[styles.giPill, { backgroundColor: gi.bg }]}>
                  <Text style={[styles.giLabelText, { color: gi.color }]}>Indeks Glikemik: {gi.level}</Text>
                </View>
              </View>

              {/* Equivalence Visualizer */}
              <View style={styles.teaspoonRow}>
                <Text style={{ fontSize: 20 }}>🥄</Text>
                <Text style={styles.teaspoonText}>
                  Setara dengan <Text style={{ fontWeight: '800', color: '#403936' }}>{teaspoons} sendok teh</Text> gula pasir
                </Text>
              </View>

              {/* Quota Impact */}
              <View style={styles.quotaSection}>
                <View style={styles.quotaHeader}>
                  <Text style={styles.quotaLabel}>Porsi terhadap batas harian ({dailySugarLimit}g)</Text>
                  <Text style={styles.quotaPercent}>{percentOfDaily}%</Text>
                </View>
                <View style={styles.quotaTrack}>
                  <View
                    style={[
                      styles.quotaFill,
                      {
                        width: `${Math.min(100, percentOfDaily)}%`,
                        backgroundColor: percentOfDaily >= 50 ? '#FFAAA5' : percentOfDaily >= 25 ? '#F6E05E' : '#70D6B2',
                      },
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* Nutrition Facts Grid */}
            <View style={styles.nutritionGrid}>
              <View style={styles.nutritionBox}>
                <Ionicons name="flame-outline" size={18} color="#DD6B20" />
                <Text style={styles.nutritionVal}>~{calories} kkal</Text>
                <Text style={styles.nutritionLabel}>Kalori Gula</Text>
              </View>

              <View style={styles.nutritionBox}>
                <Ionicons name="walk-outline" size={18} color="#188F7B" />
                <Text style={styles.nutritionVal}>~{walkMinutes} mnt</Text>
                <Text style={styles.nutritionLabel}>Jalan Santai</Text>
              </View>

              <View style={styles.nutritionBox}>
                <Ionicons name="medical-outline" size={18} color="#3182CE" />
                <Text style={styles.nutritionVal}>{gi.level}</Text>
                <Text style={styles.nutritionLabel}>Beban Glikemik</Text>
              </View>
            </View>

            {/* Health Tips Card */}
            <View style={styles.tipsCard}>
              <View style={styles.tipsHeader}>
                <Text style={{ fontSize: 18 }}>💡</Text>
                <Text style={styles.tipsTitle}>Tips Konsumsi Bijak</Text>
              </View>
              <Text style={styles.tipsDesc}>
                {totalSugar >= 25
                  ? 'Minuman/makanan ini memiliki konsentrasi gula yang tinggi. Jika dikonsumsi berulang dalam seminggu, dapat menurunkan sensitivitas insulin dan meningkatkan risiko prediabetes. Mintalah varian less sugar (25-50%) atau nikmati dalam porsi kecil.'
                  : totalSugar >= 12
                  ? 'Kandungan gula dalam taraf sedang. Sebaiknya tidak dikombinasikan dengan minuman manis lain di hari yang sama agar total asupan gula harian tetap di bawah batas aman.'
                  : 'Pilihan yang relatif aman dan bersahabat bagi kestabilan gula darah harian Anda. Tetap imbangi dengan hidrasi air putih yang cukup!'}
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.actionButtons}>
              {onQuickLog && item ? (
                <TouchableOpacity
                  style={styles.quickLogBtn}
                  activeOpacity={0.85}
                  onPress={() => {
                    handleClose();
                    onQuickLog(item);
                  }}
                >
                  <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.quickLogBtnText}>Catat ke Hari Ini (+)</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                style={styles.closeActionBtn}
                activeOpacity={0.8}
                onPress={handleClose}
              >
                <Text style={styles.closeActionText}>Tutup</Text>
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
  foodSubTitle: {
    fontSize: 13,
    color: '#8A7B74',
    marginTop: 4,
    marginBottom: 16,
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
  giPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  giLabelText: {
    fontSize: 11,
    fontWeight: '800',
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
  nutritionGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  nutritionBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFE7DE',
    gap: 4,
  },
  nutritionVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#403936',
  },
  nutritionLabel: {
    fontSize: 11,
    color: '#8A7B74',
    textAlign: 'center',
  },
  tipsCard: {
    backgroundColor: '#FFFDF7',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#EFE7DE',
    marginBottom: 14,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#403936',
  },
  tipsDesc: {
    fontSize: 12,
    color: '#6F615B',
    lineHeight: 18,
  },
  actionButtons: {
    gap: 10,
    marginTop: 6,
  },
  quickLogBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: '#188F7B',
    ...Shadows.soft,
  },
  quickLogBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  closeActionBtn: {
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: '#F5EFE8',
    alignItems: 'center',
  },
  closeActionText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#655A54',
  },
});
