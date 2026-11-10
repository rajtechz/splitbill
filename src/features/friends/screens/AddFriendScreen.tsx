import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  Share,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../app/navigation/types';
import { useTheme } from '../../../theme';
import { useAppStore } from '../../../store/useAppStore';
import { AppHeader } from '../../../components/common/AppHeader';
import { Button } from '../../../components/buttons/Button';
import { Icon } from '../../../components/common/Icon';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const AddFriendScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { addFriend } = useAppStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!name.trim()) {
      setError('Please enter a name');
      return;
    }
    if (!email.trim() && !phoneNumber.trim()) {
      setError('Please provide at least an email or phone number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const created = await addFriend({
        userId: `usr_${Date.now()}`,
        name: name.trim(),
        email: email.trim() || `${name.trim().toLowerCase().replace(/\s+/g, '.')}@example.com`,
        phoneNumber: phoneNumber.trim() || undefined,
        currency: 'INR',
      });

      navigation.replace('FriendDetails', { friendId: created.id });
    } catch (e: any) {
      setError(e.message || 'Failed to add friend');
      setLoading(false);
    }
  };

  const handleShareInvite = async () => {
    try {
      await Share.share({
        message: 'Join me on SplitMate to effortlessly track and split group expenses: https://splitmate.app/invite',
      });
    } catch {}
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader title="Add a Friend" showBack onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Invite link banner */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleShareInvite}
          style={[
            styles.inviteCard,
            {
              backgroundColor: colors.primaryLight,
              borderRadius: borderRadius.lg,
              padding: spacing.md,
              marginBottom: spacing.xl,
            },
          ]}
        >
          <View style={[styles.inviteIcon, { backgroundColor: colors.primary }]}>
            <Icon name="share" size={20} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[typography.titleMedium, { color: colors.primary }]}>
              Invite friends via link
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
              Share your custom invite link via WhatsApp, SMS, or Slack
            </Text>
          </View>
        </TouchableOpacity>

        <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 6 }]}>
          FULL NAME *
        </Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Maya Sharma"
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            typography.bodyMedium,
            {
              backgroundColor: colors.surface,
              borderColor: error && !name.trim() ? colors.danger : colors.border,
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
          placeholder="maya.sharma@example.com"
          placeholderTextColor={colors.textMuted}
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
          PHONE NUMBER (OPTIONAL)
        </Text>
        <TextInput
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          placeholder="+91 98765 43210"
          placeholderTextColor={colors.textMuted}
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

        {error && (
          <Text style={[typography.caption, { color: colors.danger, marginBottom: 12 }]}>
            {error}
          </Text>
        )}

        <Button title="Save Friend" onPress={handleAdd} loading={loading} />
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
  inviteCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inviteIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    height: 48,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
});

