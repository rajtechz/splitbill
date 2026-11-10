import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Share,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../app/navigation/types';
import { useTheme } from '../../../theme';
import { useAppStore } from '../../../store/useAppStore';
import { AppHeader } from '../../../components/common/AppHeader';
import { FriendCard } from '../../../components/cards/FriendCard';
import { EmptyState } from '../../../components/common/EmptyState';
import { Icon } from '../../../components/common/Icon';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const FriendsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { friends, refreshAll } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshAll();
    } finally {
      setTimeout(() => setRefreshing(false), 350);
    }
  };

  const filteredFriends = friends.filter(
    f =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleShareInvite = async () => {
    try {
      await Share.share({
        message: 'Join me on SplitMate to effortlessly track and split group expenses: https://splitmate.app/invite',
      });
    } catch {}
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader
        title="Friends"
        subtitle={`${friends.length} friends connected`}
        rightAction={{
          icon: 'plus',
          onPress: () => navigation.navigate('AddFriend'),
        }}
        secondaryRightAction={{
          icon: 'share',
          onPress: handleShareInvite,
        }}
      />

      {/* Search Bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.md }]}>
        <Icon name="search" size={18} color={colors.textSecondary} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search friends by name or email..."
          placeholderTextColor={colors.textMuted}
          style={[styles.searchInput, typography.bodyMedium, { color: colors.textPrimary }]}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: 100 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {filteredFriends.length > 0 ? (
          filteredFriends.map(friend => (
            <FriendCard
              key={friend.id}
              friend={friend}
              onPress={() => navigation.navigate('FriendDetails', { friendId: friend.id })}
            />
          ))
        ) : (
          <EmptyState
            title="No friends found"
            description={
              searchQuery
                ? `No friends matching "${searchQuery}".`
                : 'Add friends to split bills, track balances, and settle debts easily.'
            }
            iconName="users"
            actionTitle={searchQuery ? undefined : 'Add Friend'}
            onAction={searchQuery ? undefined : () => navigation.navigate('AddFriend')}
          />
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
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    padding: 0,
  },
  content: {
    padding: 16,
  },
});

