import AsyncStorage from '@react-native-async-storage/async-storage';
import { FoodLog, UserProfile } from '../types';
import { toDateString, getYesterdayString, daysBetween } from '../utils/dateUtils';
import { getSugarStatus } from '../utils/sugarCalculator';
import { syncProfileToSupabase, syncLogToSupabase, deleteLogFromSupabase } from './supabase';

const KEYS = {
  PROFILE: '@GulaMate:profile',
  LOGS: '@GulaMate:logs',
  AUTH_USER: '@GulaMate:auth_user',
  REGISTERED_ACCOUNTS: '@GulaMate:registered_accounts',
};

export interface RegisteredAccount {
  id: string;
  email: string;
  password: string;
  name: string;
  nickname?: string;
  createdAt: string;
  profile?: UserProfile;
}

const DEFAULT_PROFILE: UserProfile = {
  id: 'user_default',
  email: 'temansehat@gulamate.id',
  name: 'Teman Manis',
  nickname: 'Manis',
  age: 22,
  gender: 'female',
  heightCm: 160,
  weightKg: 52,
  bmi: 20.3,
  bmiCategory: 'normal',
  hasDiabetesHistory: false,
  hasPersonalPrediabetes: false,
  exerciseFreq: 'moderate',
  isDieting: false,
  sugarHabit: 'occasional',
  healthGoals: ['Mencegah risiko diabetes', 'Menjaga energi stabil'],
  dailySugarLimit: 50,
  isOnboarded: false,
  currentStreak: 0,
  lastActiveDate: '',
  bestStreak: 0,
};

/**
 * Check if user is logged in
 */
export async function getAuthUser(): Promise<{ email: string; id: string } | null> {
  try {
    const json = await AsyncStorage.getItem(KEYS.AUTH_USER);
    if (json) return JSON.parse(json);
  } catch (e) {}
  return null;
}

export async function setAuthUser(user: { email: string; id: string; name?: string; nickname?: string } | null): Promise<void> {
  if (user) {
    await AsyncStorage.setItem(KEYS.AUTH_USER, JSON.stringify(user));
  } else {
    await AsyncStorage.removeItem(KEYS.AUTH_USER);
  }
}

/**
 * Account persistence for reliable multi-session authentication
 */
export async function getRegisteredAccounts(): Promise<RegisteredAccount[]> {
  try {
    const json = await AsyncStorage.getItem(KEYS.REGISTERED_ACCOUNTS);
    if (json) {
      return JSON.parse(json);
    }
  } catch (e) {
    console.warn('Error reading registered accounts:', e);
  }
  return [];
}

export async function findRegisteredAccount(email: string): Promise<RegisteredAccount | null> {
  const accounts = await getRegisteredAccounts();
  const normalized = email.trim().toLowerCase();
  return accounts.find((acc) => acc.email.trim().toLowerCase() === normalized) || null;
}

export async function saveRegisteredAccount(account: RegisteredAccount): Promise<void> {
  try {
    const accounts = await getRegisteredAccounts();
    const normalized = account.email.trim().toLowerCase();
    const index = accounts.findIndex((a) => a.email.trim().toLowerCase() === normalized);

    if (index >= 0) {
      accounts[index] = {
        ...accounts[index],
        ...account,
        profile: account.profile || accounts[index].profile,
      };
    } else {
      accounts.push(account);
    }

    await AsyncStorage.setItem(KEYS.REGISTERED_ACCOUNTS, JSON.stringify(accounts));
  } catch (e) {
    console.warn('Error saving registered account:', e);
  }
}

export async function updateAccountProfile(email: string, profile: UserProfile): Promise<void> {
  try {
    const accounts = await getRegisteredAccounts();
    const normalized = email.trim().toLowerCase();
    const index = accounts.findIndex((a) => a.email.trim().toLowerCase() === normalized);

    if (index >= 0) {
      accounts[index].profile = profile;
      if (profile.name) accounts[index].name = profile.name;
      if (profile.nickname) accounts[index].nickname = profile.nickname;
      await AsyncStorage.setItem(KEYS.REGISTERED_ACCOUNTS, JSON.stringify(accounts));
    }
  } catch (e) {
    console.warn('Error updating account profile:', e);
  }
}

export async function getExistingProfileByEmail(email: string): Promise<UserProfile | null> {
  try {
    const json = await AsyncStorage.getItem(KEYS.PROFILE);
    if (json) {
      const p: UserProfile = JSON.parse(json);
      if (p.email && p.email.trim().toLowerCase() === email.trim().toLowerCase()) {
        return p;
      }
    }
  } catch (e) {}
  return null;
}

/**
 * Get active date (real current date in real-time)
 */
export async function getActiveDate(): Promise<string> {
  return toDateString(new Date());
}

export async function getUserProfile(): Promise<UserProfile> {
  try {
    const json = await AsyncStorage.getItem(KEYS.PROFILE);
    if (json) {
      return { ...DEFAULT_PROFILE, ...JSON.parse(json) };
    }
  } catch (e) {}
  return DEFAULT_PROFILE;
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
    syncProfileToSupabase(profile).catch(() => {});
  } catch (e) {
    console.error('Error saving profile:', e);
  }
}

export async function getAllFoodLogs(): Promise<FoodLog[]> {
  try {
    const json = await AsyncStorage.getItem(KEYS.LOGS);
    if (json) {
      return JSON.parse(json);
    }
  } catch (e) {}
  return [];
}

export async function addFoodLog(
  log: Omit<FoodLog, 'id' | 'createdAt'>
): Promise<{ newLog: FoodLog; updatedProfile: UserProfile }> {
  const allLogs = await getAllFoodLogs();
  const profile = await getUserProfile();

  const newLog: FoodLog = {
    ...log,
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    userId: profile.id,
    createdAt: new Date().toISOString(),
  };

  const updatedLogs = [newLog, ...allLogs];
  await AsyncStorage.setItem(KEYS.LOGS, JSON.stringify(updatedLogs));

  syncLogToSupabase(newLog).catch(() => {});

  const todayLogs = updatedLogs.filter((item) => item.date === log.date);
  const totalSugarToday = todayLogs.reduce((acc, curr) => acc + curr.sugarGrams * curr.portion, 0);

  const updatedProfile = evaluateStreak(profile, log.date, totalSugarToday);
  await saveUserProfile(updatedProfile);

  return { newLog, updatedProfile };
}

export async function deleteFoodLog(id: string): Promise<FoodLog[]> {
  const allLogs = await getAllFoodLogs();
  const updatedLogs = allLogs.filter((item) => item.id !== id);
  await AsyncStorage.setItem(KEYS.LOGS, JSON.stringify(updatedLogs));

  deleteLogFromSupabase(id).catch(() => {});
  return updatedLogs;
}

function evaluateStreak(
  profile: UserProfile,
  dateStr: string,
  totalSugarToday: number
): UserProfile {
  const status = getSugarStatus(totalSugarToday, profile.dailySugarLimit);

  if (status !== 'optimal') {
    return profile;
  }

  if (profile.lastActiveDate === dateStr) {
    return profile;
  }

  let newStreak = profile.currentStreak;
  const yesterday = getYesterdayString(dateStr);

  if (!profile.lastActiveDate) {
    newStreak = 1;
  } else if (profile.lastActiveDate === yesterday) {
    newStreak = (profile.currentStreak || 0) + 1;
  } else {
    const gap = daysBetween(profile.lastActiveDate, dateStr);
    if (gap > 1) {
      newStreak = 1;
    } else if (gap < 0) {
      return profile;
    }
  }

  const bestStreak = Math.max(profile.bestStreak || 0, newStreak);

  return {
    ...profile,
    currentStreak: newStreak,
    lastActiveDate: dateStr,
    bestStreak,
  };
}

export async function resetAllData(): Promise<void> {
  await AsyncStorage.multiRemove([KEYS.PROFILE, KEYS.LOGS, KEYS.AUTH_USER]);
}
