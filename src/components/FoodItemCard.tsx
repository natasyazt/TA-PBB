import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { FoodLog } from '../types';
import { Colors, Shadows } from '../constants/colors';

interface FoodItemCardProps {
  item: FoodLog;
  onDelete: (id: string) => void;
}

export const FoodItemCard: React.FC<FoodItemCardProps> = ({ item, onDelete }) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'minuman':
        return { name: 'cup-water' as const, color: '#319795', bg: '#E6FFFA' };
      case 'camilan':
        return { name: 'cookie' as const, color: '#DD6B20', bg: '#FEEBC8' };
      case 'buah':
        return { name: 'food-apple' as const, color: '#E53E3E', bg: '#FED7D7' };
      case 'makanan':
        return { name: 'bowl-mix' as const, color: '#4A5568', bg: '#EDF2F7' };
      default:
        return { name: 'silverware-fork-knife' as const, color: '#718096', bg: '#F7FAFC' };
    }
  };

  const catStyle = getCategoryIcon(item.category);
  const totalSugar = (item.sugarGrams * item.portion).toFixed(1);

  return (
    <View style={[styles.card, Shadows.soft]}>
      {/* Category Icon */}
      <View style={[styles.iconCircle, { backgroundColor: catStyle.bg }]}>
        <MaterialCommunityIcons name={catStyle.name as any} size={22} color={catStyle.color} />
      </View>

      {/* Details */}
      <View style={styles.details}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
          <Text style={styles.timeText}>{item.time}</Text>
          {item.portion !== 1 && (
            <Text style={styles.portionText}>• {item.portion}x porsi</Text>
          )}
          {item.notes ? (
            <Text style={styles.notesText} numberOfLines={1}>
              • {item.notes}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Sugar Badge */}
      <View style={styles.sugarBadge}>
        <Text style={styles.sugarValue}>{totalSugar}g</Text>
        <Text style={styles.sugarLabel}>gula</Text>
      </View>

      {/* Delete button */}
      <TouchableOpacity
        style={styles.deleteBtn}
        activeOpacity={0.7}
        onPress={() => onDelete(item.id)}
      >
        <Ionicons name="trash-outline" size={16} color="#E53E3E" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 12,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  portionText: {
    fontSize: 12,
    color: Colors.primaryPeachDark,
    fontWeight: '600',
  },
  notesText: {
    fontSize: 12,
    color: Colors.textMuted,
    flex: 1,
  },
  sugarBadge: {
    backgroundColor: Colors.statusOptimal.bg,
    borderColor: Colors.statusOptimal.border,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    alignItems: 'center',
    marginRight: 8,
  },
  sugarValue: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.statusOptimal.darkText,
  },
  sugarLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.statusOptimal.text,
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
