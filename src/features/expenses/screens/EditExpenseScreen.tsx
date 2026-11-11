import React, { useState, useMemo } from 'react';
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
import { SplitMethodSelector } from '../../../components/inputs/SplitMethodSelector';
import { Avatar } from '../../../components/avatars/Avatar';
import { Icon, IconName } from '../../../components/common/Icon';
import { ContactsPickerModal } from '../../../components/modals/ContactsPickerModal';
import { PhoneContact } from '../../../services/native/contactsService';
import {
  ExpenseCategory,
  SplitMethod,
  ExpenseParticipant,
} from '../../../types';
import { formatMoney } from '../../../utils/money';
import {
  calculateEqualSplit,
  calculateExactSplit,
  calculatePercentageSplit,
  calculateShareSplit,
  validateExpense,
} from '../calculations/splitEngine';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type EditExpenseRouteProp = RouteProp<RootStackParamList, 'EditExpense'>;

const CATEGORIES: { key: ExpenseCategory; label: string; icon: IconName }[] = [
  { key: 'Food', label: 'Food', icon: 'food' },
  { key: 'Groceries', label: 'Groceries', icon: 'food' },
  { key: 'Transport', label: 'Transport', icon: 'travel' },
  { key: 'Travel', label: 'Travel', icon: 'travel' },
  { key: 'Rent', label: 'Rent', icon: 'home-cat' },
  { key: 'Utilities', label: 'Utilities', icon: 'utilities' },
  { key: 'Shopping', label: 'Shopping', icon: 'shopping' },
  { key: 'Entertainment', label: 'Fun', icon: 'entertainment' },
  { key: 'Medical', label: 'Medical', icon: 'medical' },
  { key: 'Other', label: 'Other', icon: 'receipt' },
];

export const EditExpenseScreen: React.FC = () => {
  const route = useRoute<EditExpenseRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { colors, typography, spacing, borderRadius } = useTheme();

  const { expenseId } = route.params;
  const { expenses, groups, friends, updateExpense } = useAppStore();
  const currentUser = useAuthStore(state => state.currentUser);
  const expense = expenses.find(e => e.id === expenseId);

  // Core fields
  const [title, setTitle] = useState(expense?.title || '');
  const [amountStr, setAmountStr] = useState(expense ? expense.totalAmount.toString() : '');
  const [category, setCategory] = useState<ExpenseCategory>(expense?.category || 'Food');
  const [notes, setNotes] = useState(expense?.notes || '');
  const [splitMethod, setSplitMethod] = useState<SplitMethod>(expense?.splitMethod || 'equally');

  // Contact Picker Modal
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [customContacts, setCustomContacts] = useState<
    { userId: string; name: string; avatarUrl?: string }[]
  >([]);

  // Payer configuration
  const initialPayerSetup = useMemo(() => {
    if (!expense) return { mode: 'me' as const, singlePayer: currentUser?.id || '', multiple: {} };
    const payers = expense.participants.filter(p => p.paidAmount > 0);
    if (payers.length <= 1) {
      const payer = payers[0] || expense.participants[0];
      if (payer && payer.userId === currentUser?.id) {
        return { mode: 'me' as const, singlePayer: payer.userId, multiple: {} };
      }
      return {
        mode: 'other' as const,
        singlePayer: payer?.userId || '',
        multiple: {},
      };
    }
    const mult: Record<string, string> = {};
    for (const p of expense.participants) {
      mult[p.userId] = p.paidAmount ? p.paidAmount.toString() : '';
    }
    return { mode: 'multiple' as const, singlePayer: '', multiple: mult };
  }, [expense, currentUser]);

  const [payerMode, setPayerMode] = useState<'me' | 'other' | 'multiple'>(initialPayerSetup.mode);
  const [singlePayerId, setSinglePayerId] = useState<string>(initialPayerSetup.singlePayer);
  const [multiplePayers, setMultiplePayers] = useState<Record<string, string>>(initialPayerSetup.multiple);

  // Available participants list (merging existing expense participants + group/friends + custom contacts)
  const availableParticipants = useMemo(() => {
    const list: { userId: string; name: string; avatarUrl?: string }[] = [];
    const seenIds = new Set<string>();
    const seenNames = new Set<string>();

    const addUnique = (item: { userId: string; name: string; avatarUrl?: string }) => {
      const nameKey = item.name.trim().toLowerCase();
      if (!seenIds.has(item.userId) && !seenNames.has(nameKey)) {
        seenIds.add(item.userId);
        seenNames.add(nameKey);
        list.push(item);
      }
    };

    // 1. Existing expense participants
    if (expense?.participants) {
      for (const p of expense.participants) {
        addUnique({ userId: p.userId, name: p.name, avatarUrl: p.avatarUrl });
      }
    }

    // 2. Group members if group expense
    if (expense?.groupId) {
      const grp = groups.find(g => g.id === expense.groupId);
      if (grp) {
        for (const m of grp.members) {
          addUnique({ userId: m.userId, name: m.name, avatarUrl: m.avatarUrl });
        }
      }
    } else {
      // 3. Friends
      for (const f of friends) {
        addUnique({ userId: f.userId, name: f.name, avatarUrl: f.avatarUrl });
      }
    }

    // 4. Custom contacts added during edit
    for (const c of customContacts) {
      addUnique(c);
    }

    return list;
  }, [expense, groups, friends, customContacts]);

  // Selected participants for split
  const [includedParticipantIds, setIncludedParticipantIds] = useState<string[]>(
    expense?.participants.map(p => p.userId) || []
  );

  // Split details: Exact amounts, percentages, shares
  const [exactShares, setExactShares] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    if (expense) {
      for (const p of expense.participants) {
        map[p.userId] = p.shareAmount.toString();
      }
    }
    return map;
  });
  const [percentages, setPercentages] = useState<Record<string, string>>({});
  const [sharesWeights, setSharesWeights] = useState<Record<string, string>>({});

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const parsedAmount = parseFloat(amountStr) || 0;
  const currency = expense?.currency || 'INR';

  const toggleParticipant = (userId: string) => {
    if (includedParticipantIds.includes(userId)) {
      if (includedParticipantIds.length <= 1) {
        Alert.alert('Required', 'At least one member must be in the split.');
        return;
      }
      setIncludedParticipantIds(prev => prev.filter(id => id !== userId));
    } else {
      setIncludedParticipantIds(prev => [...prev, userId]);
    }
  };

  const handleSelectContact = (contact: PhoneContact) => {
    setShowContactsModal(false);
    const contactUserId = `contact_${contact.id || Date.now()}`;
    const newContact = {
      userId: contactUserId,
      name: contact.name,
      avatarUrl: undefined,
    };
    setCustomContacts(prev => [...prev, newContact]);
    setIncludedParticipantIds(prev =>
      prev.includes(contactUserId) ? prev : [...prev, contactUserId]
    );
  };

  // Real-time calculation of member shares
  const calculatedOutput = useMemo(() => {
    if (parsedAmount <= 0 || includedParticipantIds.length === 0) {
      return { shares: {}, isValid: false };
    }

    if (splitMethod === 'equally') {
      return calculateEqualSplit(parsedAmount, includedParticipantIds, currency);
    }
    if (splitMethod === 'exact' || splitMethod === 'unequally') {
      const exactNums: Record<string, number> = {};
      for (const uid of includedParticipantIds) {
        exactNums[uid] = parseFloat(exactShares[uid]) || 0;
      }
      return calculateExactSplit(parsedAmount, exactNums, currency);
    }
    if (splitMethod === 'percentage') {
      const pctNums: Record<string, number> = {};
      for (const uid of includedParticipantIds) {
        pctNums[uid] = parseFloat(percentages[uid]) || 0;
      }
      return calculatePercentageSplit(parsedAmount, pctNums, currency);
    }
    if (splitMethod === 'shares') {
      const shareNums: Record<string, number> = {};
      for (const uid of includedParticipantIds) {
        shareNums[uid] = parseFloat(sharesWeights[uid]) || 1;
      }
      return calculateShareSplit(parsedAmount, shareNums, currency);
    }
    return { shares: {}, isValid: false };
  }, [
    parsedAmount,
    splitMethod,
    includedParticipantIds,
    exactShares,
    percentages,
    sharesWeights,
    currency,
  ]);

  const handleSave = async () => {
    if (!title.trim()) {
      setErrorMsg('Please enter an expense title');
      return;
    }
    if (parsedAmount <= 0) {
      setErrorMsg('Please enter a valid amount');
      return;
    }
    if (includedParticipantIds.length === 0) {
      setErrorMsg('Please select at least one member to split with');
      return;
    }

    // Determine payers
    let paidList: { userId: string; amount: number }[] = [];
    if (payerMode === 'me') {
      paidList = [{ userId: currentUser?.id || 'usr_me', amount: parsedAmount }];
    } else if (payerMode === 'other') {
      paidList = [{ userId: singlePayerId || includedParticipantIds[0], amount: parsedAmount }];
    } else {
      paidList = includedParticipantIds.map(uid => ({
        userId: uid,
        amount: parseFloat(multiplePayers[uid]) || 0,
      }));
    }

    const validation = validateExpense({
      title: title.trim(),
      totalAmount: parsedAmount,
      paidBy: paidList,
      splitMethod,
      splitDetails: {
        participantIds: includedParticipantIds,
        exactAmounts: Object.fromEntries(
          includedParticipantIds.map(id => [id, parseFloat(exactShares[id]) || 0])
        ),
        percentages: Object.fromEntries(
          includedParticipantIds.map(id => [id, parseFloat(percentages[id]) || 0])
        ),
        shares: Object.fromEntries(
          includedParticipantIds.map(id => [id, parseFloat(sharesWeights[id]) || 1])
        ),
      },
      currency,
    });

    if (!validation.isValid) {
      setErrorMsg(validation.errors.join('\n'));
      return;
    }

    if (!expense) return;

    setSaving(true);
    setErrorMsg(null);

    try {
      const participantsData: ExpenseParticipant[] = includedParticipantIds.map(uid => {
        const pObj = availableParticipants.find(p => p.userId === uid);
        const payerObj = paidList.find(p => p.userId === uid);
        const paidAmount = payerObj ? payerObj.amount : 0;
        const shareAmount = validation.calculatedShares?.[uid] || 0;
        return {
          userId: uid,
          name: pObj?.name || 'Member',
          avatarUrl: pObj?.avatarUrl,
          paidAmount,
          shareAmount,
          netBalance: paidAmount - shareAmount,
        };
      });

      await updateExpense(expenseId, {
        title: title.trim(),
        totalAmount: parsedAmount,
        category,
        splitMethod,
        notes: notes.trim() || undefined,
        participants: participantsData,
      });

      setSaving(false);
      navigation.goBack();
    } catch (err: any) {
      setSaving(false);
      setErrorMsg(err.message || 'Failed to update expense');
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader title="Edit Expense" showBack onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title / Description */}
        <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 6 }]}>
          EXPENSE TITLE / DESCRIPTION *
        </Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Dinner, Grocery, Movie Tickets"
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            typography.bodyLarge,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: borderRadius.md,
              color: colors.textPrimary,
            },
          ]}
        />

        {/* Total Amount */}
        <Text
          style={[
            typography.caption,
            { color: colors.textSecondary, marginTop: spacing.lg, marginBottom: 6 },
          ]}
        >
          TOTAL AMOUNT ({currency}) *
        </Text>
        <AmountInput
          value={amountStr}
          onChangeText={setAmountStr}
          currency={currency}
        />

        {/* Category Selector */}
        <Text
          style={[
            typography.caption,
            { color: colors.textSecondary, marginTop: spacing.lg, marginBottom: 8 },
          ]}
        >
          CATEGORY
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {CATEGORIES.map(cat => {
            const isSelected = category === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                activeOpacity={0.7}
                onPress={() => setCategory(cat.key)}
                style={[
                  styles.catPill,
                  {
                    backgroundColor: isSelected ? colors.primaryLight : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderRadius: borderRadius.full,
                  },
                ]}
              >
                <Icon
                  name={cat.icon}
                  size={16}
                  color={isSelected ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    typography.caption,
                    {
                      color: isSelected ? colors.primary : colors.textPrimary,
                      fontWeight: isSelected ? '700' : '500',
                      marginLeft: 6,
                    },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Paid By Selector */}
        <Text
          style={[
            typography.caption,
            { color: colors.textSecondary, marginTop: spacing.xl, marginBottom: 8 },
          ]}
        >
          PAID BY
        </Text>
        <View style={styles.payerModeRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setPayerMode('me')}
            style={[
              styles.payerModeBtn,
              {
                backgroundColor: payerMode === 'me' ? colors.primaryLight : colors.surface,
                borderColor: payerMode === 'me' ? colors.primary : colors.border,
                borderRadius: borderRadius.sm,
              },
            ]}
          >
            <Text
              style={[
                typography.caption,
                {
                  color: payerMode === 'me' ? colors.primary : colors.textSecondary,
                  fontWeight: '700',
                },
              ]}
            >
              You paid full
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setPayerMode('other')}
            style={[
              styles.payerModeBtn,
              {
                backgroundColor: payerMode === 'other' ? colors.primaryLight : colors.surface,
                borderColor: payerMode === 'other' ? colors.primary : colors.border,
                borderRadius: borderRadius.sm,
              },
            ]}
          >
            <Text
              style={[
                typography.caption,
                {
                  color: payerMode === 'other' ? colors.primary : colors.textSecondary,
                  fontWeight: '700',
                },
              ]}
            >
              Someone else
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setPayerMode('multiple')}
            style={[
              styles.payerModeBtn,
              {
                backgroundColor: payerMode === 'multiple' ? colors.primaryLight : colors.surface,
                borderColor: payerMode === 'multiple' ? colors.primary : colors.border,
                borderRadius: borderRadius.sm,
              },
            ]}
          >
            <Text
              style={[
                typography.caption,
                {
                  color: payerMode === 'multiple' ? colors.primary : colors.textSecondary,
                  fontWeight: '700',
                },
              ]}
            >
              Multiple people
            </Text>
          </TouchableOpacity>
        </View>

        {/* If 'other' selected, choose single payer */}
        {payerMode === 'other' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
            {availableParticipants
              .filter(p => p.userId !== currentUser?.id)
              .map(p => {
                const isSelected = singlePayerId === p.userId;
                return (
                  <TouchableOpacity
                    key={p.userId}
                    onPress={() => setSinglePayerId(p.userId)}
                    style={[
                      styles.payerSelectPill,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.surfaceVariant,
                        borderRadius: borderRadius.full,
                      },
                    ]}
                  >
                    <Avatar name={p.name} size={24} />
                    <Text
                      style={[
                        typography.caption,
                        {
                          color: isSelected ? '#FFFFFF' : colors.textPrimary,
                          fontWeight: isSelected ? '700' : '500',
                          marginLeft: 6,
                        },
                      ]}
                    >
                      {p.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
          </ScrollView>
        )}

        {/* If 'multiple' selected, input who paid what */}
        {payerMode === 'multiple' && (
          <View style={{ marginVertical: 12 }}>
            <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 8 }]}>
              ENTER AMOUNT PAID BY EACH PERSON
            </Text>
            {includedParticipantIds.map(uid => {
              const p = availableParticipants.find(part => part.userId === uid);
              return (
                <View key={uid} style={styles.participantRow}>
                  <Avatar name={p?.name || 'Member'} size={32} />
                  <Text style={[typography.bodyMedium, { flex: 1, marginLeft: 8, color: colors.textPrimary }]}>
                    {uid === currentUser?.id ? 'You' : p?.name}
                  </Text>
                  <TextInput
                    value={multiplePayers[uid] || ''}
                    onChangeText={val => setMultiplePayers(prev => ({ ...prev, [uid]: val }))}
                    placeholder="0.00"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                    style={[
                      styles.smallInput,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        borderRadius: borderRadius.sm,
                        color: colors.textPrimary,
                      },
                    ]}
                  />
                </View>
              );
            })}
          </View>
        )}

        {/* Split Method Selector */}
        <Text
          style={[
            typography.caption,
            { color: colors.textSecondary, marginTop: spacing.lg, marginBottom: 8 },
          ]}
        >
          SPLIT METHOD
        </Text>
        <SplitMethodSelector selectedMethod={splitMethod} onSelect={setSplitMethod} />

        {/* Split Between Members Header + From Contacts Button */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: spacing.md,
            marginBottom: 8,
          }}
        >
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            SPLIT BETWEEN ({includedParticipantIds.length} PEOPLE)
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowContactsModal(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.primaryLight,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: borderRadius.full,
            }}
          >
            <Icon name="phone" size={13} color={colors.primary} />
            <Text
              style={[
                typography.caption,
                { color: colors.primary, fontWeight: '700', marginLeft: 4 },
              ]}
            >
              + From Contacts
            </Text>
          </TouchableOpacity>
        </View>

        {/* Participants Cards with Custom Money / Share Inputs */}
        {availableParticipants.map(participant => {
          const isIncluded = includedParticipantIds.includes(participant.userId);
          const sharesObj = calculatedOutput.shares as Record<string, number> | undefined;
          const share = sharesObj?.[participant.userId] || 0;

          return (
            <View
              key={participant.userId}
              style={[
                styles.splitParticipantCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: isIncluded ? colors.border : colors.borderSubtle,
                  borderRadius: borderRadius.md,
                },
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => toggleParticipant(participant.userId)}
                style={styles.splitParticipantLeft}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: isIncluded ? colors.primary : colors.border,
                      backgroundColor: isIncluded ? colors.primary : 'transparent',
                      borderRadius: borderRadius.xs,
                      marginRight: 10,
                    },
                  ]}
                >
                  {isIncluded && <Icon name="check" size={14} color="#FFFFFF" />}
                </View>

                <Avatar name={participant.name} size={36} />
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={[typography.titleMedium, { color: colors.textPrimary }]}>
                    {participant.userId === currentUser?.id ? 'You' : participant.name}
                  </Text>
                  {isIncluded && (
                    <Text style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}>
                      Share: {formatMoney(share, currency)}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>

              {/* Exact money input for each member */}
              {isIncluded && (splitMethod === 'exact' || splitMethod === 'unequally') && (
                <TextInput
                  value={exactShares[participant.userId] || ''}
                  onChangeText={val =>
                    setExactShares(prev => ({ ...prev, [participant.userId]: val }))
                  }
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  style={[
                    styles.smallInput,
                    {
                      backgroundColor: colors.surfaceVariant,
                      borderColor: colors.border,
                      borderRadius: borderRadius.sm,
                      color: colors.textPrimary,
                    },
                  ]}
                />
              )}

              {/* Percentage input for each member */}
              {isIncluded && splitMethod === 'percentage' && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TextInput
                    value={percentages[participant.userId] || ''}
                    onChangeText={val =>
                      setPercentages(prev => ({ ...prev, [participant.userId]: val }))
                    }
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                    style={[
                      styles.smallInput,
                      {
                        backgroundColor: colors.surfaceVariant,
                        borderColor: colors.border,
                        borderRadius: borderRadius.sm,
                        color: colors.textPrimary,
                        width: 50,
                      },
                    ]}
                  />
                  <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: 4 }]}>
                    %
                  </Text>
                </View>
              )}

              {/* Shares input for each member */}
              {isIncluded && splitMethod === 'shares' && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TextInput
                    value={sharesWeights[participant.userId] || '1'}
                    onChangeText={val =>
                      setSharesWeights(prev => ({ ...prev, [participant.userId]: val }))
                    }
                    placeholder="1"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    style={[
                      styles.smallInput,
                      {
                        backgroundColor: colors.surfaceVariant,
                        borderColor: colors.border,
                        borderRadius: borderRadius.sm,
                        color: colors.textPrimary,
                        width: 50,
                      },
                    ]}
                  />
                  <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: 4 }]}>
                    pts
                  </Text>
                </View>
              )}
            </View>
          );
        })}

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
          placeholder="Receipt notes, tax info or links..."
          placeholderTextColor={colors.textMuted}
          multiline
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
          <View
            style={[
              styles.errorBanner,
              { backgroundColor: colors.dangerLight, borderRadius: borderRadius.md },
            ]}
          >
            <Icon name="alert" size={18} color={colors.danger} />
            <Text style={[typography.caption, { color: colors.danger, marginLeft: 8, flex: 1 }]}>
              {errorMsg}
            </Text>
          </View>
        )}

        <Button
          title={`Save Changes (${formatMoney(parsedAmount, currency)})`}
          onPress={handleSave}
          loading={saving}
          style={{ marginTop: spacing.xl, marginBottom: 40 }}
        />
      </ScrollView>

      {/* Device Contacts Picker Modal */}
      <ContactsPickerModal
        visible={showContactsModal}
        onClose={() => setShowContactsModal(false)}
        onSelectContact={handleSelectContact}
      />
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
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  payerModeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  payerModeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginHorizontal: 3,
  },
  payerSelectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  smallInput: {
    height: 38,
    width: 80,
    borderWidth: 1,
    paddingHorizontal: 8,
    textAlign: 'right',
  },
  splitParticipantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  splitParticipantLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notesInput: {
    height: 60,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
    textAlignVertical: 'top',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginTop: 12,
  },
});
