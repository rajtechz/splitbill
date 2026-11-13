import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../theme';
import { AppHeader } from '../../../components/common/AppHeader';
import { Icon } from '../../../components/common/Icon';
import { useWalletStore, WalletTxType } from '../../../store/useWalletStore';
import { useAlert } from '../../../context/AlertContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PRESET_AMOUNTS = [500, 1000, 2000, 5000];

export const WalletScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors, typography, borderRadius, isDark } = useTheme();
  const { showAlert } = useAlert();

  const { balance, transactions, addFunds, withdrawToBank } = useWalletStore();

  // Modals state
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'deposit' | 'withdrawal' | 'settlement'>('all');

  // Add money state
  const [addAmountStr, setAddAmountStr] = useState('1000');
  const [selectedAddMethod, setSelectedAddMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [addingFunds, setAddingFunds] = useState(false);

  // Withdraw state
  const [withdrawMode, setWithdrawMode] = useState<'bank' | 'upi'>('bank');
  const [withdrawAmountStr, setWithdrawAmountStr] = useState('');
  const [accountHolder, setAccountHolder] = useState('KD');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [withdrawUpiId, setWithdrawUpiId] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'deposit') return tx.type === 'deposit';
    if (activeFilter === 'withdrawal') return tx.type === 'withdrawal';
    if (activeFilter === 'settlement') return tx.type === 'settlement_payment' || tx.type === 'settlement_received';
    return true;
  });

  const handleAddFunds = async () => {
    const amt = parseFloat(addAmountStr);
    if (!amt || amt <= 0) {
      showAlert({
        title: 'Invalid Amount',
        message: 'Please enter a valid amount to add to your wallet.',
        variant: 'warning',
      });
      return;
    }

    setAddingFunds(true);
    try {
      const methodLabel =
        selectedAddMethod === 'upi'
          ? 'UPI (Google Pay / PhonePe)'
          : selectedAddMethod === 'card'
          ? 'Debit/Credit Card'
          : 'NetBanking';

      const res = await addFunds(amt, methodLabel);
      setAddModalVisible(false);
      showAlert({
        title: 'Money Added Successfully!',
        message: res.message,
        variant: 'celebration',
        emoji: '💰',
        confirmText: 'Awesome!',
      });
    } catch (e: any) {
      showAlert({
        title: 'Failed to Add Funds',
        message: e?.message || 'Could not complete wallet top-up.',
        variant: 'danger',
      });
    } finally {
      setAddingFunds(false);
    }
  };

  const handleWithdrawFunds = async () => {
    const amt = parseFloat(withdrawAmountStr);
    if (!amt || amt <= 0) {
      showAlert({
        title: 'Invalid Amount',
        message: 'Please enter a valid transfer amount.',
        variant: 'warning',
      });
      return;
    }
    if (amt > balance) {
      showAlert({
        title: 'Insufficient Balance',
        message: `Your wallet balance is ₹${balance.toLocaleString('en-IN')}. You cannot withdraw more than your available balance.`,
        variant: 'danger',
      });
      return;
    }

    if (withdrawMode === 'bank') {
      if (!accountHolder.trim()) {
        showAlert({ title: 'Name Required', message: 'Please enter the bank account holder name.', variant: 'warning' });
        return;
      }
      if (!accountNumber || accountNumber.length < 8) {
        showAlert({ title: 'Invalid Account Number', message: 'Please enter a valid bank account number.', variant: 'warning' });
        return;
      }
      if (accountNumber !== confirmAccountNumber) {
        showAlert({ title: 'Account Numbers Mismatch', message: 'Account number and confirm account number do not match.', variant: 'warning' });
        return;
      }
      if (!ifscCode || ifscCode.length < 6) {
        showAlert({ title: 'Invalid IFSC', message: 'Please enter a valid 11-character bank IFSC code.', variant: 'warning' });
        return;
      }
    } else {
      if (!withdrawUpiId || !withdrawUpiId.includes('@')) {
        showAlert({ title: 'Invalid UPI ID', message: 'Please enter a valid UPI ID (e.g. mobile@upi or name@okaxis).', variant: 'warning' });
        return;
      }
    }

    setWithdrawing(true);
    try {
      const res = await withdrawToBank(amt, {
        accountHolder: accountHolder.trim(),
        accountNumber: withdrawMode === 'bank' ? accountNumber.trim() : '',
        ifsc: withdrawMode === 'bank' ? ifscCode.trim().toUpperCase() : '',
        upiId: withdrawMode === 'upi' ? withdrawUpiId.trim() : undefined,
      });

      if (res.success) {
        setWithdrawModalVisible(false);
        setWithdrawAmountStr('');
        setAccountNumber('');
        setConfirmAccountNumber('');
        setIfscCode('');
        setWithdrawUpiId('');
        showAlert({
          title: 'Bank Transfer Completed!',
          message: res.message,
          variant: 'success',
          emoji: '🏦',
          confirmText: 'Done',
        });
      } else {
        showAlert({
          title: 'Transfer Failed',
          message: res.message,
          variant: 'danger',
        });
      }
    } catch (e: any) {
      showAlert({
        title: 'Transfer Error',
        message: e.message || 'Could not process bank withdrawal.',
        variant: 'danger',
      });
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader title="SplitMate Wallet" showBack onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Main Wallet Balance Card */}
        <View
          style={[
            styles.walletCard,
            {
              backgroundColor: isDark ? '#0C2A1F' : '#176B50',
              borderRadius: borderRadius.xl,
              borderColor: isDark ? 'rgba(43, 176, 124, 0.4)' : '#0E4936',
            },
          ]}
        >
          <View style={styles.walletHeaderRow}>
            <View style={styles.walletBadgeRow}>
              <View style={styles.walletIconCircle}>
                <Icon name="wallet" size={18} color="#D4AF37" />
              </View>
              <Text style={styles.walletBadgeText}>SPLITMATE DIGITAL WALLET</Text>
            </View>
            <View style={styles.securePill}>
              <Icon name="shield-check" size={12} color="#A7F3D0" />
              <Text style={styles.securePillText}>Verified</Text>
            </View>
          </View>

          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
          <Text style={styles.balanceSubtitle}>Instant zero-fee bill splits • Instant bank withdrawals</Text>

          {/* Action Buttons */}
          <View style={styles.walletActionsRow}>
            {/* Add Money */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setAddModalVisible(true)}
              style={[styles.walletBtn, styles.addBtn]}
            >
              <Icon name="plus" size={16} color="#FFFFFF" />
              <Text style={styles.addBtnText}>Add Money</Text>
            </TouchableOpacity>

            {/* Transfer to Bank */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setWithdrawModalVisible(true)}
              style={[styles.walletBtn, styles.withdrawBtn]}
            >
              <Icon name="bank" size={15} color="#D4AF37" />
              <Text style={styles.withdrawBtnText}>Transfer to Bank</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Informational Feature Box */}
        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderColor: colors.borderSubtle,
              borderRadius: borderRadius.lg,
            },
          ]}
        >
          <Text style={[typography.titleMedium, { color: colors.textPrimary, marginBottom: 8 }]}>
            What can you do with this wallet?
          </Text>

          <View style={styles.infoFeatureRow}>
            <View style={[styles.infoFeatureIcon, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5' }]}>
              <Icon name="zap" size={16} color="#10B981" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[typography.bodyMedium, { color: colors.textPrimary, fontWeight: '700' }]}>
                1-Tap Instant Settlements
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                Settle up debts with friends instantly without opening external banking apps.
              </Text>
            </View>
          </View>

          <View style={styles.infoFeatureRow}>
            <View style={[styles.infoFeatureIcon, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : '#F0F9FF' }]}>
              <Icon name="bank" size={16} color="#38BDF8" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[typography.bodyMedium, { color: colors.textPrimary, fontWeight: '700' }]}>
                Transfer to Bank Anytime
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                Send funds from your wallet to any Indian bank account or UPI ID with 0% transfer fee.
              </Text>
            </View>
          </View>

          <View style={styles.infoFeatureRow}>
            <View style={[styles.infoFeatureIcon, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFFBEB' }]}>
              <Icon name="shield-check" size={16} color="#F59E0B" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[typography.bodyMedium, { color: colors.textPrimary, fontWeight: '700' }]}>
                Automated Ledger & UTR Tracking
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                Every transaction generates an official reference ID and syncs across your balances.
              </Text>
            </View>
          </View>
        </View>

        {/* Transaction History Header & Filter Chips */}
        <View style={styles.historySection}>
          <Text style={[typography.titleMedium, { color: colors.textPrimary, marginBottom: 12 }]}>
            Wallet Transactions
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'deposit', label: 'Added Money' },
                { id: 'withdrawal', label: 'Bank Transfers' },
                { id: 'settlement', label: 'Settlements' },
              ] as const
            ).map(f => {
              const isSelected = activeFilter === f.id;
              return (
                <TouchableOpacity
                  key={f.id}
                  activeOpacity={0.7}
                  onPress={() => setActiveFilter(f.id)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                      borderRadius: borderRadius.full,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      {
                        color: isSelected ? '#FFFFFF' : colors.textSecondary,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Transactions List */}
          {filteredTransactions.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderRadius: borderRadius.md }]}>
              <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>No transactions found.</Text>
            </View>
          ) : (
            filteredTransactions.map(tx => {
              const isPositive = tx.type === 'deposit' || tx.type === 'settlement_received';
              const iconName =
                tx.type === 'deposit'
                  ? 'arrow-down-left'
                  : tx.type === 'withdrawal'
                  ? 'bank'
                  : tx.type === 'settlement_received'
                  ? 'arrow-down-left'
                  : 'arrow-up-right';

              return (
                <View
                  key={tx.id}
                  style={[
                    styles.txItem,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.borderSubtle,
                      borderRadius: borderRadius.md,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.txIconBox,
                      {
                        backgroundColor: isPositive
                          ? isDark
                            ? 'rgba(16, 185, 129, 0.15)'
                            : '#ECFDF5'
                          : isDark
                          ? 'rgba(239, 68, 68, 0.15)'
                          : '#FEE2E2',
                      },
                    ]}
                  >
                    <Icon name={iconName} size={18} color={isPositive ? '#10B981' : '#EF4444'} />
                  </View>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[typography.bodyMedium, { color: colors.textPrimary, fontWeight: '700' }]}>
                      {tx.title}
                    </Text>
                    <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]} numberOfLines={1}>
                      {tx.subtitle}
                    </Text>
                    <Text style={[styles.txRef, { color: colors.textMuted }]}>
                      {new Date(tx.date).toLocaleDateString()} • Ref: {tx.referenceId}
                    </Text>
                  </View>

                  <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
                    <Text
                      style={[
                        typography.titleMedium,
                        {
                          color: isPositive ? (isDark ? '#34D399' : '#15803D') : colors.textPrimary,
                          fontWeight: '800',
                        },
                      ]}
                    >
                      {isPositive ? '+' : '-'} ₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Text>
                    <View style={styles.completedBadge}>
                      <Text style={styles.completedBadgeText}>Completed</Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* MODAL 1: ADD MONEY (TOP-UP) */}
      <Modal visible={addModalVisible} transparent animationType="fade" onRequestClose={() => setAddModalVisible(false)}>
        <View style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderRadius: borderRadius.xl, borderColor: colors.border }]}>
            {/* Header */}
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.modalHeaderIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <Icon name="plus" size={18} color="#10B981" />
                </View>
                <Text style={[typography.h3, { color: colors.textPrimary }]}>Add Money to Wallet</Text>
              </View>
              <TouchableOpacity onPress={() => setAddModalVisible(false)} style={styles.modalCloseBtn}>
                <Icon name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Amount input */}
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 14, marginBottom: 6 }]}>
              ENTER AMOUNT (INR)
            </Text>
            <View style={[styles.amountInputRow, { backgroundColor: colors.surfaceVariant, borderColor: colors.border, borderRadius: borderRadius.md }]}>
              <Text style={styles.currencyPrefix}>₹</Text>
              <TextInput
                value={addAmountStr}
                onChangeText={setAddAmountStr}
                keyboardType="numeric"
                placeholder="500"
                placeholderTextColor={colors.textMuted}
                style={[styles.amountInputText, { color: colors.textPrimary }]}
              />
            </View>

            {/* Quick preset chips */}
            <View style={styles.presetsRow}>
              {PRESET_AMOUNTS.map(amt => (
                <TouchableOpacity
                  key={amt}
                  activeOpacity={0.7}
                  onPress={() => setAddAmountStr(amt.toString())}
                  style={[
                    styles.presetChip,
                    {
                      backgroundColor: addAmountStr === amt.toString() ? 'rgba(16, 185, 129, 0.2)' : isDark ? colors.surfaceVariant : '#F3F4F6',
                      borderColor: addAmountStr === amt.toString() ? '#10B981' : 'transparent',
                    },
                  ]}
                >
                  <Text style={[styles.presetChipText, { color: addAmountStr === amt.toString() ? '#10B981' : colors.textPrimary }]}>
                    +₹{amt.toLocaleString('en-IN')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Payment method selector */}
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 16, marginBottom: 8 }]}>
              PAYMENT METHOD
            </Text>
            <View style={styles.methodSelectRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSelectedAddMethod('upi')}
                style={[
                  styles.methodSelectBtn,
                  {
                    borderColor: selectedAddMethod === 'upi' ? '#10B981' : colors.border,
                    backgroundColor: selectedAddMethod === 'upi' ? 'rgba(16, 185, 129, 0.12)' : colors.surfaceVariant,
                    borderRadius: borderRadius.md,
                  },
                ]}
              >
                <Icon name="smartphone" size={16} color={selectedAddMethod === 'upi' ? '#10B981' : colors.textSecondary} />
                <Text style={[styles.methodSelectText, { color: selectedAddMethod === 'upi' ? '#10B981' : colors.textPrimary }]}>
                  UPI (GPay / PhonePe)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSelectedAddMethod('card')}
                style={[
                  styles.methodSelectBtn,
                  {
                    borderColor: selectedAddMethod === 'card' ? '#10B981' : colors.border,
                    backgroundColor: selectedAddMethod === 'card' ? 'rgba(16, 185, 129, 0.12)' : colors.surfaceVariant,
                    borderRadius: borderRadius.md,
                    marginTop: 8,
                  },
                ]}
              >
                <Icon name="credit-card" size={16} color={selectedAddMethod === 'card' ? '#10B981' : colors.textSecondary} />
                <Text style={[styles.methodSelectText, { color: selectedAddMethod === 'card' ? '#10B981' : colors.textPrimary }]}>
                  Debit / Credit Card
                </Text>
              </TouchableOpacity>
            </View>

            {/* Confirm button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleAddFunds}
              disabled={addingFunds}
              style={[styles.modalActionBtn, { backgroundColor: '#176B50', borderRadius: borderRadius.md }]}
            >
              {addingFunds ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.modalActionBtnText}>Add ₹{parseFloat(addAmountStr) || 0} to Wallet</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: TRANSFER TO BANK */}
      <Modal visible={withdrawModalVisible} transparent animationType="fade" onRequestClose={() => setWithdrawModalVisible(false)}>
        <View style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderRadius: borderRadius.xl, borderColor: colors.border }]}>
            {/* Header */}
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.modalHeaderIcon, { backgroundColor: 'rgba(212, 175, 55, 0.18)' }]}>
                  <Icon name="bank" size={18} color="#D4AF37" />
                </View>
                <Text style={[typography.h3, { color: colors.textPrimary }]}>Transfer to Bank</Text>
              </View>
              <TouchableOpacity onPress={() => setWithdrawModalVisible(false)} style={styles.modalCloseBtn}>
                <Icon name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Mode switch (Bank Account / UPI) */}
            <View style={[styles.modeTabsRow, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.md }]}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setWithdrawMode('bank')}
                style={[styles.modeTab, withdrawMode === 'bank' && [styles.modeTabActive, { backgroundColor: colors.surface }]]}
              >
                <Text style={[styles.modeTabText, { color: withdrawMode === 'bank' ? colors.primary : colors.textSecondary }]}>
                  Bank Account (NEFT/IMPS)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setWithdrawMode('upi')}
                style={[styles.modeTab, withdrawMode === 'upi' && [styles.modeTabActive, { backgroundColor: colors.surface }]]}
              >
                <Text style={[styles.modeTabText, { color: withdrawMode === 'upi' ? colors.primary : colors.textSecondary }]}>
                  Instant UPI ID
                </Text>
              </TouchableOpacity>
            </View>

            {/* Amount input */}
            <View style={styles.withdrawAmountHeader}>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>TRANSFER AMOUNT (INR)</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => setWithdrawAmountStr(balance.toString())}>
                <Text style={[styles.useMaxBtn, { color: colors.primary }]}>Use Max (₹{balance.toLocaleString('en-IN')})</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.amountInputRow, { backgroundColor: colors.surfaceVariant, borderColor: colors.border, borderRadius: borderRadius.md }]}>
              <Text style={styles.currencyPrefix}>₹</Text>
              <TextInput
                value={withdrawAmountStr}
                onChangeText={setWithdrawAmountStr}
                keyboardType="numeric"
                placeholder="e.g. 1000"
                placeholderTextColor={colors.textMuted}
                style={[styles.amountInputText, { color: colors.textPrimary }]}
              />
            </View>

            {withdrawMode === 'bank' ? (
              <ScrollView style={{ maxHeight: 220, marginTop: 10 }}>
                {/* Account Holder Name */}
                <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 4 }]}>ACCOUNT HOLDER NAME</Text>
                <TextInput
                  value={accountHolder}
                  onChangeText={setAccountHolder}
                  placeholder="e.g. KD"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.fieldInput, { backgroundColor: colors.surfaceVariant, borderColor: colors.border, color: colors.textPrimary, borderRadius: borderRadius.sm }]}
                />

                {/* Account Number */}
                <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 8, marginBottom: 4 }]}>ACCOUNT NUMBER</Text>
                <TextInput
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                  keyboardType="numeric"
                  placeholder="Enter Bank Account Number"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.fieldInput, { backgroundColor: colors.surfaceVariant, borderColor: colors.border, color: colors.textPrimary, borderRadius: borderRadius.sm }]}
                />

                {/* Confirm Account Number */}
                <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 8, marginBottom: 4 }]}>CONFIRM ACCOUNT NUMBER</Text>
                <TextInput
                  value={confirmAccountNumber}
                  onChangeText={setConfirmAccountNumber}
                  keyboardType="numeric"
                  placeholder="Re-enter Bank Account Number"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.fieldInput, { backgroundColor: colors.surfaceVariant, borderColor: colors.border, color: colors.textPrimary, borderRadius: borderRadius.sm }]}
                />

                {/* IFSC Code */}
                <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 8, marginBottom: 4 }]}>IFSC CODE</Text>
                <TextInput
                  value={ifscCode}
                  onChangeText={t => setIfscCode(t.toUpperCase())}
                  autoCapitalize="characters"
                  placeholder="e.g. HDFC0001234"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.fieldInput, { backgroundColor: colors.surfaceVariant, borderColor: colors.border, color: colors.textPrimary, borderRadius: borderRadius.sm }]}
                />
              </ScrollView>
            ) : (
              <View style={{ marginTop: 12 }}>
                <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 4 }]}>RECEIVER UPI ID (VPA)</Text>
                <TextInput
                  value={withdrawUpiId}
                  onChangeText={setWithdrawUpiId}
                  autoCapitalize="none"
                  placeholder="e.g. yourname@okhdfcbank or 9876543210@paytm"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.fieldInput, { backgroundColor: colors.surfaceVariant, borderColor: colors.border, color: colors.textPrimary, borderRadius: borderRadius.sm }]}
                />
              </View>
            )}

            {/* Transfer Action Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleWithdrawFunds}
              disabled={withdrawing}
              style={[styles.modalActionBtn, { backgroundColor: '#176B50', borderRadius: borderRadius.md, marginTop: 16 }]}
            >
              {withdrawing ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.modalActionBtnText}>
                  Transfer ₹{parseFloat(withdrawAmountStr) || 0} to Bank (0% Fee)
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  walletCard: {
    padding: 22,
    borderWidth: 1,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 12,
  },
  walletHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  walletBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  walletBadgeText: {
    color: '#D4AF37',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  securePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  securePillText: {
    color: '#A7F3D0',
    fontSize: 10,
    fontWeight: '700',
  },
  balanceLabel: {
    color: '#B8E7D3',
    fontSize: 13,
    fontWeight: '600',
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '900',
    marginTop: 4,
    letterSpacing: -0.5,
  },
  balanceSubtitle: {
    color: '#A0D8C0',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 18,
  },
  walletActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  walletBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  addBtn: {
    backgroundColor: '#2BB07C',
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  withdrawBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  withdrawBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  infoCard: {
    padding: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  infoFeatureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
  },
  infoFeatureIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historySection: {
    width: '100%',
  },
  filtersScroll: {
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 12,
  },
  emptyBox: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  txIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txRef: {
    fontSize: 10,
    marginTop: 3,
  },
  completedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  completedBadgeText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalCard: {
    width: Math.min(SCREEN_WIDTH - 32, 400),
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
    elevation: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalHeaderIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtn: {
    padding: 4,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 52,
  },
  currencyPrefix: {
    fontSize: 22,
    fontWeight: '800',
    color: '#10B981',
    marginRight: 6,
  },
  amountInputText: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
    paddingVertical: 0,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  methodSelectRow: {
    width: '100%',
  },
  methodSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    gap: 10,
  },
  methodSelectText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalActionBtn: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  modalActionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  modeTabsRow: {
    flexDirection: 'row',
    padding: 4,
    marginTop: 14,
    marginBottom: 14,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  modeTabActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  modeTabText: {
    fontSize: 11,
    fontWeight: '700',
  },
  withdrawAmountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  useMaxBtn: {
    fontSize: 11,
    fontWeight: '700',
  },
  fieldInput: {
    height: 44,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '500',
  },
});

