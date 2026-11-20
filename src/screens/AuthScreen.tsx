import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../constants/colors';
import { Mascot } from '../components/Mascot';
import { getClient } from '../services/supabase';
import { setAuthUser } from '../services/storage';

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
  const [nickname, setNickname] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
      if (!nickname.trim()) {
        setErrorMsg('Mohon masukkan nama panggilanmu untuk sapaan.');
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

    setIsLoading(true);
    const supabase = getClient();

    try {
      if (mode === 'signup') {
        // Sign up logic
        let userId = 'user_' + Date.now();
        if (supabase) {
          const { data, error } = await supabase.auth.signUp({
            email: email.trim(),
            password: password,
            options: {
              data: {
                name: fullName.trim(),
                nickname: nickname.trim(),
              },
            },
          });
          if (error) {
            console.warn('Supabase auth notice:', error.message);
          } else if (data.user) {
            userId = data.user.id;
          }
        }

        const authData = {
          email: email.trim(),
          id: userId,
          name: fullName.trim(),
          nickname: nickname.trim(),
        };
        await setAuthUser(authData);
        setIsLoading(false);
        onStartSignUp(authData);
      } else {
        // Login logic
        let userId = 'user_default';
        let userName = 'Teman Manis';
        let userNick = 'Manis';

        if (supabase) {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password,
          });
          if (error && error.message.includes('Invalid login credentials')) {
            setErrorMsg('Email atau kata sandi tidak cocok.');
            setIsLoading(false);
            return;
          } else if (data.user) {
            userId = data.user.id;
            userName = data.user.user_metadata?.name || 'Teman Manis';
            userNick = data.user.user_metadata?.nickname || userName.split(' ')[0] || 'Manis';
          }
        }

        const authData = {
          email: email.trim(),
          id: userId,
          name: userName,
          nickname: userNick,
        };
        await setAuthUser(authData);
        setIsLoading(false);
        onSuccessLogin(authData);
      }
    } catch (e: any) {
      setIsLoading(false);
      // Fallback for seamless offline demo
      const fallbackUser = {
        email: email.trim(),
        id: 'user_' + Date.now(),
        name: fullName.trim() || 'Teman Manis',
        nickname: nickname.trim() || (fullName.trim() ? fullName.trim().split(' ')[0] : 'Manis'),
      };
      await setAuthUser(fallbackUser);
      if (mode === 'signup') {
        onStartSignUp(fallbackUser);
      } else {
        onSuccessLogin(fallbackUser);
      }
    }
  };

  const handleGuestMode = async () => {
    const guestUser = {
      email: 'tamu@gulamate.id',
      id: 'guest_' + Date.now(),
      name: 'Tamu Sehat',
      nickname: 'Tamu',
    };
    await setAuthUser(guestUser);
    onStartSignUp(guestUser);
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
              onPress={() => {
                setMode('signup');
                setErrorMsg('');
              }}
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
              onPress={() => {
                setMode('login');
                setErrorMsg('');
              }}
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

          {/* Form Card */}
          <View style={[styles.formCard, Shadows.card]}>
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
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nama Lengkap</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="person-outline" size={18} color={Colors.textMuted} />
                    <TextInput
                      style={styles.input}
                      placeholder="Misal: Natasya Zahra"
                      placeholderTextColor={Colors.textMuted}
                      value={fullName}
                      onChangeText={setFullName}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.labelWithHintRow}>
                    <Text style={styles.label}>Nama Panggilan</Text>
                    <Text style={styles.labelHint}>(untuk sapaan "Halo ...!")</Text>
                  </View>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="sparkles-outline" size={18} color={Colors.primaryDark} />
                    <TextInput
                      style={styles.input}
                      placeholder="Misal: Natasya, Tasya, Rara"
                      placeholderTextColor={Colors.textMuted}
                      value={nickname}
                      onChangeText={setNickname}
                    />
                  </View>
                </View>
              </>
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

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>atau</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.guestBtn}
              activeOpacity={0.8}
              onPress={handleGuestMode}
            >
              <Ionicons name="flash-outline" size={16} color={Colors.primaryDark} />
              <Text style={styles.guestBtnText}>Masuk sebagai Tamu</Text>
            </TouchableOpacity>
          </View>
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#F0E8DD',
  },
  dividerText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  guestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F7',
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#FFD1DC',
    gap: 8,
  },
  guestBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
});
