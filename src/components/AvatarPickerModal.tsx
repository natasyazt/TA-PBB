import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Shadows } from '../constants/colors';

interface AvatarPickerModalProps {
  visible: boolean;
  currentAvatarUri?: string;
  userName: string;
  onClose: () => void;
  onSaveAvatar: (avatarUri?: string) => void;
}

export const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({
  visible,
  currentAvatarUri,
  userName,
  onClose,
  onSaveAvatar,
}) => {
  const [selectedUri, setSelectedUri] = useState<string | undefined>(currentAvatarUri);

  React.useEffect(() => {
    setSelectedUri(currentAvatarUri);
  }, [visible, currentAvatarUri]);

  const handlePickFromGallery = async () => {
    try {
      if (Platform.OS === 'web') {
        if (typeof document !== 'undefined') {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = (e: any) => {
            const file = e.target?.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (event) => {
                const dataUrl = event.target?.result as string;
                if (dataUrl) {
                  setSelectedUri(dataUrl);
                }
              };
              reader.readAsDataURL(file);
            }
          };
          input.click();
        }
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            'Izin Diperlukan',
            'Izin akses galeri/foto diperlukan untuk memilih foto profil.'
          );
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          setSelectedUri(result.assets[0].uri);
        }
      }
    } catch (err) {
      console.warn('Gagal membuka galeri:', err);
    }
  };

  const handlePickFromCamera = async () => {
    try {
      if (Platform.OS === 'web') {
        handlePickFromGallery();
      } else {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            'Izin Diperlukan',
            'Izin kamera diperlukan untuk mengambil foto profil.'
          );
          return;
        }

        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          setSelectedUri(result.assets[0].uri);
        }
      }
    } catch (err) {
      console.warn('Gagal membuka kamera:', err);
    }
  };

  const handleRemovePhoto = () => {
    setSelectedUri(undefined);
  };

  const handleSave = () => {
    onSaveAvatar(selectedUri);
    onClose();
  };

  const initialLetter = (userName?.trim()?.[0] || 'M').toUpperCase();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalCard, Shadows.card]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>Foto Profil</Text>
              <Text style={styles.subtitle}>Pilih foto dari galeri atau kamera HP</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#7D706A" />
            </TouchableOpacity>
          </View>

          {/* Avatar Circle Display (Without any "Pratinjau" label) */}
          <View style={styles.avatarDisplayContainer}>
            <View style={styles.avatarCircle}>
              {selectedUri ? (
                <Image source={{ uri: selectedUri }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarInitial}>{initialLetter}</Text>
              )}
            </View>
          </View>

          {/* Action Buttons: Only from phone files/photos */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.galleryBtn}
              activeOpacity={0.8}
              onPress={handlePickFromGallery}
            >
              <Ionicons name="images-outline" size={20} color="#FFFFFF" />
              <Text style={styles.galleryBtnText}>Buka Galeri Foto HP</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cameraBtn}
              activeOpacity={0.8}
              onPress={handlePickFromCamera}
            >
              <Ionicons name="camera-outline" size={20} color="#403936" />
              <Text style={styles.cameraBtnText}>Ambil Foto dengan Kamera</Text>
            </TouchableOpacity>

            {selectedUri ? (
              <TouchableOpacity
                style={styles.removeBtn}
                activeOpacity={0.7}
                onPress={handleRemovePhoto}
              >
                <Ionicons name="trash-outline" size={16} color="#E53E3E" />
                <Text style={styles.removeBtnText}>Hapus Foto Profil</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Bottom Controls */}
          <View style={styles.bottomButtonsRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              activeOpacity={0.7}
              onPress={onClose}
            >
              <Text style={styles.cancelBtnText}>Batal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveBtn}
              activeOpacity={0.8}
              onPress={handleSave}
            >
              <Text style={styles.saveBtnText}>Simpan Foto</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFFDF7',
    width: '100%',
    maxWidth: 400,
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: '#EFE7DA',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#403936',
  },
  subtitle: {
    fontSize: 12,
    color: '#8D7E77',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3EDE4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarDisplayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 36,
    backgroundColor: '#B8F2E6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    ...Shadows.card,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    fontSize: 38,
    fontWeight: '800',
    color: '#176E60',
  },
  actionsContainer: {
    gap: 10,
    marginBottom: 14,
  },
  galleryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 18,
    gap: 10,
    ...Shadows.soft,
  },
  galleryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  cameraBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 13,
    borderRadius: 18,
    gap: 10,
    borderWidth: 1.5,
    borderColor: '#E4DAD0',
  },
  cameraBtnText: {
    color: '#403936',
    fontSize: 13,
    fontWeight: '700',
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
    marginTop: 2,
  },
  removeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E53E3E',
  },
  bottomButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0E8DD',
    paddingTop: 16,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 18,
    backgroundColor: '#F5F0E8',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7D706A',
  },
  saveBtn: {
    flex: 1.4,
    paddingVertical: 13,
    borderRadius: 18,
    backgroundColor: '#403936',
    alignItems: 'center',
    ...Shadows.soft,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
