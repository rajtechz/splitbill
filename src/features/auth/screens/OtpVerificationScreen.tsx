import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../app/navigation/types';
import { useTheme } from '../../../theme';
import { useAuthStore } from '../../../store/useAuthStore';
import { Button } from '../../../components/buttons/Button';
import { AppHeader } from '../../../components/common/AppHeader';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type OtpRouteProp = RouteProp<RootStackParamList, 'OtpVerification'>;

export const OtpVerificationScreen: React.FC = () => {
  const route = useRoute<OtpRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { login, isLoading } = useAuthStore();

  const { identifier } = route.params;
  const [otp, setOtp] = useState('123456');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleVerify = async () => {
    if (otp.length < 4) {
      setErrorMsg('Please enter a valid OTP code');
      return;
    }
    setErrorMsg(null);
    const success = await login(identifier, otp);
    if (!success) {
      setErrorMsg('Invalid or expired OTP. Please try again.');
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader title="Verify OTP" showBack onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[typography.h2, { color: colors.textPrimary, marginBottom: 8 }]}>
          Enter Verification Code
        </Text>
        <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginBottom: 24 }]}>
          We've sent a 6-digit verification code to {identifier}.
        </Text>

        <TextInput
          value={otp}
          onChangeText={setOtp}
          placeholder="123456"
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

        <TouchableOpacity style={styles.resendBtn}>
          <Text style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}>
            Resend Code in 30s
          </Text>
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
  otpInput: {
    height: 60,
    borderWidth: 1.5,
    textAlign: 'center',
    letterSpacing: 10,
  },
  resendBtn: {
    marginTop: 20,
    alignItems: 'center',
  },
});

