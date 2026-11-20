import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../constants/colors';
import { UserProfile } from '../types';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { AvatarPickerModal } from '../components/AvatarPickerModal';

interface ProfileScreenProps {
  profile: UserProfile;
  activeDate: string;
  onEditProfile: () => void;
  onResetAllData: () => void;
  onLogout: () => void;
  onUpdateProfile: (updatedProfile: UserProfile) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  profile,
  activeDate,
  onEditProfile,
  onResetAllData,
  onLogout,
  onUpdateProfile,
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  const limit = profile.dailySugarLimit || 50;
  const initialLetter = (profile.name?.trim()?.[0] || 'M').toUpperCase();

  const exerciseLabel =
    profile.exerciseFreq === 'active'
      ? 'Sangat Rajin'
      : profile.exerciseFreq === 'moderate'
      ? 'Cukup Rutin'
      : 'Jarang';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Avatar & Change Photo Button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.avatarWrapper}
            activeOpacity={0.8}
            onPress={() => setIsAvatarModalOpen(true)}
          >
            <View style={styles.avatarCircle}>
              {profile.avatarUri ? (
                <Image source={{ uri: profile.avatarUri }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{initialLetter}</Text>
              )}
            </View>
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={13} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <Text style={styles.headerSub}>Teman sehat Mimo</Text>
            <Text style={styles.headerName}>{profile.name}</Text>
            <TouchableOpacity
              style={styles.changePhotoBtn}
              activeOpacity={0.7}
              onPress={() => setIsAvatarModalOpen(true)}
            >
              <Ionicons name="pencil" size={12} color="#188F7B" />
              <Text style={styles.changePhotoText}>Ganti Foto Profil</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Limit Dark Card */}
        <View style={styles.heroLimitCard}>
          {/* Decorative circle */}
          <View style={styles.heroCircleDeco} />

          <Text style={styles.heroLimitSubtitle}>Batas gula harianmu</Text>
          <View style={styles.heroLimitRow}>
            <Text style={styles.heroLimitNumber}>{limit}</Text>
            <Text style={styles.heroLimitUnit}>gram / hari</Text>
          </View>
          <Text style={styles.heroLimitDesc}>
            Dihitung dari profil kesehatan & gaya hidupmu, dengan batas minimal aman 25 gram.
          </Text>
        </View>

        {/* Summary Card */}
        <View style={[styles.sectionCard, Shadows.card]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ringkasan dirimu</Text>
            <TouchableOpacity onPress={onEditProfile} activeOpacity={0.7}>
              <Text style={styles.editBtnText}>Edit jawaban</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.rowItem}>
            <Text style={styles.rowLabel}>Nama lengkap</Text>
            <Text style={styles.rowVal}>{profile.name}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.rowItem}>
            <Text style={styles.rowLabel}>Nama panggilan</Text>
            <Text style={styles.rowVal}>
              {profile.nickname || (profile.name?.trim() ? profile.name.trim().split(' ')[0] : 'Teman')}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.rowItem}>
            <Text style={styles.rowLabel}>Usia</Text>
            <Text style={styles.rowVal}>{profile.age} tahun</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.rowItem}>
            <Text style={styles.rowLabel}>Jenis kelamin</Text>
            <Text style={styles.rowVal}>
              {profile.gender === 'female' ? 'Perempuan' : 'Laki-laki'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.rowItem}>
            <Text style={styles.rowLabel}>Riwayat keluarga</Text>
            <Text style={styles.rowVal}>
              {profile.hasDiabetesHistory ? 'Ada' : 'Tidak ada'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.rowItem}>
            <Text style={styles.rowLabel}>Olahraga</Text>
            <Text style={styles.rowVal}>{exerciseLabel}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.rowItem}>
            <Text style={styles.rowLabel}>Program diet</Text>
            <Text style={styles.rowVal}>{profile.isDieting ? 'Ya' : 'Tidak'}</Text>
          </View>
        </View>

        {/* Account Actions */}
        <View style={styles.actionsGroup}>
          <TouchableOpacity
            style={styles.resetBtn}
            activeOpacity={0.8}
            onPress={() => setShowResetConfirm(true)}
          >
            <Ionicons name="trash-outline" size={18} color="#E53E3E" />
            <Text style={styles.resetBtnText}>Reset Semua Data</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutBtn}
            activeOpacity={0.8}
            onPress={() => setShowLogoutConfirm(true)}
          >
            <Ionicons name="log-out-outline" size={18} color="#7D706A" />
            <Text style={styles.logoutBtnText}>Keluar Akun</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.disclaimerText}>
          GulaMate membantu memantau kebiasaan hidup sehat, bukan pengganti diagnosis medis dokter.
        </Text>
      </ScrollView>

      {/* Avatar Picker Modal */}
      <AvatarPickerModal
        visible={isAvatarModalOpen}
        currentAvatarUri={profile.avatarUri}
        userName={profile.name}
        onClose={() => setIsAvatarModalOpen(false)}
        onSaveAvatar={(uri) => {
          onUpdateProfile({
            ...profile,
            avatarUri: uri,
          });
        }}
      />

      {/* Confirmation Modals */}
      <ConfirmationModal
        visible={showResetConfirm}
        title="Reset Semua Data?"
        message="Semua riwayat catatan makanan, streak, dan pengaturan akan dihapus dan kembali bersih."
        confirmLabel="Hapus Semua"
        cancelLabel="Batal"
        isDestructive
        onConfirm={() => {
          setShowResetConfirm(false);
          onResetAllData();
        }}
        onCancel={() => setShowResetConfirm(false)}
      />

      <ConfirmationModal
        visible={showLogoutConfirm}
        title="Keluar dari Akun?"
        message="Kamu bisa masuk kembali kapan saja untuk melanjutkan pemantauan asupan gula."
        confirmLabel="Keluar"
        cancelLabel="Batal"
        isDestructive
        onConfirm={() => {
          setShowLogoutConfirm(false);
          onLogout();
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFDF7',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 26,
    backgroundColor: '#A8E6CF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...Shadows.soft,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarEmoji: {
    fontSize: 34,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#176E60',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#188F7B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  headerInfo: {
    flex: 1,
  },
  headerSub: {
    fontSize: 12,
    color: '#8D7E77',
    marginBottom: 2,
  },
  headerName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#403936',
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  changePhotoText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#188F7B',
  },
  heroLimitCard: {
    backgroundColor: '#403936',
    borderRadius: 28,
    padding: 22,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  heroCircleDeco: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(168, 230, 207, 0.15)',
  },
  heroLimitSubtitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#C9BDB7',
    marginBottom: 6,
  },
  heroLimitRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 10,
  },
  heroLimitNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 52,
  },
  heroLimitUnit: {
    fontSize: 14,
    fontWeight: '700',
    color: '#C9BDB7',
    marginBottom: 6,
  },
  heroLimitDesc: {
    fontSize: 12,
    lineHeight: 18,
    color: '#E8DEDA',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#403936',
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#188F7B',
  },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  rowLabel: {
    fontSize: 13,
    color: '#8D7E77',
  },
  rowVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#403936',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1EAE5',
  },
  actionsGroup: {
    gap: 10,
    marginBottom: 20,
  },
  resetBtn: {
    backgroundColor: '#FFF5F5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 18,
    paddingVertical: 14,
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E53E3E',
  },
  logoutBtn: {
    backgroundColor: '#F5F2EF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 18,
    paddingVertical: 14,
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7D706A',
  },
  disclaimerText: {
    fontSize: 11,
    lineHeight: 16,
    color: '#A2958E',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
});
