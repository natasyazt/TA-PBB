import { ExerciseFreq, SugarHabitFreq, SugarStatus } from '../types';

export const BASE_DAILY_SUGAR_LIMIT = 50; // Standar Kemenkes RI / WHO (50g)
export const MIN_SAFE_SUGAR_LIMIT = 25; // Batas minimal aman

export interface BMIData {
  bmi: number;
  category: 'underweight' | 'normal' | 'overweight' | 'obese';
  categoryLabel: string;
  advice: string;
}

export function calculateBMI(heightCm: number, weightKg: number): BMIData {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) {
    return {
      bmi: 21.5,
      category: 'normal',
      categoryLabel: 'Normal',
      advice: 'Indeks massa tubuh seimbang.',
    };
  }

  const heightM = heightCm / 100;
  const bmiRaw = weightKg / (heightM * heightM);
  const bmi = Math.round(bmiRaw * 10) / 10;

  if (bmi < 18.5) {
    return {
      bmi,
      category: 'underweight',
      categoryLabel: 'Berat Badan Kurang',
      advice: 'Perbanyak asupan nutrisi seimbang kaya protein & kalori sehat.',
    };
  } else if (bmi <= 24.9) {
    return {
      bmi,
      category: 'normal',
      categoryLabel: 'Ideal / Normal',
      advice: 'Bagus sekali! Pertahankan berat badan idealmu.',
    };
  } else if (bmi <= 29.9) {
    return {
      bmi,
      category: 'overweight',
      categoryLabel: 'Berat Badan Berlebih',
      advice: 'Perlu waspada, kelebihan berat badan meningkatkan risiko resistensi insulin.',
    };
  } else {
    return {
      bmi,
      category: 'obese',
      categoryLabel: 'Obesitas (Risiko Tinggi)',
      advice: 'Sangat disarankan membatasi gula tambahan untuk mencegah diabetes tipe 2.',
    };
  }
}

export interface SugarCalculationBreakdown {
  baseLimit: number;
  diabetesDeduction: number;
  dietDeduction: number;
  exerciseBonus: number;
  bmiAdjustment: number;
  finalLimit: number;
  riskScoreText: string;
}

/**
 * Logika Perhitungan Batas Gula Harian:
 * - Batas dasar: 50 gram/hari.
 * - Jika punya keturunan diabetes = Ya -> kurangi 15 gram.
 * - Jika sedang diet = Ya -> kurangi 10 gram.
 * - Jika rajin olahraga = Sangat Rajin -> tambah toleransi 5 gram.
 * - Pastikan batas minimal aman tidak kurang dari 25 gram/hari.
 */
export function calculateDailySugarLimit(
  hasDiabetesHistory: boolean,
  isDieting: boolean,
  exerciseFreq: ExerciseFreq,
  bmi?: number
): SugarCalculationBreakdown {
  const baseLimit = BASE_DAILY_SUGAR_LIMIT;
  const diabetesDeduction = hasDiabetesHistory ? 15 : 0;
  const dietDeduction = isDieting ? 10 : 0;
  const exerciseBonus = exerciseFreq === 'active' ? 5 : 0;
  const bmiAdjustment = (bmi && bmi >= 30) ? 0 : 0; // maintain base rules

  let calculated = baseLimit - diabetesDeduction - dietDeduction + exerciseBonus;
  const finalLimit = Math.max(MIN_SAFE_SUGAR_LIMIT, calculated);

  let riskScoreText = 'Rendah (Pola Hidup Sehat)';
  if (hasDiabetesHistory && (bmi && bmi >= 25)) {
    riskScoreText = 'Tinggi (Riwayat Genetik + Berat Badan)';
  } else if (hasDiabetesHistory || (bmi && bmi >= 25)) {
    riskScoreText = 'Sedang (Perlu Pemantauan Teratur)';
  }

  return {
    baseLimit,
    diabetesDeduction,
    dietDeduction,
    exerciseBonus,
    bmiAdjustment,
    finalLimit,
    riskScoreText,
  };
}

/**
 * Klasifikasi Status Gula Harian:
 * - < 10 gram: "Tidak Cukup Gula"
 * - 10 gram s/d Batas Maksimal: "Gula Cukup"
 * - > Batas Maksimal: "Gula Berlebih"
 */
export function getSugarStatus(totalSugar: number, dailyLimit: number): SugarStatus {
  if (totalSugar < 10) {
    return 'low';
  }
  if (totalSugar <= dailyLimit) {
    return 'optimal';
  }
  return 'high';
}

export interface StatusInfo {
  status: SugarStatus;
  title: string;
  badgeLabel: string;
  shortAdvice: string;
  detailedMessage: string;
  mascotMood: 'sleepy' | 'happy' | 'dizzy';
}

export function getStatusInfo(status: SugarStatus, totalSugar: number, dailyLimit: number): StatusInfo {
  switch (status) {
    case 'low':
      return {
        status: 'low',
        title: 'Tidak Cukup Gula',
        badgeLabel: 'Kurang Gula',
        shortAdvice: 'Tubuhmu butuh sedikit energi gula alami!',
        detailedMessage:
          'Asupan gulamu masih sangat minim (< 10g). Jangan sampai lemas ya, konsumsi buah atau makanan bergizi untuk bahan bakar energimu!',
        mascotMood: 'sleepy',
      };
    case 'optimal':
      const remaining = Math.max(0, dailyLimit - totalSugar);
      return {
        status: 'optimal',
        title: 'Gula Cukup',
        badgeLabel: 'Ideal & Sehat',
        shortAdvice: `Keren! Sisa kuota amanmu ${remaining.toFixed(1)}g hari ini.`,
        detailedMessage:
          'Hebat! Pola konsumsimu seimbang dan terkontrol di bawah batas maksimal. Pertahankan terus ya untuk cegah diabetes!',
        mascotMood: 'happy',
      };
    case 'high':
      const excess = totalSugar - dailyLimit;
      return {
        status: 'high',
        title: 'Gula Berlebih',
        badgeLabel: 'Melebihi Batas',
        shortAdvice: `Melebihi batas aman sebesar +${excess.toFixed(1)}g!`,
        detailedMessage:
          'Waduh, asupan gula hari ini sudah over limit! Yuk stop minuman manis dulu, perbanyak minum air putih hangat dan jalan santai yaa~',
        mascotMood: 'dizzy',
      };
  }
}
