import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Shadows } from '../constants/colors';

interface WaterTrackerCardProps {
  todaySugar: number;
  currentGlasses?: number;
  onLogWater?: () => void;
  onRemoveWater?: () => void;
}

export const WaterTrackerCard: React.FC<WaterTrackerCardProps> = ({
  todaySugar,
  currentGlasses,
  onLogWater,
  onRemoveWater,
}) => {
  const [fallbackGlasses, setFallbackGlasses] = useState<number>(0);
  const totalTarget = 8; // 8 gelas = 2000 ml
  const glasses = currentGlasses !== undefined ? currentGlasses : fallbackGlasses;

  const handleAddGlass = () => {
    if (glasses < totalTarget) {
      if (currentGlasses === undefined) {
        setFallbackGlasses((prev) => prev + 1);
      }
      onLogWater?.();
    }
  };

  const handleRemoveGlass = () => {
    if (glasses > 0) {
      if (currentGlasses === undefined) {
        setFallbackGlasses((prev) => Math.max(0, prev - 1));
      }
      onRemoveWater?.();
    }
  };

  const handleToggleGlass = (index: number) => {
    if (index < glasses) {
      handleRemoveGlass();
    } else {
      handleAddGlass();
    }
  };

  const percent = Math.min(Math.round((glasses / totalTarget) * 100), 100);
  const totalMl = glasses * 250;

  return (
    <View style={[styles.card, Shadows.card]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <View style={styles.waterIconBox}>
            <Ionicons name="water" size={19} color="#188F7B" />
          </View>
          <View>
            <Text style={styles.cardTitle}>Target Hidrasi Air Putih</Text>
            <Text style={styles.cardSubtitle}>
              Bantu ginjal membuang kelebihan glukosa darah
            </Text>
          </View>
        </View>

        <View style={styles.counterBadge}>
          <Text style={styles.counterBadgeText}>
            {glasses}/{totalTarget} Gelas
          </Text>
        </View>
      </View>

      {/* Progress Info Banner */}
      <View style={styles.infoBanner}>
        <View style={styles.infoBannerTop}>
          <Text style={styles.mlText}>
            {totalMl} <Text style={{ fontSize: 12, fontWeight: '600', color: '#8D7E77' }}>/ 2.000 ml</Text>
          </Text>
          <Text style={styles.percentText}>{percent}% tercapai</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${percent}%` }]} />
        </View>
      </View>

      {/* 8 Interactive Glass Droplets */}
      <View style={styles.glassesRow}>
        {Array.from({ length: totalTarget }).map((_, idx) => {
          const isFilled = idx < glasses;
          return (
            <TouchableOpacity
              key={idx}
              style={[
                styles.glassPill,
                isFilled ? styles.glassPillFilled : styles.glassPillEmpty,
              ]}
              activeOpacity={0.7}
              onPress={() => handleToggleGlass(idx)}
            >
              <Ionicons
                name={isFilled ? 'water' : 'water-outline'}
                size={18}
                color={isFilled ? '#188F7B' : '#B8C9C5'}
              />
              <Text
                style={[
                  styles.glassIndexText,
                  isFilled ? styles.glassIndexFilled : styles.glassIndexEmpty,
                ]}
              >
                {idx + 1}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Encouragement message & Action Buttons */}
      <View style={styles.bottomRow}>
        <Text style={styles.adviceText}>
          {todaySugar > 35
            ? '💡 Hari ini asupan gulamu lumayan tinggi, perbanyak minum air putih ya!'
            : glasses >= 8
            ? '🎉 Hebat! Target 2 liter air putih hari ini terpenuhi sempurna!'
            : 'Ketuk gelas untuk menambah catatan hidrasimu (250ml per gelas).'}
        </Text>

        <View style={styles.actionsGroup}>
          {glasses > 0 && (
            <TouchableOpacity
              style={styles.minusBtn}
              activeOpacity={0.8}
              onPress={handleRemoveGlass}
            >
              <Ionicons name="remove" size={16} color="#7D706A" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.addWaterBtn}
            activeOpacity={0.8}
            onPress={handleAddGlass}
          >
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <Text style={styles.addWaterBtnText}>+ 1 Gelas</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 18,
    marginHorizontal: 20,
    marginTop: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  waterIconBox: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: '#E6F8F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#403936',
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#8D7E77',
    marginTop: 1,
  },
  counterBadge: {
    backgroundColor: '#E6F8F2',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  counterBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#188F7B',
  },
  infoBanner: {
    backgroundColor: '#FFFDF7',
    borderWidth: 1,
    borderColor: '#EFE7DF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  infoBannerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  mlText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#176E60',
  },
  percentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#188F7B',
  },
  progressTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: '#EFE7DF',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#74CDB5',
  },
  glassesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  glassPill: {
    width: 34,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderWidth: 1.5,
  },
  glassPillFilled: {
    backgroundColor: '#E6F8F2',
    borderColor: '#74CDB5',
  },
  glassPillEmpty: {
    backgroundColor: '#FFFDF7',
    borderColor: '#EFE7DF',
  },
  glassIndexText: {
    fontSize: 9,
    fontWeight: '700',
  },
  glassIndexFilled: {
    color: '#176E60',
  },
  glassIndexEmpty: {
    color: '#A0958F',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2ECE4',
    paddingTop: 12,
  },
  adviceText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    color: '#6D625D',
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  minusBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#EFE8E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addWaterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#188F7B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  addWaterBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
