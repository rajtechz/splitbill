import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../app/navigation/types';
import { useTheme } from '../../../theme';
import { useAuthStore } from '../../../store/useAuthStore';
import { AppHeader } from '../../../components/common/AppHeader';
import { Button } from '../../../components/buttons/Button';
import { CurrencySelector } from '../../../components/inputs/CurrencySelector';
import { CurrencyCode } from '../../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { currentUser, updateUser } = useAuthStore();

  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(currentUser?.phoneNumber || '');
  const [currency, setCurrency] = useState<CurrencyCode>(currentUser?.defaultCurrency || 'INR');
  const [saving, setSaving] = useState(false);

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
      defaultCurrency: currency,
    });
    setSaving(false);
    navigation.goBack();
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader title="Edit Profile" showBack onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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

        <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 6 }]}>
          DEFAULT CURRENCY
        </Text>
        <CurrencySelector selectedCurrency={currency} onSelect={setCurrency} />

        <Button
          title="Save Profile"
          onPress={handleSave}
          loading={saving}
          style={{ marginTop: spacing.xl }}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  input: {
    height: 48,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
});

