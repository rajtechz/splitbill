import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
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
import { authService } from '../services/authService';
import { Button } from '../../../components/buttons/Button';
import { Icon } from '../../../components/common/Icon';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { login, isLoading } = useAuthStore();

  const [mode, setMode] = useState<'email' | 'phone'>('email');
  // Manual inputs for Email and Phone Number
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sendingOtp, setSendingOtp] = useState(false);

  const handleEmailLogin = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMsg('Please enter your email address');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password');
      return;
    }
    setErrorMsg(null);

    const success = await login(cleanEmail, password);
    if (!success) {
      const authErr = useAuthStore.getState().error;
      const authCode = useAuthStore.getState().errorCode;

      // If user doesn't have an account, navigate to register page
      if (
        authCode === 'USER_NOT_FOUND' ||
        authErr?.toLowerCase().includes('no account') ||
        authErr?.toLowerCase().includes('not found') ||
        authErr?.toLowerCase().includes('register')
      ) {
        console.log(`ℹ️ [LOGIN] User not registered: ${cleanEmail}. Navigating to Register page...`);
        navigation.navigate('Register', {
          email: cleanEmail,
          notice: `No account was found with ${cleanEmail}. Please create your account below.`,
        });
        return;
      }
      setErrorMsg(authErr || 'Login failed. Please check your credentials.');
    }
  };

  const handleGetOtp = async () => {
    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      setErrorMsg('Please enter your mobile phone number');
      return;
    }
    setErrorMsg(null);
    setSendingOtp(true);

    try {
      // Call backend API to check account and generate dynamic random OTP
      const res = await authService.sendPhoneOtp(cleanPhone, true);
      console.log('\n======================================================');
      console.log(`📱 [LOGIN SCREEN] OTP requested for: ${cleanPhone}`);
      console.log(`🔢 [LOGIN SCREEN] Dynamic OTP received from API: ${res.otp}`);
      console.log('======================================================\n');

      navigation.navigate('OtpVerification', {
        identifier: cleanPhone,
        generatedOtp: res.otp,
      });
    } catch (err: any) {
      const code = err.code || err.response?.data?.code;
      const msg = err.message || err.response?.data?.message || '';

      // If user does not have an account, navigate to register page
      if (
        code === 'USER_NOT_FOUND' ||
        err.statusCode === 404 ||
        err.response?.status === 404 ||
        msg.toLowerCase().includes('no account') ||
        msg.toLowerCase().includes('not found') ||
        msg.toLowerCase().includes('register')
      ) {
        console.log(`ℹ️ [LOGIN] Phone not registered: ${cleanPhone}. Navigating to Register page...`);
        navigation.navigate('Register', {
          phone: cleanPhone,
          notice: `No account was found with ${cleanPhone}. Please create your account below.`,
        });
        return;
      }

      setErrorMsg(msg || 'Failed to send OTP. Please ensure backend is running.');
    } finally {
      setSendingOtp(false);
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
          <Image
            source={require('../../../../assets/icons/app_icon.png')}
            style={styles.brandLogoImage}
            resizeMode="cover"
          />
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
              setErrorMsg(null);
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
              setErrorMsg(null);
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

        {/* EMAIL LOGIN FORM */}
        {mode === 'email' ? (
          <>
            <View style={styles.inputHeaderRow}>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                EMAIL ADDRESS
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setEmail('alex.johnson@example.com');
                  setPassword('password123');
                }}
              >
                <Text style={[typography.caption, { color: colors.primary, fontWeight: '600' }]}>
                  Use Demo Account
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Enter email (e.g. alex@example.com)"
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

            <View
              style={[
                styles.passwordInputContainer,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: borderRadius.md,
                  marginBottom: 16,
                },
              ]}
            >
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPassword}
                style={[
                  styles.passwordTextInput,
                  typography.bodyMedium,
                  {
                    color: colors.textPrimary,
                  },
                ]}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={styles.eyeButton}
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                accessibilityRole="button"
              >
                <Icon
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          /* PHONE OTP LOGIN FORM */
          <>
            <View style={styles.inputHeaderRow}>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                MOBILE PHONE NUMBER
              </Text>
              <TouchableOpacity onPress={() => setPhone('+91 98765 43210')}>
                <Text style={[typography.caption, { color: colors.primary, fontWeight: '600' }]}>
                  Use Demo Number
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter mobile number (e.g. +91 98765 43210)"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
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
          </>
        )}

        {errorMsg && (
          <Text style={[typography.caption, { color: colors.danger, marginBottom: 12 }]}>
            {errorMsg}
          </Text>
        )}

        <Button
          title={mode === 'email' ? 'Sign In' : 'Get OTP Code'}
          onPress={mode === 'email' ? handleEmailLogin : handleGetOtp}
          loading={mode === 'email' ? isLoading : sendingOtp}
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
    paddingTop: 60,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  brandLogoImage: {
    width: 72,
    height: 72,
    borderRadius: 18,
  },
  tabBar: {
    flexDirection: 'row',
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  inputHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  passwordInputContainer: {
    height: 48,
    borderWidth: 1,
    paddingLeft: 16,
    paddingRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  passwordTextInput: {
    flex: 1,
    height: '100%',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  eyeButton: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
});
