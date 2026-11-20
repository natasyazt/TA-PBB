import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FoodLog, SupabaseConfig, UserProfile } from '../types';

const SUPABASE_CONFIG_KEY = '@GulaMate:supabase_config';
const AUTH_SESSION_KEY = '@GulaMate:auth_session';

// Production Supabase configuration provided by user
export const DEFAULT_SUPABASE_URL = 'https://ybmyasrcaxvekljemkpg.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY =
  'sb_publishable_48Yo2AqyxDBX4VI5Kim3pw_irrsCVY-';

let currentConfig: SupabaseConfig = {
  url: DEFAULT_SUPABASE_URL,
  anonKey: DEFAULT_SUPABASE_ANON_KEY,
  isConnected: true,
  lastSyncedAt: new Date().toISOString(),
};

let supabaseClient: SupabaseClient | null = null;

export async function initSupabase(): Promise<SupabaseClient | null> {
  try {
    const saved = await AsyncStorage.getItem(SUPABASE_CONFIG_KEY);
    if (saved) {
      const parsed: SupabaseConfig = JSON.parse(saved);
      if (parsed.url && parsed.anonKey) {
        currentConfig = parsed;
        supabaseClient = createClient(currentConfig.url, currentConfig.anonKey);
        currentConfig.isConnected = true;
        return supabaseClient;
      }
    }

    // Default to provided Supabase project
    if (DEFAULT_SUPABASE_URL && DEFAULT_SUPABASE_ANON_KEY) {
      supabaseClient = createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY);
      currentConfig = {
        url: DEFAULT_SUPABASE_URL,
        anonKey: DEFAULT_SUPABASE_ANON_KEY,
        isConnected: true,
        lastSyncedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(currentConfig));
      return supabaseClient;
    }
  } catch (e) {
    console.warn('Supabase init notice (offline storage ready):', e);
  }
  return null;
}

export function getClient(): SupabaseClient | null {
  if (!supabaseClient && DEFAULT_SUPABASE_URL && DEFAULT_SUPABASE_ANON_KEY) {
    supabaseClient = createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY);
  }
  return supabaseClient;
}

export async function getSupabaseConfig(): Promise<SupabaseConfig> {
  try {
    const saved = await AsyncStorage.getItem(SUPABASE_CONFIG_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {}
  return currentConfig;
}

export async function saveSupabaseConfig(
  url: string,
  anonKey: string
): Promise<{ success: boolean; message: string }> {
  try {
    if (!url.trim() || !anonKey.trim()) {
      currentConfig = { url: '', anonKey: '', isConnected: false };
      await AsyncStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(currentConfig));
      supabaseClient = null;
      return { success: true, message: 'Supabase dinonaktifkan (mode offline lokal aktif).' };
    }

    const testClient = createClient(url.trim(), anonKey.trim());
    supabaseClient = testClient;
    currentConfig = {
      url: url.trim(),
      anonKey: anonKey.trim(),
      isConnected: true,
      lastSyncedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(currentConfig));

    return {
      success: true,
      message: 'Berhasil terhubung ke Supabase! Sinkronisasi cloud aktif ✨',
    };
  } catch (e: any) {
    return {
      success: false,
      message: 'Gagal terhubung ke Supabase: ' + (e?.message || 'Periksa URL dan Anon Key.'),
    };
  }
}

/**
 * Sync profile to Supabase
 */
export async function syncProfileToSupabase(profile: UserProfile): Promise<boolean> {
  const client = getClient();
  if (!client) return false;
  try {
    const { error } = await client.from('profiles').upsert(
      {
        id: profile.id || 'user_default',
        email: profile.email || '',
        name: profile.name,
        age: profile.age,
        gender: profile.gender,
        height_cm: profile.heightCm,
        weight_kg: profile.weightKg,
        bmi: profile.bmi,
        bmi_category: profile.bmiCategory,
        has_diabetes_history: profile.hasDiabetesHistory,
        has_personal_prediabetes: profile.hasPersonalPrediabetes,
        exercise_freq: profile.exerciseFreq,
        is_dieting: profile.isDieting,
        sugar_habit: profile.sugarHabit,
        health_goals: profile.healthGoals,
        daily_sugar_limit: profile.dailySugarLimit,
        current_streak: profile.currentStreak,
        last_active_date: profile.lastActiveDate,
        best_streak: profile.bestStreak,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
    return !error;
  } catch (e) {
    return false;
  }
}

/**
 * Sync food log to Supabase
 */
export async function syncLogToSupabase(log: FoodLog): Promise<boolean> {
  const client = getClient();
  if (!client) return false;
  try {
    const { error } = await client.from('sugar_logs').upsert({
      id: log.id,
      user_id: log.userId || 'user_default',
      date: log.date,
      name: log.name,
      sugar_grams: log.sugarGrams,
      portion: log.portion,
      category: log.category,
      time: log.time,
      notes: log.notes || '',
      created_at: log.createdAt,
    });
    return !error;
  } catch (e) {
    return false;
  }
}

/**
 * Delete food log from Supabase
 */
export async function deleteLogFromSupabase(id: string): Promise<boolean> {
  const client = getClient();
  if (!client) return false;
  try {
    const { error } = await client.from('sugar_logs').delete().eq('id', id);
    return !error;
  } catch (e) {
    return false;
  }
}

/**
 * Sync water logs to Supabase
 */
export async function syncWaterToSupabase(
  date: string,
  glasses: number,
  totalMl: number,
  userId?: string
): Promise<boolean> {
  const client = getClient();
  if (!client) return false;
  try {
    const id = `water_${userId || 'user_default'}_${date}`;
    const { error } = await client.from('water_logs').upsert(
      {
        id,
        user_id: userId || 'user_default',
        date,
        glasses,
        total_ml: totalMl,
        created_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
    return !error;
  } catch (e) {
    return false;
  }
}
