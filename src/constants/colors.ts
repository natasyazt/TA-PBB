import { Platform } from 'react-native';

export const Colors = {
  // GulaMate Figma Signature Palette
  background: '#FFFDF7', // Cream lembut utama
  backgroundSecondary: '#FFF6EE', // Warm peach header strip
  card: '#FFFFFF',
  cardSubtle: '#FCFAF6',
  border: '#EFE7DF',
  borderSubtle: '#F0E7DF',
  borderDashed: '#E7DCD3',

  // Primary Mint Accents
  primary: '#188F7B',
  primaryDark: '#188F7B',
  primaryMint: '#A8E6CF',
  primaryMintDark: '#188F7B',
  primaryMintLight: '#E9FAF4',
  primaryMintBorder: '#74CDB5',
  primaryMintText: '#176E60',

  // Primary Peach Accents
  primaryPeach: '#FFD3B6',
  primaryPeachDark: '#FF8F87', // Center FAB floating button
  primaryPeachLight: '#FFF0E5',
  primaryPeachText: '#A65C42',
  floPink: '#FF8F87',

  // Status Colors (Cute Pastel Theme from Figma)
  statusLow: {
    color: '#FFF3B0', // Pastel yellow
    bg: '#FFF3B0',
    badge: '#FFF3B0',
    accent: '#D4A72C',
    border: '#D4A72C',
    text: '#8B6811',
    darkText: '#8B6811',
    title: 'Belum Cukup',
    fullTitle: 'Tidak Cukup Gula',
    message: 'Tubuhmu butuh energi. Yuk, makan teratur hari ini.',
  },
  statusOptimal: {
    color: '#B8F2E6', // Mint green
    bg: '#B8F2E6',
    badge: '#B8F2E6',
    accent: '#188F7B',
    border: '#188F7B',
    text: '#176E60',
    darkText: '#176E60',
    title: 'Gula Cukup',
    fullTitle: 'Gula Cukup',
    message: 'Hebat! Asupanmu masih dalam batas yang pas.',
  },
  statusHigh: {
    color: '#FFAAA5', // Pastel coral pink
    bg: '#FFAAA5',
    badge: '#FFAAA5',
    accent: '#D95E5A',
    border: '#D95E5A',
    text: '#A62626',
    darkText: '#A62626',
    title: 'Gula Berlebih',
    fullTitle: 'Gula Berlebih',
    message: 'Tidak apa-apa. Minum air putih dan pilih yang segar, ya.',
  },

  // Typography (Dark Espresso from Figma)
  textPrimary: '#403936',
  textSecondary: '#6D625D',
  textMuted: '#91837C',
  textLight: '#A0958F',
  textInverted: '#FFFFFF',

  // Flo/Figma Elements
  activeDatePill: '#403936',
  todayDot: '#FF8F87',
  shadowColor: '#574840',
};

export const Shadows = {
  soft: {
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  medium: {
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 4,
  },
  card: {
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 4,
  },
  floating: {
    shadowColor: Colors.primaryPeachDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
};

export const Typography = {
  fontFamily: Platform.select({
    ios: 'System',
    android: 'sans-serif-rounded',
    default: 'sans-serif',
  }),
};
