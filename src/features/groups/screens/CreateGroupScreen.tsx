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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../app/navigation/types';
import { useTheme } from '../../../theme';
import { useAppStore } from '../../../store/useAppStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { AppHeader } from '../../../components/common/AppHeader';
import { Button } from '../../../components/buttons/Button';
import { CurrencySelector } from '../../../components/inputs/CurrencySelector';
import { GroupCategory, CurrencyCode, GroupMember } from '../../../types';
import { Icon, IconName } from '../../../components/common/Icon';
import { ContactsPickerModal } from '../../../components/modals/ContactsPickerModal';
import { PhoneContact } from '../../../services/native/contactsService';
import { locationService } from '../../../services/native/locationService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const GROUP_CATEGORIES: { key: GroupCategory; label: string; icon: IconName }[] = [
  { key: 'Trip', label: 'Trip', icon: 'travel' },
  { key: 'Home', label: 'Home', icon: 'home-cat' },
  { key: 'Couple', label: 'Couple', icon: 'profile' },
  { key: 'Family', label: 'Family', icon: 'groups' },
  { key: 'Friends', label: 'Friends', icon: 'users' },
  { key: 'Office', label: 'Office', icon: 'shield' },
  { key: 'Other', label: 'Other', icon: 'sparkles' },
];

export const CreateGroupScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors, typography, spacing, borderRadius } = useTheme();

  const { createGroup, friends, addFriend } = useAppStore();
  const currentUser = useAuthStore(state => state.currentUser);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<GroupCategory>('Trip');
  const [currency, setCurrency] = useState<CurrencyCode>('INR');
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showContactsModal, setShowContactsModal] = useState(false);

  const handleDetectLocation = async () => {
    try {
      const res = await locationService.detectCountryAndCurrency();
      setCurrency(res.suggestedCurrency);
      Alert.alert(
        'Location Detected',
        `Country: ${res.countryName}\nCurrency set to ${res.suggestedCurrency} (${res.currencySymbol})`
      );
    } catch {}
  };

  const handleSelectContact = async (contact: PhoneContact) => {
    try {
      const newFriend = await addFriend({
        userId: `usr_${Date.now()}`,
        name: contact.name,
        email: contact.email || `${contact.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        phoneNumber: contact.phoneNumber,
        currency,
      });
      setSelectedFriendIds(prev => [...prev, newFriend.id]);
    } catch {}
  };

  const toggleFriend = (id: string) => {
    setSelectedFriendIds(prev =>
      prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Please provide a group name');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Build group members including current user
      const initialMembers: GroupMember[] = [
        {
          userId: currentUser?.id || 'usr_me',
          name: currentUser?.name || 'Alex Johnson',
          email: currentUser?.email || 'alex@example.com',
          role: 'admin',
          joinedAt: new Date().toISOString(),
        },
      ];

      // Add selected friends
      for (const friendId of selectedFriendIds) {
        const fr = friends.find(f => f.id === friendId);
        if (fr) {
          initialMembers.push({
            userId: fr.userId,
            name: fr.name,
            email: fr.email,
            role: 'member' as const,
            joinedAt: new Date().toISOString(),
          });
        }
      }

      const created = await createGroup({
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        currency,
        createdBy: currentUser?.id || 'usr_me',
        members: initialMembers,
      });

      navigation.replace('GroupDetails', { groupId: created.id });
    } catch (e: any) {
      setError(e.message || 'Failed to create group');
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader title="Create a Group" showBack onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Name Input */}
        <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 6 }]}>
          GROUP NAME *
        </Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Manali Roadtrip, Flat 301, Dinner Club"
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            typography.bodyLarge,
            {
              backgroundColor: colors.surface,
              borderColor: error ? colors.danger : colors.border,
              borderRadius: borderRadius.md,
              color: colors.textPrimary,
            },
          ]}
        />
        {error && (
          <Text style={[typography.caption, { color: colors.danger, marginTop: 4 }]}>
            {error}
          </Text>
        )}

        {/* Description Input */}
        <Text
          style={[
            typography.caption,
            { color: colors.textSecondary, marginTop: spacing.lg, marginBottom: 6 },
          ]}
        >
          DESCRIPTION (OPTIONAL)
        </Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Brief details or rules for this group..."
          placeholderTextColor={colors.textMuted}
          multiline
          style={[
            styles.textArea,
            typography.bodyMedium,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: borderRadius.md,
              color: colors.textPrimary,
            },
          ]}
        />

        {/* Category Picker */}
        <Text
          style={[
            typography.caption,
            { color: colors.textSecondary, marginTop: spacing.lg, marginBottom: 8 },
          ]}
        >
          CATEGORY
        </Text>
        <View style={styles.categoryGrid}>
          {GROUP_CATEGORIES.map(cat => {
            const isSelected = category === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                activeOpacity={0.7}
                onPress={() => setCategory(cat.key)}
                style={[
                  styles.categoryCard,
                  {
                    backgroundColor: isSelected ? colors.primaryLight : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderRadius: borderRadius.md,
                  },
                ]}
              >
                <Icon
                  name={cat.icon}
                  size={20}
                  color={isSelected ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    typography.caption,
                    {
                      color: isSelected ? colors.primary : colors.textPrimary,
                      fontWeight: isSelected ? '700' : '500',
                      marginTop: 4,
                    },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Default Currency */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.lg, marginBottom: 6 }}>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            CURRENCY
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleDetectLocation}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.primaryLight,
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: borderRadius.full,
            }}
          >
            <Icon name="location" size={12} color={colors.primary} />
            <Text style={[typography.caption, { color: colors.primary, fontWeight: '700', marginLeft: 4 }]}>
              Detect from GPS
            </Text>
          </TouchableOpacity>
        </View>
        <CurrencySelector selectedCurrency={currency} onSelect={setCurrency} />

        {/* Add Initial Friends */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.lg, marginBottom: 8 }}>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            ADD FRIENDS (OPTIONAL)
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowContactsModal(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.surfaceVariant,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: borderRadius.full,
            }}
          >
            <Icon name="phone" size={12} color={colors.primary} />
            <Text style={[typography.caption, { color: colors.primary, fontWeight: '700', marginLeft: 4 }]}>
              + From Contacts
            </Text>
          </TouchableOpacity>
        </View>
        {friends.map(friend => {
          const isSelected = selectedFriendIds.includes(friend.id);
          return (
            <TouchableOpacity
              key={friend.id}
              activeOpacity={0.7}
              onPress={() => toggleFriend(friend.id)}
              style={[
                styles.friendRow,
                {
                  backgroundColor: colors.surface,
                  borderColor: isSelected ? colors.primary : colors.borderSubtle,
                  borderRadius: borderRadius.md,
                },
              ]}
            >
              <View style={styles.friendInfo}>
                <Text style={[typography.titleMedium, { color: colors.textPrimary }]}>
                  {friend.name}
                </Text>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>
                  {friend.email}
                </Text>
              </View>
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: isSelected ? colors.primary : colors.border,
                    backgroundColor: isSelected ? colors.primary : 'transparent',
                    borderRadius: borderRadius.xs,
                  },
                ]}
              >
                {isSelected && <Icon name="check" size={14} color="#FFFFFF" />}
              </View>
            </TouchableOpacity>
          );
        })}

        <Button
          title="Create Group"
          onPress={handleCreate}
          loading={submitting}
          style={{ marginTop: spacing.xl, marginBottom: 30 }}
        />
      </ScrollView>

      {/* Contacts Picker Modal */}
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
  textArea: {
    height: 72,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryCard: {
    width: '31%',
    alignItems: 'center',
    paddingVertical: 12,
    borderWidth: 1,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  friendInfo: {
    flex: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
