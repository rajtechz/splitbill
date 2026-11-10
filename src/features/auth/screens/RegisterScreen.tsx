import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../app/navigation/types';
import { useTheme } from '../../../theme';
import { useAuthStore } from '../../../store/useAuthStore';
import { Button } from '../../../components/buttons/Button';
import { AppHeader } from '../../../components/common/AppHeader';
import { Icon } from '../../../components/common/Icon';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RegisterRouteProp = RouteProp<RootStackParamList, 'Register'>;

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RegisterRouteProp>();
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { register, isLoading } = useAuthStore();

  const initialEmail = route.params?.email || '';
  const initialPhone = route.params?.phone || '';
  const initialNotice = route.params?.notice || (initialEmail || initialPhone ? 'No account was found for your login details. Please register to create your account.' : null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);
  const [password, setPassword] = useState('');
  const [noticeMsg, setNoticeMsg] = useState<string | null>(initialNotice);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!name.trim()) {
      setErrorMsg('Full name is required');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('A valid email address is required');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      return;
    }

    setErrorMsg(null);
    const success = await register(name.trim(), email.trim(), phone.trim() || undefined, password);
    if (!success) {
      const err = useAuthStore.getState().error || 'Registration failed. Please try again.';
      setErrorMsg(err);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.screen, { backgroundColor: colors.background }]}
    >
      <AppHeader title="Create Account" showBack onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[typography.h2, { color: colors.textPrimary, marginBottom: 8 }]}>
          Join SplitMate
        </Text>
        <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginBottom: 20 }]}>
          Start splitting expenses with friends in seconds
        </Text>

        {noticeMsg && (
          <View
            style={[
              styles.noticeCard,
              {
                backgroundColor: colors.surfaceVariant,
                borderColor: colors.primary,
                borderRadius: borderRadius.md,
              },
            ]}
          >
            <Icon name="sparkles" size={18} color={colors.primary} />
            <Text
              style={[
                typography.caption,
                { color: colors.textPrimary, marginLeft: 10, flex: 1, lineHeight: 18 },
              ]}
            >
              {noticeMsg}
            </Text>
          </View>
        )}

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
              borderColor: colors.border,
              borderRadius: borderRadius.md,
              color: colors.textPrimary,
              marginBottom: 16,
            },
          ]}
        />

        <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 6 }]}>
          EMAIL ADDRESS *
        </Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="maya@example.com"
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
          value={phone}
          onChangeText={setPhone}
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
              marginBottom: 16,
            },
          ]}
        />

        <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 6 }]}>
          PASSWORD *
        </Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="At least 6 characters"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
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

        {errorMsg && (
          <Text style={[typography.caption, { color: colors.danger, marginBottom: 12 }]}>
            {errorMsg}
          </Text>
        )}

        <Button title="Create Account" onPress={handleRegister} loading={isLoading} />

        <View style={styles.footerRow}>
          <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>
            Already have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={[typography.bodyMedium, { color: colors.primary, fontWeight: '700' }]}>
              Log In
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  input: {
    height: 48,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
});

