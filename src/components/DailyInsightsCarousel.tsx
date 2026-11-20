import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../constants/colors';
import { formatShortDate } from '../utils/dateUtils';
import { SugarStatus, UserProfile } from '../types';

interface DailyInsightsCarouselProps {
  activeDate: string;
  totalSugar: number;
  dailyLimit: number;
  status: SugarStatus;
  profile: UserProfile;
  onPressCard1?: () => void;
  onPressCard2?: () => void;
  onPressCard3?: () => void;
}

export const DailyInsightsCarousel: React.FC<DailyInsightsCarouselProps> = ({
  activeDate,
  totalSugar,
  dailyLimit,
  status,
  profile,
  onPressCard1,
  onPressCard2,
  onPressCard3,
}) => {
  const remaining = Math.max(0, dailyLimit - totalSugar);

  return (
    <View style={styles.container}>
      {/* Flo Section Title */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>
          Wawasan Hari Ini · {formatShortDate(activeDate)}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardsScroll}
      >
        {/* Card 1: Lavender / Blue Flo Card */}
        <TouchableOpacity
          style={[styles.card, styles.cardBlue, Shadows.soft]}
          activeOpacity={0.85}
          onPress={onPressCard1}
        >
          <View style={styles.blueHeaderPill}>
            <Text style={styles.blueHeaderDate}>{formatShortDate(activeDate)}:</Text>
            <Text style={styles.blueHeaderSub}>Risiko Diabetes & Nutrisi</Text>
          </View>
          <View style={styles.cardBottomBlue}>
            <Text style={styles.cardLinkBlue}>Lihat wawasan ›</Text>
          </View>
        </TouchableOpacity>

        {/* Card 2: Soft Coral / Pink Flo Card */}
        <TouchableOpacity
          style={[styles.card, styles.cardCoral, Shadows.soft]}
          activeOpacity={0.85}
          onPress={onPressCard2}
        >
          <View style={styles.coralContent}>
            <Text style={styles.coralTitle}>Sisa Kuota Gula Hari Ini</Text>
            <View style={styles.dotsRow}>
              <View style={[styles.dot, { backgroundColor: '#FF758F' }]} />
              <View style={[styles.dot, { backgroundColor: '#FF8FA3' }]} />
              <View style={[styles.dot, { backgroundColor: '#FFB3C1' }]} />
            </View>
            <Text style={styles.coralValueText}>
              {remaining > 0 ? `${remaining.toFixed(1)}g tersisa` : 'Batas terlampaui'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Card 3: Flo Signature Big Circular Bubble Card */}
        <TouchableOpacity
          style={[styles.card, styles.cardPinkBubble, Shadows.soft]}
          activeOpacity={0.85}
          onPress={onPressCard3}
        >
          <View style={styles.bubbleCircle}>
            <Text style={styles.bubbleTopLabel}>Total Gula</Text>
            <Text style={styles.bubbleBigNum}>{totalSugar.toFixed(0)}</Text>
            <Text style={styles.bubbleUnit}>gram</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 14,
  },
  headerRow: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C242C',
  },
  cardsScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  card: {
    width: 142,
    height: 148,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },

  // Card 1 Blue Style
  cardBlue: {
    borderColor: '#98B3FF',
  },
  blueHeaderPill: {
    backgroundColor: '#98B3FF',
    padding: 12,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  blueHeaderDate: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1C284F',
    lineHeight: 16,
  },
  blueHeaderSub: {
    fontSize: 11,
    color: '#293B6E',
    marginTop: 2,
    fontWeight: '600',
  },
  cardBottomBlue: {
    padding: 12,
  },
  cardLinkBlue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#3B68FF',
  },

  // Card 2 Coral Style
  cardCoral: {
    borderColor: '#FFBAC5',
    backgroundColor: '#FFF8F9',
    padding: 14,
  },
  coralContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coralTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2B333B',
    textAlign: 'center',
    lineHeight: 17,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 5,
    marginVertical: 10,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  coralValueText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF5376',
    textAlign: 'center',
  },

  // Card 3 Pink Bubble Style
  cardPinkBubble: {
    borderColor: '#F3B5FF',
    backgroundColor: '#FBF0FF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  bubbleCircle: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.soft,
  },
  bubbleTopLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A4A9E',
  },
  bubbleBigNum: {
    fontSize: 34,
    fontWeight: '900',
    color: '#1E252B',
    lineHeight: 38,
  },
  bubbleUnit: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8A4A9E',
  },
});
