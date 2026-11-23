import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../constants/colors';
import { Mascot } from '../components/Mascot';
import { getClient } from '../services/supabase';
import {
  setAuthUser,
  findRegisteredAccount,
  saveRegisteredAccount,
  getExistingProfileByEmail,
  RegisteredAccount,
} from '../services/storage';

interface AuthScreenProps {
  onSuccessLogin: (user: { email: string; id: string; name?: string; nickname?: string }) => void;
  onStartSignUp: (user: { email: string; id: string; name: string; nickname?: string }) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onSuccessLogin,
  onStartSignUp,
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Animated mode switch
  const formFadeAnim = useRef(new Animated.Value(1)).current;
  const formSlideAnim = useRef(new Animated.Value(0)).current;

  const handleSwitchMode = (newMode: 'login' | 'signup') => {
    if (newMode === mode) return;
    setErrorMsg('');
    formFadeAnim.setValue(0);
    formSlideAnim.setValue(newMode === 'login' ? -15 : 15);
    setMode(newMode);
    Animated.parallel([
      Animated.timing(formFadeAnim, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(formSlideAnim, {
        toValue: 0,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  };

  // Password validation checks
  const hasMinLength = password.length >= 6;
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password);
  const isPasswordSecure = hasMinLength && hasNumber && hasSymbol;

  const handleAuth = async () => {
    setErrorMsg('');
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Mohon isi email dan kata sandi.');
      return;
    }
    if (mode === 'signup') {
      if (!fullName.trim()) {
        setErrorMsg('Mohon masukkan nama lengkapmu.');
        return;
      }
    }
    if (!hasMinLength) {
      setErrorMsg('Kata sandi harus minimal 6 karakter.');
      return;
    }
    if (!hasNumber) {
      setErrorMsg('Kata sandi harus mengandung minimal 1 angka.');
      return;
    }
    if (!hasSymbol) {
      setErrorMsg('Kata sandi harus mengandung minimal 1 simbol (!@#$%^&*).');
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    setIsLoading(true);
    const supabase = getClient();

    try {
      if (mode === 'signup') {
        // 1. Check if email is already registered locally
        const existingLocal = await findRegisteredAccount(normalizedEmail);
        if (existingLocal) {
          setErrorMsg('Email ini sudah terdaftar. Silakan pilih tab "Masuk" untuk login.');
          setIsLoading(false);
          return;
        }

        let userId = 'user_' + Date.now();
        if (supabase) {
          try {
            const { data, error } = await supabase.auth.signUp({
              email: normalizedEmail,
              password: password,
              options: {
                data: {
                  name: fullName.trim(),
                },
              },
            });
            if (data?.user?.id) {
              userId = data.user.id;
            } else if (error) {
              console.warn('Supabase auth notice (using local storage fallback):', error.message);
            }
          } catch (sbErr) {
            console.warn('Supabase connection notice:', sbErr);
          }
        }

        // Always save account locally so user can always log back in reliably
        const newAccount: RegisteredAccount = {
          id: userId,
          email: normalizedEmail,
          password: password,
          name: fullName.trim(),
          createdAt: new Date().toISOString(),
        };
        await saveRegisteredAccount(newAccount);

        const authData = {
          email: normalizedEmail,
          id: userId,
          name: fullName.trim(),
          nickname: '',
        };
        await setAuthUser(authData);
        setIsLoading(false);
        onStartSignUp(authData);
      } else {
        // Mode === 'login'
        // Step 1: Check local registered accounts
        const localAccount = await findRegisteredAccount(normalizedEmail);
        if (localAccount) {
          if (localAccount.password !== password) {
            setErrorMsg('Kata sandi salah. Silakan coba lagi.');
            setIsLoading(false);
            return;
          }

          // Silent background sync with Supabase session if online
          if (supabase) {
            supabase.auth.signInWithPassword({
              email: normalizedEmail,
              password: password,
            }).catch(() => {});
          }

          const authData = {
            email: localAccount.email,
            id: localAccount.id,
            name: localAccount.name,
            nickname: localAccount.nickname || (localAccount.name ? localAccount.name.split(' ')[0] : 'Manis'),
          };
          await setAuthUser(authData);
          setIsLoading(false);
          onSuccessLogin(authData);
          return;
        }

        // Step 2: Check if this user previously registered on this device (migration fallback)
        const previousProfile = await getExistingProfileByEmail(normalizedEmail);
        if (previousProfile) {
          const migratedAccount: RegisteredAccount = {
            id: previousProfile.id || ('user_' + Date.now()),
            email: normalizedEmail,
            password: password,
            name: previousProfile.name || 'Teman Manis',
            nickname: previousProfile.nickname || 'Manis',
            createdAt: new Date().toISOString(),
            profile: previousProfile,
          };
          await saveRegisteredAccount(migratedAccount);

          const authData = {
            email: normalizedEmail,
            id: migratedAccount.id,
            name: migratedAccount.name,
            nickname: migratedAccount.nickname,
          };
          await setAuthUser(authData);
          setIsLoading(false);
          onSuccessLogin(authData);
          return;
        }

        // Step 3: Check Supabase online authentication
        if (supabase) {
          try {
            const { data, error } = await supabase.auth.signInWithPassword({
              email: normalizedEmail,
              password: password,
            });

            if (data?.user) {
              const userName = data.user.user_metadata?.name || 'Teman Manis';
              const userNick = data.user.user_metadata?.nickname || userName.split(' ')[0] || 'Manis';

              const newAccount: RegisteredAccount = {
                id: data.user.id,
                email: normalizedEmail,
                password: password,
                name: userName,
                nickname: userNick,
                createdAt: new Date().toISOString(),
              };
              await saveRegisteredAccount(newAccount);

              const authData = {
                email: normalizedEmail,
                id: data.user.id,
                name: userName,
                nickname: userNick,
              };
              await setAuthUser(authData);
              setIsLoading(false);
              onSuccessLogin(authData);
              return;
            }

            if (error) {
              if (error.message.includes('Invalid login credentials')) {
                setErrorMsg('Email atau kata sandi tidak cocok.');
                setIsLoading(false);
                return;
              }
              if (error.message.includes('Email not confirmed')) {
                // Email unconfirmed on Supabase free tier, but credentials matched
                const newAccount: RegisteredAccount = {
                  id: 'user_' + Date.now(),
                  email: normalizedEmail,
                  password: password,
                  name: 'Teman Manis',
                  nickname: 'Manis',
                  createdAt: new Date().toISOString(),
                };
                await saveRegisteredAccount(newAccount);
                const authData = {
                  email: normalizedEmail,
                  id: newAccount.id,
                  name: newAccount.name,
                  nickname: newAccount.nickname,
                };
                await setAuthUser(authData);
                setIsLoading(false);
                onSuccessLogin(authData);
                return;
              }
            }
          } catch (sbErr) {
            console.warn('Supabase signIn notice:', sbErr);
          }
        }

        // Step 4: Not found anywhere
        setErrorMsg('Akun dengan email ini belum terdaftar. Silakan pilih tab "Daftar Akun Baru".');
        setIsLoading(false);
      }
    } catch (e: any) {
      setIsLoading(false);
      setErrorMsg('Terjadi kesalahan saat memproses autentikasi. Silakan coba lagi.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header & Animated Mascot */}
          <View style={styles.topSection}>
            <Mascot status="optimal" size={135} />
            <Text style={styles.appTitle}>GulaMate</Text>
            <Text style={styles.appTagline}>
              Monitoring Asupan Gula Harian untuk Mencegah Diabetes
            </Text>
          </View>

          {/* Flo-style Segmented Control */}
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[
                styles.segmentBtn,
                mode === 'signup' && styles.segmentBtnActive,
              ]}
              activeOpacity={0.8}
              onPress={() => handleSwitchMode('signup')}
            >
              <Text
                style={[
                  styles.segmentText,
                  mode === 'signup' && styles.segmentTextActive,
                ]}
              >
                Daftar Akun Baru
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segmentBtn,
                mode === 'login' && styles.segmentBtnActive,
              ]}
              activeOpacity={0.8}
              onPress={() => handleSwitchMode('login')}
            >
              <Text
                style={[
                  styles.segmentText,
                  mode === 'login' && styles.segmentTextActive,
                ]}
              >
                Masuk
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Card with Smooth Transition Animation */}
          <Animated.View
            style={[
              styles.formCard,
              Shadows.card,
              {
                opacity: formFadeAnim,
                transform: [{ translateX: formSlideAnim }],
              },
            ]}
          >
            <Text style={styles.formTitle}>
              {mode === 'signup'
                ? 'Mulai Perjalanan Hidup Sehatmu'
                : 'Selamat Datang Kembali! 👋'}
            </Text>
            <Text style={styles.formSubtitle}>
              {mode === 'signup'
                ? 'Buat akun untuk personalisasi batas konsumsi gula harianmu'
                : 'Masuk untuk memantau asupan gula dan riwayat kesehatanmu'}
            </Text>

            {errorMsg.length > 0 && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color="#E53E3E" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {mode === 'signup' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nama Lengkap</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={18} color={Colors.textMuted} />
                  <TextInput
                    style={styles.input}
                    placeholder="Misal: Natasya Zahirah"
                    placeholderTextColor={Colors.textMuted}
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Alamat Email</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="nama@email.com"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Kata Sandi</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="Minimal 6 karakter, angka & simbol"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={Colors.textMuted}
                  />
                </TouchableOpacity>
              </View>

              {/* Real-time Password Requirements Checklist */}
              <View style={styles.passwordReqsContainer}>
                <View style={styles.reqItem}>
                  <Ionicons
                    name={hasMinLength ? 'checkmark-circle' : 'ellipse-outline'}
                    size={14}
                    color={hasMinLength ? '#188F7B' : '#A89B94'}
                  />
                  <Text style={[styles.reqText, hasMinLength && styles.reqTextValid]}>
                    Minimal 6 karakter
                  </Text>
                </View>
                <View style={styles.reqItem}>
                  <Ionicons
                    name={hasNumber ? 'checkmark-circle' : 'ellipse-outline'}
                    size={14}
                    color={hasNumber ? '#188F7B' : '#A89B94'}
                  />
                  <Text style={[styles.reqText, hasNumber && styles.reqTextValid]}>
                    Mengandung angka (0-9)
                  </Text>
                </View>
                <View style={styles.reqItem}>
                  <Ionicons
                    name={hasSymbol ? 'checkmark-circle' : 'ellipse-outline'}
                    size={14}
                    color={hasSymbol ? '#188F7B' : '#A89B94'}
                  />
                  <Text style={[styles.reqText, hasSymbol && styles.reqTextValid]}>
                    Mengandung simbol (!@#$%^&*)
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.submitBtn}
              activeOpacity={0.85}
              disabled={isLoading}
              onPress={handleAuth}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {mode === 'signup'
                    ? 'Lanjut ke Kuesioner Kesehatan ➔'
                    : 'Masuk ke GulaMate ✨'}
                </Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    alignItems: 'center',
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginTop: -8,
  },
  appTagline: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F3EDE4',
    borderRadius: 22,
    padding: 4,
    width: '100%',
    marginBottom: 18,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    borderRadius: 18,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    ...Shadows.soft,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  segmentTextActive: {
    color: Colors.primaryDark,
    fontWeight: '800',
  },
  formCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 22,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 18,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    padding: 10,
    borderRadius: 14,
    marginBottom: 14,
    gap: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#E53E3E',
    fontWeight: '600',
    flex: 1,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  labelWithHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  labelHint: {
    fontSize: 11,
    color: Colors.primaryDark,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF6F0',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#EFE7DA',
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  passwordReqsContainer: {
    backgroundColor: '#FAF6F0',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#EFE7DA',
  },
  reqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  reqText: {
    fontSize: 11,
    color: '#8D7E77',
    fontWeight: '600',
  },
  reqTextValid: {
    color: '#188F7B',
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    borderRadius: 22,
    alignItems: 'center',
    marginTop: 8,
    ...Shadows.soft,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
