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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../app/navigation/types';
import { useTheme } from '../../../theme';
import { useAuthStore } from '../../../store/useAuthStore';
import { Button } from '../../../components/buttons/Button';
import { Icon } from '../../../components/common/Icon';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { login, isLoading } = useAuthStore();

  const [mode, setMode] = useState<'email' | 'phone'>('email');
  const [identifier, setIdentifier] = useState('alex.johnson@example.com');
  const [password, setPassword] = useState('password123');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!identifier.trim()) {
      setErrorMsg(mode === 'email' ? 'Please enter your email' : 'Please enter your phone number');
      return;
    }
    setErrorMsg(null);

    const success = await login(identifier.trim(), password);
    if (!success) {
      setErrorMsg('Login failed. Please check your credentials.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.screen, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Brand Header */}
        <View style={styles.brandContainer}>
          <View style={[styles.brandLogo, { backgroundColor: colors.primary }]}>
            <Icon name="shield" size={32} color="#FFFFFF" />
          </View>
          <Text style={[typography.h1, { color: colors.textPrimary, marginTop: 16 }]}>
            SplitMate
          </Text>
          <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: 4 }]}>
            Effortless expense sharing with friends & groups
          </Text>
        </View>

        {/* Tab Switcher (Email vs Phone) */}
        <View style={[styles.tabBar, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.md }]}>
          <TouchableOpacity
            onPress={() => {
              setMode('email');
              setIdentifier('alex.johnson@example.com');
            }}
            style={[
              styles.tab,
              mode === 'email' && { backgroundColor: colors.surface, borderRadius: borderRadius.sm },
            ]}
          >
            <Text
              style={[
                typography.caption,
                { color: mode === 'email' ? colors.primary : colors.textSecondary, fontWeight: '700' },
              ]}
            >
              Email Login
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setMode('phone');
              setIdentifier('+91 98765 43210');
            }}
            style={[
              styles.tab,
              mode === 'phone' && { backgroundColor: colors.surface, borderRadius: borderRadius.sm },
            ]}
          >
            <Text
              style={[
                typography.caption,
                { color: mode === 'phone' ? colors.primary : colors.textSecondary, fontWeight: '700' },
              ]}
            >
              Phone Login (OTP)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Input */}
        <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 6 }]}>
          {mode === 'email' ? 'EMAIL ADDRESS' : 'MOBILE PHONE NUMBER'}
        </Text>
        <TextInput
          value={identifier}
          onChangeText={setIdentifier}
          placeholder={mode === 'email' ? 'you@example.com' : '+91 98765 43210'}
          placeholderTextColor={colors.textMuted}
          keyboardType={mode === 'email' ? 'email-address' : 'phone-pad'}
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

        {mode === 'email' && (
          <>
            <View style={styles.passwordHeader}>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                PASSWORD
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={[typography.caption, { color: colors.primary, fontWeight: '600' }]}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </View>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
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
                  marginBottom: 16,
                },
              ]}
            />
          </>
        )}

        {errorMsg && (
          <Text style={[typography.caption, { color: colors.danger, marginBottom: 12 }]}>
            {errorMsg}
          </Text>
        )}

        <Button
          title={mode === 'email' ? 'Sign In' : 'Get OTP Code'}
          onPress={
            mode === 'email'
              ? handleLogin
              : () => navigation.navigate('OtpVerification', { identifier })
          }
          loading={isLoading}
          style={{ marginTop: 8 }}
        />

        <View style={styles.footerRow}>
          <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>
            Don't have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={[typography.bodyMedium, { color: colors.primary, fontWeight: '700' }]}>
              Register
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
    justifyContent: 'center',
    flexGrow: 1,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  brandLogo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    padding: 3,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
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
});

