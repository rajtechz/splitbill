import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { useTheme } from '../../theme';
import { Icon } from '../common/Icon';
import { imagePickerService, PRESET_AVATARS } from '../../services/native/imagePickerService';

interface PhotoPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectPhoto: (uri: string) => void;
}

export const PhotoPickerModal: React.FC<PhotoPickerModalProps> = ({
  visible,
  onClose,
  onSelectPhoto,
}) => {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();

  const handleCamera = async () => {
    const granted = await imagePickerService.requestCameraPermission();
    if (!granted) {
      Alert.alert('Permission Required', 'Camera permission was denied. Please allow it in settings.');
      return;
    }
    // Set a fresh high-res photo URL
    const cameraUri = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop';
    onSelectPhoto(cameraUri);
    onClose();
  };

  const handleGallery = async () => {
    const granted = await imagePickerService.requestGalleryPermission();
    if (!granted) {
      Alert.alert('Permission Required', 'Photo library permission was denied. Please allow it in settings.');
      return;
    }
    const galleryUri = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop';
    onSelectPhoto(galleryUri);
    onClose();
  };

  const handlePickPreset = (uri: string) => {
    onSelectPhoto(uri);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={styles.overlay}>
        <TouchableOpacity
          activeOpacity={1}
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              borderTopLeftRadius: borderRadius.xl,
              borderTopRightRadius: borderRadius.xl,
              ...shadows.medium,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />
            <Text style={[typography.h3, { color: colors.textPrimary, marginTop: 8 }]}>
              Change Profile Photo
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
              Take a photo, choose from gallery, or select an avatar
            </Text>
          </View>

          {/* Action Options */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleCamera}
              style={[styles.actionBtn, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.lg }]}
            >
              <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
                <Icon name="camera" size={22} color={colors.primary} />
              </View>
              <Text style={[typography.bodyMedium, { color: colors.textPrimary, fontWeight: '700', marginTop: 8 }]}>
                Take Photo
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                Use Camera
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleGallery}
              style={[styles.actionBtn, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.lg }]}
            >
              <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
                <Icon name="image" size={22} color={colors.primary} />
              </View>
              <Text style={[typography.bodyMedium, { color: colors.textPrimary, fontWeight: '700', marginTop: 8 }]}>
                Photo Library
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                Choose photo
              </Text>
            </TouchableOpacity>
          </View>

          {/* Preset Avatars */}
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 16, marginBottom: 10, fontWeight: '700' }]}>
            OR CHOOSE PRESET AVATAR
          </Text>

          <View style={styles.avatarGrid}>
            {PRESET_AVATARS.map((uri, idx) => (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.7}
                onPress={() => handlePickPreset(uri)}
                style={styles.avatarItem}
              >
                <Image source={{ uri }} style={styles.avatarImg} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Cancel button */}
          <TouchableOpacity
            onPress={onClose}
            style={[styles.cancelBtn, { borderColor: colors.border, borderRadius: borderRadius.lg }]}
          >
            <Text style={[typography.buttonMedium, { color: colors.textSecondary }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    padding: 20,
    paddingBottom: 36,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  avatarItem: {
    padding: 2,
  },
  avatarImg: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E2E8F0',
  },
  cancelBtn: {
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
});

