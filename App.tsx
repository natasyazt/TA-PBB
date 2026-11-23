import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from './src/constants/colors';
import { FoodLog, SupabaseConfig, UserProfile } from './src/types';
import {
  getAuthUser,
  setAuthUser,
  getUserProfile,
  saveUserProfile,
  getAllFoodLogs,
  getActiveDate,
  addFoodLog,
  deleteFoodLog,
  resetAllData,
  findRegisteredAccount,
  updateAccountProfile,
} from './src/services/storage';
import { initSupabase, getSupabaseConfig } from './src/services/supabase';
import { AuthScreen } from './src/screens/AuthScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { StatsScreen } from './src/screens/StatsScreen';
import { CalendarScreen } from './src/screens/CalendarScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { AddFoodModal } from './src/components/AddFoodModal';
import { Mascot } from './src/components/Mascot';

type TabName = 'home' | 'stats' | 'calendar' | 'profile';

export default function App() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authUser, setAuthUserState] = useState<{
    email: string;
    id: string;
    name?: string;
    nickname?: string;
  } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [allLogs, setAllLogs] = useState<FoodLog[]>([]);
  const [activeDate, setActiveDate] = useState<string>('');
  const [currentTab, setCurrentTab] = useState<TabName>('home');

  // Modals & sub-flows
  const [isSigningUp, setIsSigningUp] = useState<boolean>(false);
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [targetAddDate, setTargetAddDate] = useState<string>('');
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>({
    url: '',
    anonKey: '',
    isConnected: false,
  });

  // Animation for smooth tab transitions (Home <-> Riwayat <-> Kalender <-> Profil)
  const tabFadeAnim = useRef(new Animated.Value(1)).current;
  const tabSlideAnim = useRef(new Animated.Value(0)).current;
  const tabScaleAnim = useRef(new Animated.Value(1)).current;

  // Animation for entering main dashboard from Login / Auth
  const dashboardFadeAnim = useRef(new Animated.Value(0)).current;
  const dashboardSlideAnim = useRef(new Animated.Value(20)).current;

  // Trigger tab switch animation
  useEffect(() => {
    tabFadeAnim.setValue(0);
    tabSlideAnim.setValue(12);
    tabScaleAnim.setValue(0.985);

    Animated.parallel([
      Animated.timing(tabFadeAnim, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(tabSlideAnim, {
        toValue: 0,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(tabScaleAnim, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  }, [currentTab]);

  // Trigger dashboard entrance animation on login
  useEffect(() => {
    if (authUser && profile?.isOnboarded && !isSigningUp && !isEditingProfile) {
      dashboardFadeAnim.setValue(0);
      dashboardSlideAnim.setValue(20);
      Animated.parallel([
        Animated.timing(dashboardFadeAnim, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(dashboardSlideAnim, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    }
  }, [authUser, profile?.isOnboarded, isSigningUp, isEditingProfile]);

  const loadData = useCallback(async () => {
    try {
      await initSupabase();
      const sbCfg = await getSupabaseConfig();
      setSupabaseConfig(sbCfg);

      const [storedAuth, loadedProfile, loadedLogs, loadedDate] = await Promise.all([
        getAuthUser(),
        getUserProfile(),
        getAllFoodLogs(),
        getActiveDate(),
      ]);

      setAuthUserState(storedAuth);
      setProfile(loadedProfile);
      setAllLogs(loadedLogs);
      setActiveDate(loadedDate);
    } catch (e) {
      console.error('Failed to load GulaMate data:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSuccessLogin = async (user: {
    email: string;
    id: string;
    name?: string;
    nickname?: string;
  }) => {
    setAuthUserState(user);
    const account = await findRegisteredAccount(user.email);
    if (account?.profile && account.profile.isOnboarded) {
      await saveUserProfile(account.profile);
      setProfile(account.profile);
    } else {
      const existingProfile = await getUserProfile();
      if (user.name && user.name !== 'Teman Manis') {
        existingProfile.name = user.name;
      }
      if (user.nickname) {
        existingProfile.nickname = user.nickname;
      }
      existingProfile.email = user.email;
      existingProfile.id = user.id;
      await saveUserProfile(existingProfile);
      setProfile(existingProfile);
    }
    setIsSigningUp(false);
  };

  const handleStartSignUp = (user: {
    email: string;
    id: string;
    name: string;
    nickname?: string;
  }) => {
    setAuthUserState(user);
    setIsSigningUp(true);
  };

  const handleCompleteOnboarding = async (newProfile: UserProfile) => {
    if (authUser) {
      newProfile.id = authUser.id;
      newProfile.email = authUser.email;
      if (authUser.nickname) {
        newProfile.nickname = authUser.nickname;
      }
    }
    newProfile.isOnboarded = true;
    await saveUserProfile(newProfile);
    if (authUser?.email) {
      await updateAccountProfile(authUser.email, newProfile);
    }
    setProfile(newProfile);
    setIsSigningUp(false);
    setIsEditingProfile(false);
  };

  const handleLogout = async () => {
    await setAuthUser(null);
    setAuthUserState(null);
    setIsSigningUp(false);
    setIsEditingProfile(false);
  };

  const handleAddFood = async (item: Omit<FoodLog, 'id' | 'createdAt'>) => {
    const { updatedProfile } = await addFoodLog(item);
    const refreshedLogs = await getAllFoodLogs();
    setAllLogs(refreshedLogs);
    setProfile(updatedProfile);
  };

  const handleDeleteFood = async (id: string) => {
    const updated = await deleteFoodLog(id);
    setAllLogs(updated);
    const refreshedProfile = await getUserProfile();
    setProfile(refreshedProfile);
  };

  const handleUpdateProfile = async (updatedProfile: UserProfile) => {
    await saveUserProfile(updatedProfile);
    setProfile(updatedProfile);
  };

  const handleResetData = async () => {
    setIsLoading(true);
    await resetAllData();
    await loadData();
    setCurrentTab('home');
  };

  const handleOpenAddForDate = (dateStr: string) => {
    setTargetAddDate(dateStr);
    setIsAddModalOpen(true);
  };

  const handleQuickLogWater = async () => {
    await handleAddFood({
      date: activeDate,
      name: 'Air Mineral (1 Gelas)',
      sugarGrams: 0,
      portion: 1,
      category: 'minuman',
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      notes: 'Bebas gula & menghidrasi tubuh',
    });
  };

  // Loading Screen
  if (isLoading || !profile) {
    return (
      <View style={styles.loadingContainer}>
        <Mascot status="optimal" size={130} />
        <Text style={styles.loadingTitle}>GulaMate</Text>
        <Text style={styles.loadingSubtitle}>Menyiapkan teman sehat manismu...</Text>
        <ActivityIndicator
          size="small"
          color="#FF8F87"
          style={{ marginTop: 16 }}
        />
        <StatusBar style="dark" />
      </View>
    );
  }

  // 1. Not Authenticated -> Auth Screen
  if (!authUser) {
    return (
      <>
        <AuthScreen
          onSuccessLogin={handleSuccessLogin}
          onStartSignUp={handleStartSignUp}
        />
        <StatusBar style="dark" />
      </>
    );
  }

  // 2. Signing Up / First Time Questionnaire / Editing Profile
  if (isSigningUp || !profile.isOnboarded || isEditingProfile) {
    return (
      <>
        <OnboardingScreen
          initialProfile={{
            ...profile,
            id: authUser.id,
            email: authUser.email,
            name: authUser.name || profile.name,
            nickname: authUser.nickname || profile.nickname,
          }}
          onComplete={handleCompleteOnboarding}
          onBackToAuth={() => {
            setIsSigningUp(false);
            setIsEditingProfile(false);
            if (!profile.isOnboarded) {
              setAuthUserState(null);
            }
          }}
        />
        <StatusBar style="dark" />
      </>
    );
  }

  // 3. Main Dashboard
  const todayLogs = allLogs.filter((log) => log.date === activeDate);

  return (
    <View style={styles.rootWrapper}>
      <Animated.View
        style={[
          styles.dashboardContainer,
          {
            opacity: dashboardFadeAnim,
            transform: [{ translateY: dashboardSlideAnim }],
          },
        ]}
      >
        <SafeAreaView style={styles.appContainer}>
          <StatusBar style="dark" />

        {/* Screen Content with Smooth Page Animation */}
        <Animated.View
          style={[
            styles.screenContainer,
            {
              opacity: tabFadeAnim,
              transform: [
                { translateY: tabSlideAnim },
                { scale: tabScaleAnim },
              ],
            },
          ]}
        >
          {currentTab === 'home' && (
            <HomeScreen
              profile={profile}
              todayLogs={todayLogs}
              activeDate={activeDate}
              virtualDate={activeDate}
              onSelectDate={(newDate) => setActiveDate(newDate)}
              onOpenAddModal={() => handleOpenAddForDate(activeDate)}
              onDeleteLog={handleDeleteFood}
              onRefresh={loadData}
              onGoToSettings={() => setCurrentTab('profile')}
              onOpenCalendar={() => setCurrentTab('calendar')}
              onQuickLogWater={handleQuickLogWater}
            />
          )}

          {currentTab === 'stats' && (
            <StatsScreen
              profile={profile}
              allLogs={allLogs}
              activeDate={activeDate}
              onSelectDay={(date) => {
                setActiveDate(date);
                setCurrentTab('home');
              }}
              onAddFood={handleAddFood}
            />
          )}

          {currentTab === 'calendar' && (
            <CalendarScreen
              profile={profile}
              allLogs={allLogs}
              activeDate={activeDate}
              onOpenAddModalForDate={handleOpenAddForDate}
              onDeleteLog={handleDeleteFood}
            />
          )}

          {currentTab === 'profile' && (
            <ProfileScreen
              profile={profile}
              activeDate={activeDate}
              onEditProfile={() => setIsEditingProfile(true)}
              onResetAllData={handleResetData}
              onLogout={handleLogout}
              onUpdateProfile={handleUpdateProfile}
            />
          )}
        </Animated.View>

      {/* Symmetrical Bottom Navigation Bar (2 Left, Center FAB, 2 Right) */}
      <View style={styles.bottomNavContainer}>
        {/* Left Side Group (2 Tabs) */}
        <View style={styles.navSideGroup}>
          {/* Tab 1: Hari Ini */}
          <TouchableOpacity
            style={styles.navButton}
            activeOpacity={0.7}
            onPress={() => setCurrentTab('home')}
          >
            <View
              style={[
                styles.navIconBox,
                currentTab === 'home' && styles.navIconBoxActive,
              ]}
            >
              <Ionicons
                name={currentTab === 'home' ? 'home' : 'home-outline'}
                size={21}
                color={currentTab === 'home' ? '#188F7B' : '#A89B94'}
              />
            </View>
            <Text
              style={[
                styles.navLabel,
                currentTab === 'home' && styles.navLabelActive,
              ]}
            >
              Hari ini
            </Text>
          </TouchableOpacity>

          {/* Tab 2: Riwayat */}
          <TouchableOpacity
            style={styles.navButton}
            activeOpacity={0.7}
            onPress={() => setCurrentTab('stats')}
          >
            <View
              style={[
                styles.navIconBox,
                currentTab === 'stats' && styles.navIconBoxActive,
              ]}
            >
              <Ionicons
                name={currentTab === 'stats' ? 'stats-chart' : 'stats-chart-outline'}
                size={21}
                color={currentTab === 'stats' ? '#188F7B' : '#A89B94'}
              />
            </View>
            <Text
              style={[
                styles.navLabel,
                currentTab === 'stats' && styles.navLabelActive,
              ]}
            >
              Riwayat
            </Text>
          </TouchableOpacity>
        </View>

        {/* Center Floating Elevated (+) Button */}
        <View style={styles.centerFabAnchor}>
          <TouchableOpacity
            style={styles.centerFabButton}
            activeOpacity={0.85}
            onPress={() => handleOpenAddForDate(activeDate)}
          >
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Right Side Group (2 Tabs) */}
        <View style={styles.navSideGroup}>
          {/* Tab 3: Kalender */}
          <TouchableOpacity
            style={styles.navButton}
            activeOpacity={0.7}
            onPress={() => setCurrentTab('calendar')}
          >
            <View
              style={[
                styles.navIconBox,
                currentTab === 'calendar' && styles.navIconBoxActive,
              ]}
            >
              <Ionicons
                name={currentTab === 'calendar' ? 'calendar' : 'calendar-outline'}
                size={21}
                color={currentTab === 'calendar' ? '#188F7B' : '#A89B94'}
              />
            </View>
            <Text
              style={[
                styles.navLabel,
                currentTab === 'calendar' && styles.navLabelActive,
              ]}
            >
              Kalender
            </Text>
          </TouchableOpacity>

          {/* Tab 4: Profil */}
          <TouchableOpacity
            style={styles.navButton}
            activeOpacity={0.7}
            onPress={() => setCurrentTab('profile')}
          >
            <View
              style={[
                styles.navIconBox,
                currentTab === 'profile' && styles.navIconBoxActive,
              ]}
            >
              <Ionicons
                name={currentTab === 'profile' ? 'person' : 'person-outline'}
                size={21}
                color={currentTab === 'profile' ? '#188F7B' : '#A89B94'}
              />
            </View>
            <Text
              style={[
                styles.navLabel,
                currentTab === 'profile' && styles.navLabelActive,
              ]}
            >
              Profil
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  </Animated.View>

  {/* Add Food Modal with AI Auto-Estimation placed outside any transformed ancestor */}
  <AddFoodModal
    visible={isAddModalOpen}
    targetDate={targetAddDate || activeDate}
    onClose={() => setIsAddModalOpen(false)}
    onAddFood={handleAddFood}
  />
</View>
  );
}

const styles = StyleSheet.create({
  rootWrapper: {
    flex: 1,
    backgroundColor: '#FFFDF7',
  },
  dashboardContainer: {
    flex: 1,
    backgroundColor: '#FFFDF7',
  },
  appContainer: {
    flex: 1,
    backgroundColor: '#FFFDF7',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFDF7',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#403936',
    marginTop: 14,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: '#8D7E77',
    marginTop: 4,
  },
  screenContainer: {
    flex: 1,
  },
  // Symmetrical 2-Left, 1-Center, 2-Right Bottom Navigation Bar
  bottomNavContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderTopWidth: 1,
    borderTopColor: '#EEE4DC',
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 22 : 10,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navSideGroup: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  centerFabAnchor: {
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerFabButton: {
    width: 58,
    height: 58,
    borderRadius: 22,
    backgroundColor: '#FF8F87',
    borderWidth: 4,
    borderColor: '#FFFDF7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
    shadowColor: 'rgba(255, 143, 135, 0.45)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 8,
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 62,
  },
  navIconBox: {
    width: 44,
    height: 34,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  navIconBoxActive: {
    backgroundColor: '#E5F8F1',
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A89B94',
  },
  navLabelActive: {
    color: '#188F7B',
  },
});
