import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { SugarStatus } from '../types';
import { Mascot } from './Mascot';

interface MascotSceneProps {
  status: SugarStatus;
  onPressMascot?: () => void;
  onUndoDate?: () => void;
  showUndo?: boolean;
}

export const MascotScene: React.FC<MascotSceneProps> = ({
  status,
  onPressMascot,
  onUndoDate,
  showUndo = false,
}) => {
  return (
    <View style={styles.container}>
      {/* Background Soft Clouds (SVG) */}
      <View style={styles.cloudsBg}>
        <Svg width="100%" height="160" viewBox="0 0 360 160">
          <G fill="#FFFFFF" opacity={0.88}>
            {/* Left Cloud */}
            <Circle cx="60" cy="95" r="45" />
            <Circle cx="105" cy="85" r="38" />
            <Circle cx="30" cy="110" r="30" />
            <Path d="M10 120 L140 120 L140 140 L10 140 Z" />

            {/* Right Big Fluffy Cloud */}
            <Circle cx="310" cy="90" r="50" />
            <Circle cx="260" cy="80" r="42" />
            <Circle cx="220" cy="100" r="32" />
            <Circle cx="350" cy="105" r="35" />
            <Path d="M200 125 L360 125 L360 150 L200 150 Z" />

            {/* Distant Soft Cloud */}
            <Circle cx="180" cy="65" r="24" opacity={0.65} />
            <Circle cx="205" cy="60" r="20" opacity={0.65} />
          </G>
        </Svg>
      </View>

      {/* Undo / Back arrow button on left (as seen in Flo screenshot) */}
      {showUndo && (
        <TouchableOpacity
          style={styles.undoBtn}
          activeOpacity={0.7}
          onPress={onUndoDate}
        >
          <Ionicons name="arrow-undo-outline" size={20} color="#9BA4AD" />
        </TouchableOpacity>
      )}

      {/* Animated Center Mascot */}
      <View style={styles.mascotWrapper}>
        <Mascot status={status} size={145} onPress={onPressMascot} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 180,
    width: '100%',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: '#FAF6F0',
  },
  cloudsBg: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 160,
  },
  undoBtn: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  mascotWrapper: {
    zIndex: 5,
    marginBottom: 4,
  },
});
