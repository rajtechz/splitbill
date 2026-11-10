import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../app/navigation/types';
import { useTheme } from '../../../theme';
import { useAuthStore } from '../../../store/useAuthStore';
import { AppHeader } from '../../../components/common/AppHeader';
import { Button } from '../../../components/buttons/Button';
import { Avatar } from '../../../components/avatars/Avatar';
import { Icon } from '../../../components/common/Icon';
import { CurrencySelector } from '../../../components/inputs/CurrencySelector';
import { PhotoPickerModal } from '../../../components/modals/PhotoPickerModal';
import { locationService } from '../../../services/native/locationService';
import { CurrencyCode } from '../../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { currentUser, updateUser } = useAuthStore();

  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(currentUser?.phoneNumber || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl);
  const [currency, setCurrency] = useState<CurrencyCode>(currentUser?.defaultCurrency || 'INR');
  const [saving, setSaving] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const handleDetectLocation = async () => {
    setDetectingLocation(true);
    try {
      const res = await locationService.detectCountryAndCurrency();
      setCurrency(res.suggestedCurrency);
      Alert.alert(
        'Location Detected',
        `Country: ${res.countryName} (${res.countryCode})\nDefault currency automatically configured to ${res.suggestedCurrency} (${res.currencySymbol}).`
      );
    } catch {
      Alert.alert('Location Error', 'Unable to retrieve location. Please select currency manually.');
    } finally {
      setDetectingLocation(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Name cannot be empty');
      return;
    }
    setSaving(true);
    updateUser({
      name: name.trim(),
      email: email.trim(),
      phoneNumber: phoneNumber.trim() || undefined,
      avatarUrl,
      defaultCurrency: currency,
    });
    setSaving(false);
    navigation.goBack();
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader title="Edit Profile" showBack onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar Photo with Camera Badge */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowPhotoModal(true)}
            style={styles.avatarButton}
          >
            <Avatar name={name || 'User'} url={avatarUrl} size={88} />
            <View style={[styles.cameraBadge, { backgroundColor: colors.primary }]}>
              <Icon name="camera" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowPhotoModal(true)}
            style={{ marginTop: 8 }}
          >
            <Text style={[typography.buttonMedium, { color: colors.primary }]}>
              Change Profile Photo
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 6 }]}>
          FULL NAME *
        </Text>
        <TextInput
          value={name}
          onChangeText={setName}
          style={[
            styles.input,
            typography.bodyMedium,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: borderRadius.md,
              color: colors.textPrimary,
              marginBottom: 16,
            },
          ]}
        />

        <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 6 }]}>
          EMAIL ADDRESS
        </Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={[
            styles.input,
            typography.bodyMedium,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: borderRadius.md,
              color: colors.textPrimary,
              marginBottom: 16,
            },
          ]}
        />

        <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 6 }]}>
          PHONE NUMBER
        </Text>
        <TextInput
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          style={[
            styles.input,
            typography.bodyMedium,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: borderRadius.md,
              color: colors.textPrimary,
              marginBottom: 20,
            },
          ]}
        />

        {/* Currency header with Auto-detect Location button */}
        <View style={styles.currencyHeaderRow}>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            DEFAULT CURRENCY
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            disabled={detectingLocation}
            onPress={handleDetectLocation}
            style={[
              styles.locationDetectBtn,
              { backgroundColor: colors.primaryLight, borderRadius: borderRadius.full },
            ]}
          >
            {detectingLocation ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Icon name="location" size={12} color={colors.primary} />
                <Text
                  style={[
                    typography.caption,
                    { color: colors.primary, fontWeight: '700', marginLeft: 4 },
                  ]}
                >
                  Auto-detect from GPS
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <CurrencySelector selectedCurrency={currency} onSelect={setCurrency} />

        <Button
          title="Save Profile"
          onPress={handleSave}
          loading={saving}
          style={{ marginTop: spacing.xl }}
        />
      </ScrollView>

      {/* Photo Picker Modal */}
      <PhotoPickerModal
        visible={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        onSelectPhoto={uri => setAvatarUrl(uri)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarButton: {
    position: 'relative',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  input: {
    height: 48,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  currencyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationDetectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
});

