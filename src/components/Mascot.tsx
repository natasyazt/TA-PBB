import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import Svg, { Rect, Circle, Path, Ellipse, G } from 'react-native-svg';
import { SugarStatus } from '../types';

interface MascotProps {
  status: SugarStatus;
  size?: number;
  compact?: boolean;
  onPress?: () => void;
}

export const Mascot: React.FC<MascotProps> = ({
  status,
  size = 140,
  compact = false,
  onPress,
}) => {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -7,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 4,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [floatAnim]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    if (onPress) onPress();
  };

  const isGood = status === 'optimal';
  const isHigh = status === 'high';

  const finalSize = compact ? size * 0.75 : size;

  return (
    <View style={[styles.container, { width: finalSize, height: finalSize }]}>
      <Animated.View
        style={{
          transform: [
            { translateY: floatAnim },
            { scale: scaleAnim },
          ],
        }}
      >
        <TouchableOpacity activeOpacity={0.9} onPress={handlePress}>
          <Svg width={finalSize} height={finalSize} viewBox="0 0 180 180">
            {/* Ground Shadow */}
            <Ellipse cx="90" cy="158" rx="48" ry="9" fill="#EBDDD4" opacity={0.75} />

            {/* Arms */}
            <Path
              d="M58 123q-17 4-21 17M122 123q17 4 21 17"
              fill="none"
              stroke="#70635E"
              strokeLinecap="round"
              strokeWidth="7"
            />

            {/* Legs */}
            <Path
              d="M64 134v18M116 134v18"
              fill="none"
              stroke="#70635E"
              strokeLinecap="round"
              strokeWidth="8"
            />

            {/* Sugar Cube Body */}
            <Rect
              x="41"
              y="32"
              width="98"
              height="108"
              rx="30"
              fill="#FFFFFF"
              stroke="#70635E"
              strokeWidth="5"
            />

            {/* Top 3D bevel arch */}
            <Path
              d="M54 43q36-19 72 0"
              fill="#F1FCF8"
              stroke="#70635E"
              strokeLinecap="round"
              strokeWidth="5"
            />

            {/* Cap/Ribbon */}
            <Path
              d="M61 34v-8h58v8"
              fill="#FFD3B6"
              stroke="#70635E"
              strokeLinejoin="round"
              strokeWidth="5"
            />

            {/* Cute Highlights */}
            <Circle cx="68" cy="45" r="4" fill="#FFFFFF" />
            <Circle cx="113" cy="54" r="6" fill="#A8E6CF" opacity={0.45} />

            {/* Expressions */}
            {isGood ? (
              // Gula Cukup (Happy smile, starry eyes, peach blush)
              <G>
                {/* Floating yellow/pink stars */}
                <Rect x="20" y="45" width="8" height="8" rx="2" fill="#FFD26F" />
                <Rect x="150" y="65" width="7" height="7" rx="2" fill="#FFAAA5" />

                {/* Eyes */}
                <Path
                  d="M62 82q10-10 20 0M98 82q10-10 20 0"
                  fill="none"
                  stroke="#514943"
                  strokeLinecap="round"
                  strokeWidth="5"
                />
                {/* Cheerful Smile */}
                <Path
                  d="M71 101q19 22 38 0"
                  fill="#FFAAA5"
                  stroke="#514943"
                  strokeLinecap="round"
                  strokeWidth="5"
                />
                {/* Peach Blush */}
                <Circle cx="58" cy="99" r="7" fill="#FFD3B6" />
                <Circle cx="122" cy="99" r="7" fill="#FFD3B6" />
              </G>
            ) : isHigh ? (
              // Gula Berlebih (Dizzy cross eyes, wavy mouth)
              <G>
                {/* Spinning question marks */}
                <Path
                  d="M80 18 Q86 10 92 18 Q92 23 86 26"
                  fill="none"
                  stroke="#D95E5A"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <Circle cx="86" cy="30" r="2" fill="#D95E5A" />

                {/* Dizzy cross eyes */}
                <Path
                  d="m62 76 18 13M80 76 62 89M100 76l18 13M118 76l-18 13"
                  stroke="#514943"
                  strokeLinecap="round"
                  strokeWidth="5"
                />
                {/* Frown mouth */}
                <Path
                  d="M78 109q12-12 24 0"
                  fill="none"
                  stroke="#514943"
                  strokeLinecap="round"
                  strokeWidth="5"
                />
                <Circle cx="58" cy="101" r="7" fill="#FFAAA5" opacity={0.75} />
                <Circle cx="122" cy="101" r="7" fill="#FFAAA5" opacity={0.75} />
              </G>
            ) : (
              // Tidak Cukup Gula (Sleepy half eyes, flat mouth, Zzz)
              <G>
                {/* Sleepy eyes */}
                <Path
                  d="M60 84q11 6 22 0M98 84q11 6 22 0"
                  fill="none"
                  stroke="#514943"
                  strokeLinecap="round"
                  strokeWidth="5"
                />
                {/* Flat mouth */}
                <Path
                  d="M82 107h16"
                  stroke="#514943"
                  strokeLinecap="round"
                  strokeWidth="5"
                />
                {/* Wavy Zzz floating */}
                <Path
                  d="M124 66q8-8 15 0M132 55q8-8 15 0"
                  fill="none"
                  stroke="#8FBFB3"
                  strokeLinecap="round"
                  strokeWidth="4"
                />
              </G>
            )}
          </Svg>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
