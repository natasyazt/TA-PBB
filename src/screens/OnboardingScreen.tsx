import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ExerciseFreq, Gender, UserProfile } from '../types';
import { calculateDailySugarLimit } from '../utils/sugarCalculator';
import { Mascot } from '../components/Mascot';

interface OnboardingScreenProps {
  initialProfile?: Partial<UserProfile>;
  onComplete: (profile: UserProfile) => void;
  onBackToAuth?: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  initialProfile,
  onComplete,
  onBackToAuth,
}) => {
  const [step, setStep] = useState<number>(1);

  // Profile data
  const [name, setName] = useState<string>(initialProfile?.name || '');
  const [nickname, setNickname] = useState<string>(
    initialProfile?.nickname || (initialProfile?.name?.trim() ? initialProfile.name.trim().split(' ')[0] : '')
  );
  const [age, setAge] = useState<string>(
    initialProfile?.age ? String(initialProfile.age) : '22'
  );
  const [gender, setGender] = useState<Gender>(initialProfile?.gender || 'female');
  const [hasDiabetesHistory, setHasDiabetesHistory] = useState<boolean>(
    initialProfile?.hasDiabetesHistory ?? false
  );
  const [exerciseFreq, setExerciseFreq] = useState<ExerciseFreq>(
    initialProfile?.exerciseFreq || 'moderate'
  );
  const [isDieting, setIsDieting] = useState<boolean>(
    initialProfile?.isDieting ?? false
  );

  // Slide & Fade animation states
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(20)).current;
  const isTransitioningRef = useRef(false);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: step * 20,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [step]);

  const canContinue =
    step === 1
      ? name.trim().length >= 2 && parseInt(age, 10) >= 10
      : step === 5
      ? nickname.trim().length >= 1
      : true;

  const transitionStep = (newStep: number, direction: 'forward' | 'backward') => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;

    const outX = direction === 'forward' ? -35 : 35;
    const inX = direction === 'forward' ? 35 : -35;

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: outX,
        duration: 110,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 110,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start(() => {
      setStep(newStep);
      slideAnim.setValue(inX);

      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start(() => {
        isTransitioningRef.current = false;
      });
    });
  };

  const handleNext = () => {
    if (step < 5) {
      transitionStep(step + 1, 'forward');
    } else {
      // Calculate daily sugar limit
      const calculation = calculateDailySugarLimit(
        hasDiabetesHistory,
        isDieting,
        exerciseFreq,
        21 // normal baseline BMI
      );

      const completedProfile: UserProfile = {
        id: initialProfile?.id || 'user_' + Date.now(),
        email: initialProfile?.email || 'user@gulamate.id',
        name: name.trim() || 'Teman Manis',
        nickname: nickname.trim() || (name.trim() ? name.trim().split(' ')[0] : 'Manis'),
        age: parseInt(age, 10) || 22,
        gender,
        heightCm: initialProfile?.heightCm || 160,
        weightKg: initialProfile?.weightKg || 52,
        bmi: 21,
        bmiCategory: 'normal',
        hasDiabetesHistory,
        hasPersonalPrediabetes: false,
        exerciseFreq,
        isDieting,
        sugarHabit: 'frequent',
        healthGoals: ['Mencegah risiko diabetes', 'Menjaga energi stabil'],
        dailySugarLimit: calculation.finalLimit,
        isOnboarded: true,
        currentStreak: initialProfile?.currentStreak || 1,
        lastActiveDate: initialProfile?.lastActiveDate || '',
        bestStreak: initialProfile?.bestStreak || 1,
      };

      onComplete(completedProfile);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      transitionStep(step - 1, 'backward');
    } else if (onBackToAuth) {
      onBackToAuth();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <TouchableOpacity
                style={styles.headerBackBtn}
                activeOpacity={0.7}
                onPress={handleBack}
              >
                <Ionicons name="arrow-back" size={20} color="#403936" />
              </TouchableOpacity>

              <View style={styles.brandRow}>
                <View style={styles.logoBadge}>
                  <Mascot status="optimal" size={32} />
                </View>
                <Text style={styles.brandName}>GulaMate</Text>
              </View>

              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>{step} dari 5</Text>
              </View>
            </View>

            {/* Progress bar with smooth animation */}
            <View style={styles.progressBarTrack}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
          </View>

          {/* Animated Question Section with Smooth Slide & Fade */}
          <Animated.View
            style={[
              styles.questionAnimatedContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            {/* Titles */}
          <View style={styles.titleSection}>
            <Text style={styles.sectionSubtitle}>
              {step <= 4 ? 'Kuesioner Kesehatan' : 'Satu Langkah Terakhir! ✨'}
            </Text>
            <Text style={styles.sectionTitle}>
              {step === 1 && 'Boleh tahu tentang kamu?'}
              {step === 2 && 'Cerita sedikit soal keluarga'}
              {step === 3 && 'Seberapa aktif harimu?'}
              {step === 4 && 'Program diet saat ini'}
              {step === 5 && 'Bagaimana Mimo memanggilmu?'}
            </Text>
            <Text style={styles.sectionDesc}>
              {step === 1 &&
                'Data fisik dasar untuk menghitung indeks metabolisme tubuhmu.'}
              {step === 2 &&
                'Jawabanmu membantu kami menghitung batas gula harian yang lebih sesuai.'}
              {step === 3 &&
                'Aktivitas fisik ikut memengaruhi toleransi konsumsi gula harianmu.'}
              {step === 4 &&
                'Kami akan menyesuaikan rekomendasi agar tujuan dietmu tetap aman.'}
              {step === 5 &&
                'Kuesioner kesehatan selesai! Tulis nama panggilanmu agar Mimo bisa menyapa dan mendampingimu lebih akrab.'}
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            {step === 1 && (
              <View style={styles.fieldsGroup}>
                <View>
                  <Text style={styles.fieldLabel}>Nama lengkap</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Misalnya, Natasya Zahirah"
                    placeholderTextColor="#A0948E"
                    value={name}
                    onChangeText={setName}
                  />
                </View>

                <View>
                  <Text style={styles.fieldLabel}>Usia</Text>
                  <View style={styles.suffixInputWrapper}>
                    <TextInput
                      style={styles.suffixInput}
                      placeholder="22"
                      placeholderTextColor="#A0948E"
                      keyboardType="numeric"
                      value={age}
                      onChangeText={(val) => setNameAge(val)}
                    />
                    <Text style={styles.inputSuffix}>tahun</Text>
                  </View>
                </View>

                <View>
                  <Text style={styles.fieldLabel}>Jenis kelamin</Text>
                  <View style={styles.genderRow}>
                    <TouchableOpacity
                      style={[
                        styles.choiceBtn,
                        gender === 'female' && styles.choiceBtnActive,
                        { flex: 1 },
                      ]}
                      activeOpacity={0.8}
                      onPress={() => setGender('female')}
                    >
                      <Text
                        style={[
                          styles.choiceBtnText,
                          gender === 'female' && styles.choiceBtnTextActive,
                        ]}
                      >
                        Perempuan
                      </Text>
                      <View
                        style={[
                          styles.checkCircle,
                          gender === 'female' && styles.checkCircleActive,
                        ]}
                      >
                        {gender === 'female' && (
                          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                        )}
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.choiceBtn,
                        gender === 'male' && styles.choiceBtnActive,
                        { flex: 1 },
                      ]}
                      activeOpacity={0.8}
                      onPress={() => setGender('male')}
                    >
                      <Text
                        style={[
                          styles.choiceBtnText,
                          gender === 'male' && styles.choiceBtnTextActive,
                        ]}
                      >
                        Laki-laki
                      </Text>
                      <View
                        style={[
                          styles.checkCircle,
                          gender === 'male' && styles.checkCircleActive,
                        ]}
                      >
                        {gender === 'male' && (
                          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                        )}
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {step === 2 && (
              <View style={styles.fieldsGroup}>
                <Text style={styles.questionText}>
                  Apakah kamu punya keturunan diabetes di keluarga?
                </Text>

                <TouchableOpacity
                  style={[
                    styles.choiceBtn,
                    hasDiabetesHistory === true && styles.choiceBtnActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setHasDiabetesHistory(true)}
                >
                  <Text
                    style={[
                      styles.choiceBtnText,
                      hasDiabetesHistory === true && styles.choiceBtnTextActive,
                    ]}
                  >
                    Ya, ada
                  </Text>
                  <View
                    style={[
                      styles.checkCircle,
                      hasDiabetesHistory === true && styles.checkCircleActive,
                    ]}
                  >
                    {hasDiabetesHistory === true && (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    )}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.choiceBtn,
                    hasDiabetesHistory === false && styles.choiceBtnActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setHasDiabetesHistory(false)}
                >
                  <Text
                    style={[
                      styles.choiceBtnText,
                      hasDiabetesHistory === false && styles.choiceBtnTextActive,
                    ]}
                  >
                    Tidak ada
                  </Text>
                  <View
                    style={[
                      styles.checkCircle,
                      hasDiabetesHistory === false && styles.checkCircleActive,
                    ]}
                  >
                    {hasDiabetesHistory === false && (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {step === 3 && (
              <View style={styles.fieldsGroup}>
                <Text style={styles.questionText}>
                  Apakah kamu rajin berolahraga?
                </Text>

                {(
                  [
                    { key: 'rare', label: 'Jarang' },
                    { key: 'moderate', label: 'Cukup Rutin' },
                    { key: 'active', label: 'Sangat Rajin' },
                  ] as { key: ExerciseFreq; label: string }[]
                ).map((opt) => {
                  const isActive = exerciseFreq === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      style={[styles.choiceBtn, isActive && styles.choiceBtnActive]}
                      activeOpacity={0.8}
                      onPress={() => setExerciseFreq(opt.key)}
                    >
                      <Text
                        style={[
                          styles.choiceBtnText,
                          isActive && styles.choiceBtnTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                      <View
                        style={[
                          styles.checkCircle,
                          isActive && styles.checkCircleActive,
                        ]}
                      >
                        {isActive && (
                          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {step === 4 && (
              <View style={styles.fieldsGroup}>
                <Text style={styles.questionText}>
                  Apakah kamu sedang menjalani program diet?
                </Text>

                <TouchableOpacity
                  style={[
                    styles.choiceBtn,
                    isDieting === true && styles.choiceBtnActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setIsDieting(true)}
                >
                  <Text
                    style={[
                      styles.choiceBtnText,
                      isDieting === true && styles.choiceBtnTextActive,
                    ]}
                  >
                    Ya, sedang diet
                  </Text>
                  <View
                    style={[
                      styles.checkCircle,
                      isDieting === true && styles.checkCircleActive,
                    ]}
                  >
                    {isDieting === true && (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    )}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.choiceBtn,
                    isDieting === false && styles.choiceBtnActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setIsDieting(false)}
                >
                  <Text
                    style={[
                      styles.choiceBtnText,
                      isDieting === false && styles.choiceBtnTextActive,
                    ]}
                  >
                    Tidak
                  </Text>
                  <View
                    style={[
                      styles.checkCircle,
                      isDieting === false && styles.checkCircleActive,
                    ]}
                  >
                    {isDieting === false && (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {step === 5 && (
              <View style={styles.fieldsGroup}>
                <View>
                  <Text style={styles.fieldLabel}>Nama panggilan</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Misalnya, Natasya"
                    placeholderTextColor="#A0948E"
                    value={nickname}
                    onChangeText={setNickname}
                    autoFocus
                  />
                  <Text style={styles.helperText}>
                    Nama ini akan digunakan oleh Mimo saat menyapamu di halaman utama dan laporan kesehatan harian.
                  </Text>
                </View>
              </View>
            )}
          </View>
        </Animated.View>

          {/* Navigation Buttons */}
          <View style={styles.bottomButtonsRow}>
            <TouchableOpacity
              style={[
                styles.nextBtn,
                !canContinue && styles.nextBtnDisabled,
                { flex: 1 },
              ]}
              activeOpacity={0.85}
              disabled={!canContinue}
              onPress={handleNext}
            >
              <Text style={styles.nextBtnText}>
                {step === 5 ? 'Hitung Batas Gulaku ✨' : 'Lanjut'}
              </Text>
              <Ionicons
                name={step === 5 ? 'sparkles' : 'arrow-forward'}
                size={18}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  function setNameAge(val: string) {
    const numeric = val.replace(/\D/g, '').slice(0, 3);
    setAge(numeric);
  }
};

const styles = StyleSheet.create({
  questionAnimatedContainer: {
    width: '100%',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFDF7',
  },
  keyboardContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    minHeight: '100%',
  },
  header: {
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#EFE7DA',
    shadowColor: 'rgba(83, 65, 56, 0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#B8F2E6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  brandName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#403936',
  },
  stepBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    shadowColor: 'rgba(83, 65, 56, 0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7D706A',
  },
  progressBarTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F0E7DF',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: '#A8E6CF',
  },
  titleSection: {
    marginBottom: 20,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#188F7B',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#403936',
    lineHeight: 32,
  },
  sectionDesc: {
    fontSize: 13,
    lineHeight: 18,
    color: '#7D706A',
    marginTop: 6,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 20,
    shadowColor: 'rgba(86, 71, 61, 0.09)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 5,
    marginBottom: 28,
  },
  fieldsGroup: {
    gap: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#403936',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFDF7',
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#403936',
  },
  helperText: {
    fontSize: 12,
    lineHeight: 16,
    color: '#8A7B74',
    marginTop: 6,
  },
  suffixInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDF7',
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
    borderRadius: 16,
    paddingHorizontal: 14,
  },
  suffixInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#403936',
  },
  inputSuffix: {
    fontSize: 13,
    fontWeight: '700',
    color: '#A0958F',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 10,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#403936',
    lineHeight: 22,
    marginBottom: 4,
  },
  choiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFDF7',
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  choiceBtnActive: {
    borderColor: '#74CDB5',
    backgroundColor: '#E9FAF4',
  },
  choiceBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6D625D',
  },
  choiceBtnTextActive: {
    color: '#176E60',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EEE6DF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleActive: {
    backgroundColor: '#74CDB5',
  },
  bottomButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 'auto',
  },
  backBtn: {
    borderWidth: 1.5,
    borderColor: '#E8DED6',
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6D625D',
  },
  nextBtn: {
    backgroundColor: '#403936',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: 'rgba(64, 57, 54, 0.2)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  nextBtnDisabled: {
    opacity: 0.4,
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
