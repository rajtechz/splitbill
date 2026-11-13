import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../app/navigation/types';
import { useTheme } from '../../../theme';
import { useAppStore } from '../../../store/useAppStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { AppHeader } from '../../../components/common/AppHeader';
import { Button } from '../../../components/buttons/Button';
import { AmountInput } from '../../../components/inputs/AmountInput';
import { CurrencySelector } from '../../../components/inputs/CurrencySelector';
import { Avatar } from '../../../components/avatars/Avatar';
import { Icon } from '../../../components/common/Icon';
import { PaymentMethod, CurrencyCode, SettlementStatus } from '../../../types';
import { initiateUpiTransfer } from '../../../utils/upi';
import { useWalletStore } from '../../../store/useWalletStore';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RecordSettlementRouteProp = RouteProp<RootStackParamList, 'RecordSettlement'>;

const PAYMENT_METHODS: PaymentMethod[] = ['SplitMate Wallet', 'UPI', 'Cash', 'Bank transfer', 'Other'];

export const RecordSettlementScreen: React.FC = () => {
  const route = useRoute<RecordSettlementRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { colors, typography, spacing, borderRadius, isDark } = useTheme();

  const {
    preselectedGroupId,
    preselectedPayerId,
    preselectedReceiverId,
    suggestedAmount,
    currency: initialCurrency,
  } = route.params || {};

  const { groups, friends, recordSettlement } = useAppStore();
  const currentUser = useAuthStore(state => state.currentUser);
  const { balance: walletBalance, payFromWallet } = useWalletStore();

  // Default payer and receiver
  const [payerId, setPayerId] = useState<string>(preselectedPayerId || currentUser?.id || 'usr_me');
  const [receiverId, setReceiverId] = useState<string>(
    preselectedReceiverId || friends[0]?.userId || ''
  );
  const [amountStr, setAmountStr] = useState<string>(
    suggestedAmount ? suggestedAmount.toString() : ''
  );
  const [currency, setCurrency] = useState<CurrencyCode>(initialCurrency || 'INR');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(preselectedGroupId || null);
  const [customUpiId, setCustomUpiId] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [status, setStatus] = useState<SettlementStatus>('CONFIRMED');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Available people (Current user + friends + group members + expense participants)
  const allPeopleMap: Record<string, { userId: string; name: string; avatarUrl?: string; upiId: string }> = {};

  const myId = currentUser?.id || 'usr_me';
  allPeopleMap[myId] = {
    userId: myId,
    name: currentUser?.name || 'You',
    avatarUrl: currentUser?.avatarUrl,
    upiId: currentUser?.upiId || 'alex.johnson@okaxis',
  };

  for (const f of friends) {
    if (!allPeopleMap[f.userId]) {
      allPeopleMap[f.userId] = {
        userId: f.userId,
        name: f.name,
        avatarUrl: f.avatarUrl,
        upiId: f.upiId || `${f.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@okaxis`,
      };
    }
  }

  for (const g of groups) {
    for (const m of g.members) {
      if (!allPeopleMap[m.userId]) {
        allPeopleMap[m.userId] = {
          userId: m.userId,
          name: m.name,
          avatarUrl: m.avatarUrl,
          upiId: `${m.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@okaxis`,
        };
      }
    }
  }

  const { expenses } = useAppStore.getState();
  for (const exp of expenses) {
    for (const p of exp.participants) {
      if (!allPeopleMap[p.userId]) {
        allPeopleMap[p.userId] = {
          userId: p.userId,
          name: p.name,
          avatarUrl: p.avatarUrl,
          upiId: `${p.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@okaxis`,
        };
      }
    }
  }

  if (preselectedReceiverId && !allPeopleMap[preselectedReceiverId]) {
    allPeopleMap[preselectedReceiverId] = {
      userId: preselectedReceiverId,
      name: 'Receiver',
      upiId: 'payee@okaxis',
    };
  }

  const allPeople = Object.values(allPeopleMap);

  const payerObj = allPeople.find(p => p.userId === payerId);
  const receiverObj = allPeople.find(p => p.userId === receiverId);

  const effectiveUpiId = customUpiId.trim() || receiverObj?.upiId || '';

  const parsedAmount = parseFloat(amountStr) || 0;

  const handleLaunchUpi = async () => {
    if (parsedAmount <= 0) {
      Alert.alert('Amount Required', 'Please enter a settlement amount first.');
      return;
    }
    if (!effectiveUpiId) {
      Alert.alert('UPI ID Required', 'Please enter the receiver’s UPI ID.');
      return;
    }

    const opened = await initiateUpiTransfer({
      payeeUpiId: effectiveUpiId,
      payeeName: receiverObj?.name || 'Friend',
      amount: parsedAmount,
      note: `SplitMate settlement with ${receiverObj?.name}`,
    });

    if (opened) {
      // Auto-fill an autogenerated reference if payer returns from UPI app
      setTransactionRef(`UPI-${Date.now().toString().slice(-6)}`);
    }
  };

  const handleRecord = async () => {
    if (parsedAmount <= 0) {
      setErrorMsg('Please enter a valid payment amount');
      return;
    }
    if (payerId === receiverId) {
      setErrorMsg('Payer and receiver cannot be the same person');
      return;
    }

    if (paymentMethod === 'SplitMate Wallet') {
      if (walletBalance < parsedAmount) {
        Alert.alert(
          'Insufficient Wallet Balance',
          `You have ₹${walletBalance.toLocaleString('en-IN')} in your wallet, but this settlement requires ₹${parsedAmount.toLocaleString('en-IN')}. Please add funds to your wallet first.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Add Money', onPress: () => navigation.navigate('Wallet') },
          ]
        );
        return;
      }

      // Deduct from wallet
      const walletRes = await payFromWallet(parsedAmount, receiverObj?.name || 'Friend');
      if (!walletRes.success) {
        Alert.alert('Payment Failed', walletRes.message);
        return;
      }
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const groupObj = groups.find(g => g.id === selectedGroupId);

      await recordSettlement({
        groupId: selectedGroupId || null,
        groupName: groupObj?.name,
        payerId,
        payerName: payerObj?.name || 'Payer',
        receiverId,
        receiverName: receiverObj?.name || 'Receiver',
        amount: parsedAmount,
        currency,
        paymentMethod,
        status,
        upiId: paymentMethod === 'UPI' ? effectiveUpiId : undefined,
        transactionReference: transactionRef.trim() || (paymentMethod === 'SplitMate Wallet' ? `WLT-${Date.now().toString().slice(-6)}` : undefined),
        notes: notes.trim() || undefined,
        date: new Date().toISOString(),
      });

      Alert.alert(
        status === 'CONFIRMED' ? 'Payment Recorded & Cleared' : 'Payment Awaiting Confirmation',
        status === 'CONFIRMED'
          ? 'The balance has been settled and updated in your ledger.'
          : 'Payment recorded. The receiver will see a notification to confirm receipt.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to record settlement');
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader title="Record / Make a Payment" showBack onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Notice disclaimer */}
        <View
          style={[
            styles.disclaimerBox,
            { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.md },
          ]}
        >
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            SplitMate acts as your financial ledger. When using UPI, you can initiate a real bank transfer below or record a payment you made offline.
          </Text>
        </View>

        {/* Amount Input */}
        <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 6 }]}>
          SETTLEMENT AMOUNT *
        </Text>
        <AmountInput
          value={amountStr}
          onChangeText={setAmountStr}
          currency={currency}
          placeholder="0.00"
        />

        {/* Currency Selector */}
        <View style={{ marginVertical: 8 }}>
          <CurrencySelector selectedCurrency={currency} onSelect={setCurrency} />
        </View>

        {/* Who Paid (Payer) */}
        <Text
          style={[
            typography.caption,
            { color: colors.textSecondary, marginTop: spacing.md, marginBottom: 8 },
          ]}
        >
          WHO IS PAYING? *
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {allPeople.map(person => {
            const isSelected = person.userId === payerId;
            return (
              <TouchableOpacity
                key={person.userId}
                activeOpacity={0.7}
                onPress={() => setPayerId(person.userId)}
                style={[
                  styles.personPill,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderRadius: borderRadius.full,
                  },
                ]}
              >
                <Avatar name={person.name} size={24} />
                <Text
                  style={[
                    typography.caption,
                    {
                      color: isSelected ? '#FFFFFF' : colors.textPrimary,
                      fontWeight: '600',
                      marginLeft: 6,
                    },
                  ]}
                >
                  {person.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Who Received (Receiver) */}
        <Text
          style={[
            typography.caption,
            { color: colors.textSecondary, marginTop: spacing.md, marginBottom: 8 },
          ]}
        >
          WHO IS RECEIVING? *
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {allPeople
            .filter(p => p.userId !== payerId)
            .map(person => {
              const isSelected = person.userId === receiverId;
              return (
                <TouchableOpacity
                  key={person.userId}
                  activeOpacity={0.7}
                  onPress={() => setReceiverId(person.userId)}
                  style={[
                    styles.personPill,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                      borderRadius: borderRadius.full,
                    },
                  ]}
                >
                  <Avatar name={person.name} size={24} />
                  <Text
                    style={[
                      typography.caption,
                      {
                        color: isSelected ? '#FFFFFF' : colors.textPrimary,
                        fontWeight: '600',
                        marginLeft: 6,
                      },
                    ]}
                  >
                    {person.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
        </ScrollView>

        {/* Payment Method */}
        <Text
          style={[
            typography.caption,
            { color: colors.textSecondary, marginTop: spacing.lg, marginBottom: 8 },
          ]}
        >
          PAYMENT METHOD
        </Text>
        <View style={styles.methodRow}>
          {PAYMENT_METHODS.map(m => {
            const isSelected = paymentMethod === m;
            return (
              <TouchableOpacity
                key={m}
                activeOpacity={0.7}
                onPress={() => setPaymentMethod(m)}
                style={[
                  styles.methodBtn,
                  {
                    backgroundColor: isSelected ? colors.primaryLight : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderRadius: borderRadius.md,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.caption,
                    {
                      color: isSelected ? colors.primary : colors.textPrimary,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {m}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* SplitMate Digital Wallet Section */}
        {paymentMethod === 'SplitMate Wallet' && (
          <View
            style={[
              styles.walletCardSection,
              {
                backgroundColor: isDark ? '#0C2A1F' : 'rgba(23, 107, 80, 0.08)',
                borderColor: isDark ? 'rgba(43, 176, 124, 0.4)' : '#2BB07C',
                borderRadius: borderRadius.lg,
                padding: spacing.md,
                marginTop: spacing.md,
              },
            ]}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.walletIconMiniCircle}>
                  <Icon name="wallet" size={16} color="#D4AF37" />
                </View>
                <Text style={[typography.titleMedium, { color: colors.textPrimary, marginLeft: 8, fontWeight: '700' }]}>
                  SplitMate Digital Wallet
                </Text>
              </View>
              <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('Wallet')}>
                <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>Manage Wallet</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.walletBalanceRow, { backgroundColor: isDark ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.85)', borderRadius: borderRadius.md }]}>
              <View>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>Available Balance</Text>
                <Text style={[typography.h2, { color: isDark ? '#34D399' : '#15803D', fontWeight: '800', marginTop: 2 }]}>
                  ₹{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Wallet')}
                style={[styles.walletTopupBtn, { backgroundColor: colors.primary, borderRadius: borderRadius.sm }]}
              >
                <Icon name="plus" size={13} color="#FFFFFF" />
                <Text style={styles.walletTopupBtnText}>Top-up</Text>
              </TouchableOpacity>
            </View>

            {parsedAmount > 0 && (
              <View style={{ marginTop: 10 }}>
                {walletBalance >= parsedAmount ? (
                  <View style={styles.sufficientBadge}>
                    <Icon name="check-circle" size={14} color="#10B981" />
                    <Text style={styles.sufficientBadgeText}>
                      Instant 1-tap settlement • Zero fees
                    </Text>
                  </View>
                ) : (
                  <View style={styles.insufficientBadge}>
                    <Icon name="alert" size={14} color="#EF4444" />
                    <Text style={styles.insufficientBadgeText}>
                      Insufficient wallet balance. You need ₹{(parsedAmount - walletBalance).toLocaleString('en-IN')} more.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* UPI Specific Section */}
        {paymentMethod === 'UPI' && (
          <View
            style={[
              styles.upiCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderSubtle,
                borderRadius: borderRadius.lg,
                padding: spacing.md,
                marginTop: spacing.md,
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Icon name="shield" size={18} color={colors.primary} />
              <Text style={[typography.titleMedium, { color: colors.textPrimary, marginLeft: 8 }]}>
                Direct Bank Transfer via UPI
              </Text>
            </View>

            <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 4 }]}>
              RECEIVER UPI ID (VPA)
            </Text>
            <TextInput
              value={customUpiId || receiverObj?.upiId || ''}
              onChangeText={setCustomUpiId}
              placeholder="e.g. mobile@upi, name@okhdfcbank"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              style={[
                styles.upiInput,
                typography.bodyMedium,
                {
                  backgroundColor: colors.surfaceVariant,
                  borderColor: colors.border,
                  borderRadius: borderRadius.sm,
                  color: colors.textPrimary,
                  marginBottom: 12,
                },
              ]}
            />

            {/* Launch UPI App Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleLaunchUpi}
              style={[styles.launchUpiBtn, { backgroundColor: colors.primary, borderRadius: borderRadius.md }]}
            >
              <Icon name="arrow-up-right" size={18} color="#FFFFFF" />
              <Text style={[typography.buttonMedium, { color: '#FFFFFF', marginLeft: 8 }]}>
                Pay via UPI App (GPay / PhonePe / Paytm)
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Transaction Reference (UTR) */}
        <Text
          style={[
            typography.caption,
            { color: colors.textSecondary, marginTop: spacing.lg, marginBottom: 6 },
          ]}
        >
          TRANSACTION REFERENCE / UTR # (OPTIONAL)
        </Text>
        <TextInput
          value={transactionRef}
          onChangeText={setTransactionRef}
          placeholder="e.g. 439012389102"
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            typography.bodyMedium,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: borderRadius.md,
              color: colors.textPrimary,
            },
          ]}
        />

        {/* Settlement Status Toggle */}
        <Text
          style={[
            typography.caption,
            { color: colors.textSecondary, marginTop: spacing.lg, marginBottom: 8 },
          ]}
        >
          SETTLEMENT STATUS
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            onPress={() => setStatus('CONFIRMED')}
            style={[
              styles.statusBtn,
              {
                backgroundColor: status === 'CONFIRMED' ? colors.successLight : colors.surface,
                borderColor: status === 'CONFIRMED' ? colors.success : colors.border,
                borderRadius: borderRadius.md,
              },
            ]}
          >
            <Icon name="check" size={16} color={colors.success} />
            <Text
              style={[
                typography.caption,
                { color: status === 'CONFIRMED' ? colors.success : colors.textPrimary, fontWeight: '700', marginLeft: 6 },
              ]}
            >
              Cleared / Confirmed
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setStatus('PENDING')}
            style={[
              styles.statusBtn,
              {
                backgroundColor: status === 'PENDING' ? colors.warningLight : colors.surface,
                borderColor: status === 'PENDING' ? colors.warning : colors.border,
                borderRadius: borderRadius.md,
              },
            ]}
          >
            <Icon name="alert" size={16} color={colors.warning} />
            <Text
              style={[
                typography.caption,
                { color: status === 'PENDING' ? colors.warning : colors.textPrimary, fontWeight: '700', marginLeft: 6 },
              ]}
            >
              Pending Confirmation
            </Text>
          </TouchableOpacity>
        </View>

        {/* Link to Group (Optional) */}
        <Text
          style={[
            typography.caption,
            { color: colors.textSecondary, marginTop: spacing.lg, marginBottom: 8 },
          ]}
        >
          ASSOCIATED GROUP (OPTIONAL)
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            onPress={() => setSelectedGroupId(null)}
            style={[
              styles.groupPill,
              {
                backgroundColor: selectedGroupId === null ? colors.primary : colors.surface,
                borderColor: selectedGroupId === null ? colors.primary : colors.border,
                borderRadius: borderRadius.full,
              },
            ]}
          >
            <Text
              style={[
                typography.caption,
                { color: selectedGroupId === null ? '#FFFFFF' : colors.textPrimary, fontWeight: '600' },
              ]}
            >
              Direct / Non-group
            </Text>
          </TouchableOpacity>

          {groups.map(g => {
            const isSelected = selectedGroupId === g.id;
            return (
              <TouchableOpacity
                key={g.id}
                onPress={() => setSelectedGroupId(g.id)}
                style={[
                  styles.groupPill,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderRadius: borderRadius.full,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.caption,
                    { color: isSelected ? '#FFFFFF' : colors.textPrimary, fontWeight: '600' },
                  ]}
                >
                  {g.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Notes */}
        <Text
          style={[
            typography.caption,
            { color: colors.textSecondary, marginTop: spacing.lg, marginBottom: 6 },
          ]}
        >
          NOTES (OPTIONAL)
        </Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="e.g. Paid during dinner, Google Pay transaction..."
          placeholderTextColor={colors.textMuted}
          style={[
            styles.notesInput,
            typography.bodyMedium,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: borderRadius.md,
              color: colors.textPrimary,
            },
          ]}
        />

        {errorMsg && (
          <Text style={[typography.caption, { color: colors.danger, marginTop: 12 }]}>
            {errorMsg}
          </Text>
        )}

        <Button
          title={status === 'CONFIRMED' ? 'Record Payment & Clear Debt' : 'Record as Pending Confirmation'}
          onPress={handleRecord}
          loading={submitting}
          style={{ marginTop: spacing.xl, marginBottom: 40 }}
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
  disclaimerBox: {
    padding: 12,
    marginBottom: 16,
  },
  personPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    marginRight: 8,
  },
  methodRow: {
    flexDirection: 'row',
    gap: 8,
  },
  methodBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  upiCard: {
    borderWidth: 1,
  },
  walletCardSection: {
    borderWidth: 1,
  },
  walletIconMiniCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletBalanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  walletTopupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  walletTopupBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  sufficientBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 6,
  },
  sufficientBadgeText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
  },
  insufficientBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 6,
  },
  insufficientBadgeText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
  upiInput: {
    height: 42,
    borderWidth: 1,
    paddingHorizontal: 10,
  },
  launchUpiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  input: {
    height: 46,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  statusBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderWidth: 1,
  },
  groupPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    marginRight: 8,
  },
  notesInput: {
    height: 48,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
});
