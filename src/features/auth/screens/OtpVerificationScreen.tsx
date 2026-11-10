import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../app/navigation/types';
import { useTheme } from '../../../theme';
import { useAuthStore } from '../../../store/useAuthStore';
import { authService } from '../services/authService';
import { Button } from '../../../components/buttons/Button';
import { AppHeader } from '../../../components/common/AppHeader';
import { Icon } from '../../../components/common/Icon';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type OtpRouteProp = RouteProp<RootStackParamList, 'OtpVerification'>;

export const OtpVerificationScreen: React.FC = () => {
  const route = useRoute<OtpRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { login, isLoading } = useAuthStore();

  const { identifier, generatedOtp: initialOtp } = route.params;

  // Manual OTP input - defaults to received random OTP or empty for manual entry
  const [otp, setOtp] = useState(initialOtp || '');
  const [currentOtp, setCurrentOtp] = useState<string | undefined>(initialOtp);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const handleVerify = async () => {
    const cleanOtp = otp.trim();
    if (cleanOtp.length < 4) {
      setErrorMsg('Please enter a 6-digit OTP code');
      return;
    }
    setErrorMsg(null);

    console.log(`\n======================================================`);
    console.log(`📱 [OTP VERIFY] Submitting OTP "${cleanOtp}" for ${identifier}`);
    console.log(`======================================================\n`);

    const success = await login(identifier, cleanOtp);
    if (!success) {
      const authErr = useAuthStore.getState().error;
      const authCode = useAuthStore.getState().errorCode;

      // If user does not have an account, redirect to Register
      if (
        authCode === 'USER_NOT_FOUND' ||
        authErr?.toLowerCase().includes('no account') ||
        authErr?.toLowerCase().includes('not found') ||
        authErr?.toLowerCase().includes('register')
      ) {
        navigation.navigate('Register', {
          phone: identifier.includes('@') ? undefined : identifier,
          email: identifier.includes('@') ? identifier : undefined,
          notice: `No account was found for ${identifier}. Please register below.`,
        });
        return;
      }

      setErrorMsg('Invalid or expired OTP. Please enter the dynamic code from terminal or 123456.');
    }
  };

  const handleResend = async () => {
    setResending(true);
    setErrorMsg(null);
    try {
      const res = await authService.sendPhoneOtp(identifier);
      if (res.otp) {
        setCurrentOtp(res.otp);
        setOtp(res.otp);
        console.log(`\n======================================================`);
        console.log(`🔄 [OTP RESENT] New Dynamic Random OTP for ${identifier}: ${res.otp}`);
        console.log(`======================================================\n`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader title="Verify OTP" showBack onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[typography.h2, { color: colors.textPrimary, marginBottom: 8 }]}>
          Enter Verification Code
        </Text>
        <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginBottom: 20 }]}>
          We've sent a 6-digit verification code to {identifier}.
        </Text>

        {/* Dynamic Random OTP Banner from Backend Response */}
        {currentOtp && (
          <View
            style={[
              styles.devOtpCard,
              {
                backgroundColor: colors.surfaceVariant,
                borderRadius: borderRadius.md,
                borderColor: colors.primary,
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Icon name="sparkles" size={18} color={colors.primary} />
              <Text style={[typography.caption, { color: colors.primary, fontWeight: '700', marginLeft: 6 }]}>
                Backend Dynamic Random OTP
              </Text>
            </View>
            <Text style={[typography.h2, { color: colors.textPrimary, marginTop: 4, letterSpacing: 4 }]}>
              {currentOtp}
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
              Logged on server console • Universal fallback code 123456 also accepted
            </Text>
          </View>
        )}

        <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 6, marginTop: 8 }]}>
          ENTER 6-DIGIT CODE MANUALLY
        </Text>
        <TextInput
          value={otp}
          onChangeText={setOtp}
          placeholder="Enter 6-digit code"
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
          maxLength={6}
          style={[
            styles.otpInput,
            typography.amountLarge,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: borderRadius.md,
              color: colors.textPrimary,
              marginBottom: 16,
            },
          ]}
        />

        {errorMsg && (
          <Text style={[typography.caption, { color: colors.danger, marginBottom: 12 }]}>
            {errorMsg}
          </Text>
        )}

        <Button title="Verify & Proceed" onPress={handleVerify} loading={isLoading} />

        <TouchableOpacity onPress={handleResend} disabled={resending} style={styles.resendBtn}>
          {resending ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}>
              Resend New Random OTP
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  devOtpCard: {
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
    alignItems: 'center',
  },
  otpInput: {
    height: 60,
    borderWidth: 1.5,
    textAlign: 'center',
    letterSpacing: 10,
  },
  resendBtn: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 8,
  },
});
