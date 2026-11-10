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
import { Button } from '../../../components/buttons/Button';
import { AppHeader } from '../../../components/common/AppHeader';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors, typography, spacing, borderRadius } = useTheme();

  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleReset = () => {
    if (!email.trim()) return;
    setSubmitted(true);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader title="Reset Password" showBack onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content}>
        {submitted ? (
          <View style={styles.successBox}>
            <Text style={[typography.h2, { color: colors.textPrimary, marginBottom: 8 }]}>
              Check Your Inbox
            </Text>
            <Text
              style={[
                typography.bodyMedium,
                { color: colors.textSecondary, textAlign: 'center', marginBottom: 24 },
              ]}
            >
              We've sent password recovery instructions to {email}. Follow the link in the email to reset your credentials.
            </Text>
            <Button title="Back to Login" onPress={() => navigation.navigate('Login')} />
          </View>
        ) : (
          <>
            <Text style={[typography.h2, { color: colors.textPrimary, marginBottom: 8 }]}>
              Forgot Password?
            </Text>
            <Text
              style={[typography.bodyMedium, { color: colors.textSecondary, marginBottom: 24 }]}
            >
              Enter your registered email and we'll send you instructions to reset your password.
            </Text>

            <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 6 }]}>
              EMAIL ADDRESS
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
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
                  marginBottom: 20,
                },
              ]}
            />

            <Button
              title="Send Recovery Link"
              onPress={handleReset}
              disabled={!email.trim()}
            />
          </>
        )}
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
  input: {
    height: 48,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  successBox: {
    alignItems: 'center',
    paddingTop: 32,
  },
});

