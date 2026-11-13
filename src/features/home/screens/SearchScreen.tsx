import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../app/navigation/types';
import { useTheme } from '../../../theme';
import { useAppStore } from '../../../store/useAppStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { AppHeader } from '../../../components/common/AppHeader';
import { GroupCard } from '../../../components/cards/GroupCard';
import { FriendCard } from '../../../components/cards/FriendCard';
import { ExpenseCard } from '../../../components/cards/ExpenseCard';
import { Icon } from '../../../components/common/Icon';
import { EmptyState } from '../../../components/common/EmptyState';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const SearchScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { groups, friends, expenses } = useAppStore();
  const currentUser = useAuthStore(state => state.currentUser);
  const isPro = useAuthStore(state => state.isPro);

  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();

  const matchedGroups = q
    ? groups.filter(g => g.name.toLowerCase().includes(q) || g.category.toLowerCase().includes(q))
    : [];

  const matchedFriends = q
    ? friends.filter(f => f.name.toLowerCase().includes(q) || f.email.toLowerCase().includes(q))
    : [];

  const matchedExpenses = q
    ? expenses.filter(
        e =>
          e.title.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          (e.notes && e.notes.toLowerCase().includes(q))
      )
    : [];

  const visibleExpenses = isPro ? matchedExpenses : matchedExpenses.slice(0, 3);
  const hiddenProCount = isPro ? 0 : Math.max(0, matchedExpenses.length - 3);

  const totalResults = matchedGroups.length + matchedFriends.length + matchedExpenses.length;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader title="Search SplitMate" showBack onBack={() => navigation.goBack()} />

      {/* Search Input Bar */}
      <View
        style={[
          styles.searchBar,
          { backgroundColor: colors.surface, borderRadius: borderRadius.md, borderColor: colors.border },
        ]}
      >
        <Icon name="search" size={20} color={colors.textSecondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search groups, friends, or expenses..."
          placeholderTextColor={colors.textMuted}
          autoFocus
          style={[styles.input, typography.bodyLarge, { color: colors.textPrimary }]}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Icon name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 60 }]}>
        {query.length === 0 ? (
          <EmptyState
            title="Search anything"
            description="Type a keyword to find groups, friends, or specific expenses instantly."
            iconName="search"
          />
        ) : totalResults === 0 ? (
          <EmptyState
            title="No results found"
            description={`We couldn't find any items matching "${query}".`}
            iconName="search"
          />
        ) : (
          <>
            {/* Matched Groups */}
            {matchedGroups.length > 0 && (
              <View style={{ marginBottom: spacing.lg }}>
                <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 8 }]}>
                  GROUPS ({matchedGroups.length})
                </Text>
                {matchedGroups.map(g => (
                  <GroupCard
                    key={g.id}
                    group={g}
                    onPress={() => navigation.navigate('GroupDetails', { groupId: g.id })}
                  />
                ))}
              </View>
            )}

            {/* Matched Friends */}
            {matchedFriends.length > 0 && (
              <View style={{ marginBottom: spacing.lg }}>
                <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 8 }]}>
                  FRIENDS ({matchedFriends.length})
                </Text>
                {matchedFriends.map(f => (
                  <FriendCard
                    key={f.id}
                    friend={f}
                    onPress={() => navigation.navigate('FriendDetails', { friendId: f.id })}
                  />
                ))}
              </View>
            )}

            {/* Matched Expenses */}
            {matchedExpenses.length > 0 && (
              <View style={{ marginBottom: spacing.lg }}>
                <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 8 }]}>
                  EXPENSES ({isPro ? matchedExpenses.length : `${visibleExpenses.length} of ${matchedExpenses.length}`})
                </Text>
                {visibleExpenses.map(e => (
                  <ExpenseCard
                    key={e.id}
                    expense={e}
                    currentUserId={currentUser?.id}
                    currentUserName={currentUser?.name}
                    onPress={() => navigation.navigate('ExpenseDetails', { expenseId: e.id })}
                  />
                ))}

                {/* Pro Deep History Banner */}
                {hiddenProCount > 0 && (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate('Subscription')}
                    style={[
                      styles.proSearchBanner,
                      {
                        backgroundColor: '#122E24',
                        borderColor: '#D4AF37',
                        borderRadius: borderRadius.md,
                      },
                    ]}
                  >
                    <View style={styles.proSearchIconWrap}>
                      <Icon name="crown" size={20} color="#D4AF37" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[typography.titleMedium, { color: '#FFFFFF', fontSize: 13 }]}>
                        Unlock {hiddenProCount} More Historical Expense{hiddenProCount > 1 ? 's' : ''}
                      </Text>
                      <Text style={[typography.caption, { color: '#B8E7D3', fontSize: 11, marginTop: 1 }]}>
                        Free searches recent 3 items. SplitMate Pro searches your entire deep expense history.
                      </Text>
                    </View>
                    <View style={styles.proUnlockPill}>
                      <Text style={styles.proUnlockPillText}>PRO</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            )}
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    padding: 0,
  },
  content: {
    paddingHorizontal: 16,
  },
  proSearchBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
  },
  proSearchIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proUnlockPill: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  proUnlockPillText: {
    color: '#122E24',
    fontSize: 11,
    fontWeight: '800',
  },
});

