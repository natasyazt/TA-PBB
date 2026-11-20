import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Shadows } from '../constants/colors';

interface QuickActionsRowProps {
  onPressLogSugar: () => void;
  onPressSnack: () => void;
  onPressDrink: () => void;
  onPressCheckin: () => void;
}

export const QuickActionsRow: React.FC<QuickActionsRowProps> = ({
  onPressLogSugar,
  onPressSnack,
  onPressDrink,
  onPressCheckin,
}) => {
  return (
    <View style={styles.container}>
      {/* 1. Primary Highlight Button (Vibrant Coral Pink Circle with Sugar/Drop Icon) */}
      <TouchableOpacity
        style={styles.actionCol}
        activeOpacity={0.8}
        onPress={onPressLogSugar}
      >
        <View style={[styles.primaryCircle, Shadows.soft]}>
          <MaterialCommunityIcons name="water-outline" size={26} color="#FFFFFF" />
        </View>
        <Text style={[styles.actionLabel, styles.primaryLabel]}>Catat Gula</Text>
      </TouchableOpacity>

      {/* 2. Camilan (+) Button */}
      <TouchableOpacity
        style={styles.actionCol}
        activeOpacity={0.8}
        onPress={onPressSnack}
      >
        <View style={[styles.secondaryCircle, Shadows.soft]}>
          <Ionicons name="add" size={24} color="#9BA4AD" />
        </View>
        <Text style={styles.actionLabel}>Camilan</Text>
      </TouchableOpacity>

      {/* 3. Minuman (Heart/Cup) Button */}
      <TouchableOpacity
        style={styles.actionCol}
        activeOpacity={0.8}
        onPress={onPressDrink}
      >
        <View style={[styles.secondaryCircle, Shadows.soft]}>
          <Ionicons name="heart-outline" size={22} color="#9BA4AD" />
        </View>
        <Text style={styles.actionLabel}>Minuman</Text>
      </TouchableOpacity>

      {/* 4. Air Putih / Check-in Button */}
      <TouchableOpacity
        style={styles.actionCol}
        activeOpacity={0.8}
        onPress={onPressCheckin}
      >
        <View style={[styles.secondaryCircle, Shadows.soft]}>
          <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={22} color="#9BA4AD" />
        </View>
        <Text style={styles.actionLabel}>Air Putih</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 18,
  },
  actionCol: {
    alignItems: 'center',
    width: 72,
  },
  primaryCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.floPink, // '#FF5376' exactly as Flo screenshot
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  secondaryCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EFE7DA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#343E48',
    textAlign: 'center',
  },
  primaryLabel: {
    color: '#212930',
    fontWeight: '800',
  },
});
