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
import { CurrencySelector } from '../../../components/inputs/CurrencySelector';
import { SplitMethodSelector } from '../../../components/inputs/SplitMethodSelector';
import { Avatar } from '../../../components/avatars/Avatar';
import { Icon, IconName } from '../../../components/common/Icon';
import { ProPaywallModal } from '../../../components/modals/ProPaywallModal';
import { ContactsPickerModal } from '../../../components/modals/ContactsPickerModal';
import { PhoneContact } from '../../../services/native/contactsService';
import {
  ExpenseCategory,
  SplitMethod,
  CurrencyCode,
  ExpenseParticipant,
  ProFeature,
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
type AddExpenseRouteProp = RouteProp<RootStackParamList, 'AddExpense'>;

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

export const AddExpenseScreen: React.FC = () => {
  const route = useRoute<AddExpenseRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();

  const { preselectedGroupId, preselectedFriendId } = route.params || {};
  const { groups, friends, createExpense } = useAppStore();
  const currentUser = useAuthStore(state => state.currentUser);
  const isPro = useAuthStore(state => state.isPro);

  const [showProModal, setShowProModal] = useState(false);
  const [proTriggerFeature, setProTriggerFeature] = useState<ProFeature>('receipt_ocr');

  const handleScanReceipt = () => {
    if (!isPro) {
      setProTriggerFeature('receipt_ocr');
      setShowProModal(true);
      return;
    }
    // Pro member simulated AI OCR extraction
    setTitle('Olive Garden Dinner & Drinks');
    setAmountStr('2450');
    setCategory('Food');
    setNotes('Scanned via SplitMate Pro AI OCR (Tax & Service included)');
    Alert.alert(
      '🧾 Receipt Scanned Successfully',
      'AI OCR extracted ₹2,450 for Olive Garden Dinner. Amount and details auto-filled!'
    );
  };

  // Form states
  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('INR');
  const [category, setCategory] = useState<ExpenseCategory>('Food');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(preselectedGroupId || null);
  const [notes, setNotes] = useState('');
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('equally');

  // Payer state: 'me', 'other', or 'multiple'
  const [payerMode, setPayerMode] = useState<'me' | 'other' | 'multiple'>('me');
  const [singlePayerId, setSinglePayerId] = useState<string>(currentUser?.id || 'usr_me');
  const [multiplePayers, setMultiplePayers] = useState<Record<string, string>>({});

  // Split details states
  const [exactShares, setExactShares] = useState<Record<string, string>>({});
  const [percentages, setPercentages] = useState<Record<string, string>>({});
  const [sharesWeights, setSharesWeights] = useState<Record<string, string>>({});

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [customContacts, setCustomContacts] = useState<
    { userId: string; name: string; avatarUrl?: string }[]
  >([]);

  // Determine available participants
  const availableParticipants = useMemo(() => {
    const list: { userId: string; name: string; avatarUrl?: string }[] = [];
    if (currentUser) {
      list.push({ userId: currentUser.id, name: currentUser.name, avatarUrl: currentUser.avatarUrl });
    }

    const seenIds = new Set<string>([currentUser?.id || '']);
    const seenNames = new Set<string>([(currentUser?.name || '').toLowerCase()]);

    const addUnique = (item: { userId: string; name: string; avatarUrl?: string }) => {
      const nameKey = item.name.trim().toLowerCase();
      if (!seenIds.has(item.userId) && !seenNames.has(nameKey)) {
        seenIds.add(item.userId);
        seenNames.add(nameKey);
        list.push(item);
      }
    };

    if (selectedGroupId) {
      const grp = groups.find(g => g.id === selectedGroupId);
      if (grp) {
        for (const m of grp.members) {
          addUnique({ userId: m.userId, name: m.name, avatarUrl: m.avatarUrl });
        }
      }
    } else if (preselectedFriendId) {
      const fr = friends.find(f => f.id === preselectedFriendId);
      if (fr) {
        addUnique({ userId: fr.userId, name: fr.name, avatarUrl: fr.avatarUrl });
      }
    } else {
      // Allow adding active friends
      for (const fr of friends) {
        addUnique({ userId: fr.userId, name: fr.name, avatarUrl: fr.avatarUrl });
      }
    }

    for (const c of customContacts) {
      addUnique(c);
    }

    return list;
  }, [selectedGroupId, preselectedFriendId, groups, friends, currentUser, customContacts]);

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

  // Selected participant IDs for split
  const [includedParticipantIds, setIncludedParticipantIds] = useState<string[]>(
    availableParticipants.map(p => p.userId)
  );

  const toggleParticipant = (userId: string) => {
    if (includedParticipantIds.includes(userId)) {
      if (includedParticipantIds.length <= 1) {
        Alert.alert('Required', 'At least one participant must be included.');
        return;
      }
      setIncludedParticipantIds(prev => prev.filter(id => id !== userId));
    } else {
      setIncludedParticipantIds(prev => [...prev, userId]);
    }
  };

  const parsedAmount = parseFloat(amountStr) || 0;

  // Real-time calculation of shares
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

  const totalPercentage = useMemo(() => {
    return includedParticipantIds.reduce(
      (sum, id) => sum + (parseFloat(percentages[id]) || 0),
      0
    );
  }, [includedParticipantIds, percentages]);

  const totalShares = useMemo(() => {
    return includedParticipantIds.reduce(
      (sum, id) => sum + (parseFloat(sharesWeights[id]) || 1),
      0
    );
  }, [includedParticipantIds, sharesWeights]);

  const perShareAmount = totalShares > 0 ? parsedAmount / totalShares : 0;

  const handleSave = async () => {
    if (!title.trim()) {
      setErrorMsg('Please enter an expense title');
      return;
    }
    if (parsedAmount <= 0) {
      setErrorMsg('Please enter a valid amount');
      return;
    }

    // Determine payers
    let paidList: { userId: string; amount: number }[] = [];
    if (payerMode === 'me') {
      paidList = [{ userId: currentUser?.id || 'usr_me', amount: parsedAmount }];
    } else if (payerMode === 'other') {
      paidList = [{ userId: singlePayerId, amount: parsedAmount }];
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
          shares: splitMethod === 'shares' ? parseFloat(sharesWeights[uid] ?? '1') || 1 : undefined,
          percentage: splitMethod === 'percentage' ? parseFloat(percentages[uid] ?? '0') || 0 : undefined,
          exactAmount: (splitMethod === 'exact' || splitMethod === 'unequally') ? parseFloat(exactShares[uid] ?? '0') || 0 : undefined,
        };
      });

      const selectedGroup = groups.find(g => g.id === selectedGroupId);

      await createExpense({
        title: title.trim(),
        totalAmount: parsedAmount,
        currency,
        date: new Date().toISOString(),
        category,
        groupId: selectedGroupId || null,
        groupName: selectedGroup?.name,
        notes: notes.trim() || undefined,
        createdBy: currentUser?.id || 'usr_me',
        splitMethod,
        participants: participantsData,
      });

      navigation.goBack();
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to save expense');
      setSaving(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader title="Add an Expense" showBack onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 6 }]}>
          DESCRIPTION / TITLE *
        </Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Dinner, Uber ride, Airbnb, Groceries"
          placeholderTextColor={colors.textMuted}
          style={[
            styles.titleInput,
            typography.bodyLarge,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: borderRadius.md,
              color: colors.textPrimary,
            },
          ]}
        />

        {/* AI Receipt Scanner Banner (Pro Feature) */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleScanReceipt}
          style={[
            styles.ocrBanner,
            {
              backgroundColor: isPro ? '#E7F5EF' : '#FFF9E6',
              borderColor: isPro ? '#239B68' : '#D4AF37',
              borderRadius: borderRadius.md,
              marginTop: 12,
            },
          ]}
        >
          <View style={[styles.ocrIconWrap, { backgroundColor: isPro ? '#C8EAD9' : '#FFF0C2' }]}>
            <Icon name="receipt" size={18} color={isPro ? '#176B50' : '#8F6B00'} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[typography.titleMedium, { color: isPro ? '#176B50' : '#8F6B00', fontSize: 13 }]}>
                Scan Receipt with AI OCR
              </Text>
              <View style={[styles.proBadgeSmall, { backgroundColor: isPro ? '#239B68' : '#D4AF37' }]}>
                <Text style={styles.proBadgeSmallText}>PRO</Text>
              </View>
            </View>
            <Text style={[typography.caption, { color: colors.textSecondary, fontSize: 11, marginTop: 1 }]}>
              {isPro
                ? 'Tap to scan bill and auto-extract totals and items'
                : 'Auto-scan receipts and extract amounts with SplitMate Pro'}
            </Text>
          </View>
          <Icon name="chevron-right" size={16} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Amount Input */}
        <Text
          style={[
            typography.caption,
            { color: colors.textSecondary, marginTop: spacing.md, marginBottom: 6 },
          ]}
        >
          TOTAL AMOUNT *
        </Text>
        <AmountInput
          value={amountStr}
          onChangeText={setAmountStr}
          currency={currency}
          placeholder="0.00"
        />

        {/* Currency Picker */}
        <View style={{ marginTop: spacing.sm }}>
          <CurrencySelector selectedCurrency={currency} onSelect={setCurrency} />
        </View>

        {/* Category Picker */}
        <Text
          style={[
            typography.caption,
            { color: colors.textSecondary, marginTop: spacing.md, marginBottom: 6 },
          ]}
        >
          CATEGORY
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
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

        {/* Group Selection */}
        <Text
          style={[
            typography.caption,
            { color: colors.textSecondary, marginTop: spacing.md, marginBottom: 6 },
          ]}
        >
          GROUP (OPTIONAL)
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
          <TouchableOpacity
            activeOpacity={0.7}
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
                {
                  color: selectedGroupId === null ? '#FFFFFF' : colors.textPrimary,
                  fontWeight: '600',
                },
              ]}
            >
              Non-group
            </Text>
          </TouchableOpacity>

          {groups.map(grp => {
            const isSelected = selectedGroupId === grp.id;
            return (
              <TouchableOpacity
                key={grp.id}
                activeOpacity={0.7}
                onPress={() => setSelectedGroupId(grp.id)}
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
                    {
                      color: isSelected ? '#FFFFFF' : colors.textPrimary,
                      fontWeight: '600',
                    },
                  ]}
                >
                  {grp.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Paid By Section */}
        <Text
          style={[
            typography.caption,
            { color: colors.textSecondary, marginTop: spacing.lg, marginBottom: 6 },
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

        {/* If 'other' selected, choose which person paid */}
        {payerMode === 'other' && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginVertical: 8 }}
          >
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
                          fontWeight: '600',
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

        {/* If 'multiple' selected, enter amounts each person paid */}
        {payerMode === 'multiple' && (
          <View style={{ marginVertical: 8 }}>
            {includedParticipantIds.map(uid => {
              const p = availableParticipants.find(part => part.userId === uid);
              return (
                <View key={uid} style={styles.participantRow}>
                  <Avatar name={p?.name || 'User'} size={32} />
                  <Text style={[typography.bodyMedium, { color: colors.textPrimary, flex: 1, marginLeft: 8 }]}>
                    {p?.name}
                  </Text>
                  <TextInput
                    value={multiplePayers[uid] || ''}
                    onChangeText={txt =>
                      setMultiplePayers(prev => ({ ...prev, [uid]: txt }))
                    }
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
            { color: colors.textSecondary, marginTop: spacing.lg, marginBottom: 4 },
          ]}
        >
          SPLIT METHOD
        </Text>
        <SplitMethodSelector selectedMethod={splitMethod} onSelect={setSplitMethod} />

        {/* Participants Selection & Calculated Shares Breakdown */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: spacing.md,
            marginBottom: 8,
          }}
        >
          <Text
            style={[
              typography.caption,
              { color: colors.textSecondary },
            ]}
          >
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

        {/* Live Method Summary Banner */}
        {splitMethod === 'shares' && (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: colors.surfaceVariant,
              paddingHorizontal: spacing.md,
              paddingVertical: 10,
              borderRadius: borderRadius.md,
              marginBottom: spacing.sm,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Icon name="pie-chart" size={16} color={colors.primary} />
              <Text
                style={[
                  typography.caption,
                  { color: colors.textPrimary, fontWeight: '700', marginLeft: 6 },
                ]}
              >
                Total: {totalShares} {totalShares === 1 ? 'share' : 'shares'}
              </Text>
            </View>
            <Text style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}>
              {formatMoney(perShareAmount, currency)} / share
            </Text>
          </View>
        )}

        {splitMethod === 'percentage' && (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor:
                Math.round(totalPercentage) === 100
                  ? colors.primaryLight
                  : colors.surfaceVariant,
              paddingHorizontal: spacing.md,
              paddingVertical: 10,
              borderRadius: borderRadius.md,
              marginBottom: spacing.sm,
              borderWidth: 1,
              borderColor:
                Math.round(totalPercentage) === 100
                  ? colors.primary
                  : totalPercentage > 100
                  ? colors.danger
                  : colors.border,
            }}
          >
            <Text
              style={[
                typography.caption,
                {
                  color:
                    totalPercentage > 100
                      ? colors.danger
                      : colors.textPrimary,
                  fontWeight: '700',
                },
              ]}
            >
              Total Allocated: {totalPercentage.toFixed(1)}% / 100%
            </Text>
            <Text
              style={[
                typography.caption,
                {
                  color:
                    Math.round(totalPercentage) === 100
                      ? colors.primary
                      : totalPercentage > 100
                      ? colors.danger
                      : colors.textSecondary,
                  fontWeight: '700',
                },
              ]}
            >
              {Math.round(totalPercentage) === 100
                ? 'Balanced ✓'
                : totalPercentage > 100
                ? `${(totalPercentage - 100).toFixed(1)}% over`
                : `${(100 - totalPercentage).toFixed(1)}% left`}
            </Text>
          </View>
        )}

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

              {/* Custom inputs depending on split method */}
              {isIncluded && splitMethod === 'exact' && (
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
                  <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginLeft: 4 }]}>
                    %
                  </Text>
                </View>
              )}

              {/* Shares stepper for each member */}
              {isIncluded && splitMethod === 'shares' && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.surfaceVariant,
                    borderRadius: borderRadius.full,
                    paddingHorizontal: 4,
                    paddingVertical: 2,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      const current = parseFloat(sharesWeights[participant.userId] ?? '1') || 1;
                      const next = Math.max(1, current - 1);
                      setSharesWeights(prev => ({ ...prev, [participant.userId]: String(next) }));
                    }}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: colors.surface,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Icon name="minus" size={12} color={colors.textPrimary} />
                  </TouchableOpacity>

                  <View style={{ minWidth: 46, alignItems: 'center', paddingHorizontal: 4 }}>
                    <Text
                      style={[
                        typography.bodySmall,
                        { color: colors.textPrimary, fontWeight: '700' },
                      ]}
                    >
                      {sharesWeights[participant.userId] || '1'}
                    </Text>
                    <Text
                      style={{
                        fontSize: 8,
                        color: colors.textSecondary,
                        marginTop: -2,
                        textTransform: 'uppercase',
                        fontWeight: '600',
                      }}
                    >
                      {(sharesWeights[participant.userId] || '1') === '1' ? 'share' : 'shares'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      const current = parseFloat(sharesWeights[participant.userId] ?? '1') || 1;
                      const next = current + 1;
                      setSharesWeights(prev => ({ ...prev, [participant.userId]: String(next) }));
                    }}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: colors.primary,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Icon name="plus" size={12} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}

        {/* Notes input */}
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
          placeholder="Add receipt note, tax details or link..."
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

        {/* Validation Error banner if present */}
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

        {/* Save button */}
        <Button
          title={`Save Expense (${formatMoney(parsedAmount, currency)})`}
          onPress={handleSave}
          loading={saving}
          style={{ marginTop: spacing.xl, marginBottom: 40 }}
        />
      </ScrollView>

      {/* Pro Paywall Modal */}
      <ProPaywallModal
        visible={showProModal}
        feature={proTriggerFeature}
        onClose={() => setShowProModal(false)}
        onNavigateToPlans={() => navigation.navigate('Subscription')}
      />

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
  titleInput: {
    height: 48,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  ocrBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
  },
  ocrIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proBadgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 6,
  },
  proBadgeSmallText: {
    color: '#122E24',
    fontSize: 9,
    fontWeight: '800',
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  groupPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    marginRight: 8,
  },
  payerModeRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  payerModeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  payerSelectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
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
