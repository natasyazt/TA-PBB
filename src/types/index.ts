export type Gender = 'female' | 'male';
export type ExerciseFreq = 'rare' | 'moderate' | 'active'; // Jarang, Cukup Rutin, Sangat Rajin
export type SugarStatus = 'low' | 'optimal' | 'high'; // 'Tidak Cukup Gula' | 'Gula Cukup' | 'Gula Berlebih'
export type FoodCategory = 'minuman' | 'makanan' | 'camilan' | 'buah' | 'lainnya';
export type SugarHabitFreq = 'daily' | 'frequent' | 'occasional' | 'rare'; // Frekuensi konsumsi manis

export interface UserProfile {
  id: string;
  email: string;
  phone?: string;
  name: string; // Nama Lengkap
  nickname?: string; // Nama Panggilan untuk sapaan "Halo [nickname]!"
  age: number;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  bmi: number;
  bmiCategory: 'underweight' | 'normal' | 'overweight' | 'obese';
  hasDiabetesHistory: boolean; // Riwayat keluarga
  hasPersonalPrediabetes: boolean; // Riwayat diri sendiri
  exerciseFreq: ExerciseFreq;
  isDieting: boolean;
  sugarHabit: SugarHabitFreq;
  healthGoals: string[]; // Tujuan (mencegah diabetes, diet, energi stabil, dll)
  dailySugarLimit: number;
  isOnboarded: boolean;
  currentStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  bestStreak: number;
  avatarUri?: string; // Data URL, local file URI, or remote image URL
  avatarEmoji?: string; // Preselected cute character / emoji
}

export interface FoodLog {
  id: string;
  userId?: string;
  date: string; // YYYY-MM-DD
  name: string;
  sugarGrams: number;
  portion: number;
  category: FoodCategory;
  time: string; // HH:mm
  notes?: string;
  createdAt: string;
}

export interface CatalogFoodItem {
  id: string;
  name: string;
  sugarGrams: number;
  category: FoodCategory;
  iconName: string;
  servingDesc: string;
}

export interface DaySummary {
  date: string; // YYYY-MM-DD
  totalSugar: number;
  status: SugarStatus;
  limit: number;
  itemCount: number;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
  lastSyncedAt?: string;
}
