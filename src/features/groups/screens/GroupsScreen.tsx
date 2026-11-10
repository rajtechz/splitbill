import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../app/navigation/types';
import { useTheme } from '../../../theme';
import { useAppStore } from '../../../store/useAppStore';
import { AppHeader } from '../../../components/common/AppHeader';
import { GroupCard } from '../../../components/cards/GroupCard';
import { EmptyState } from '../../../components/common/EmptyState';
import { Icon } from '../../../components/common/Icon';
import { GroupCategory } from '../../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CATEGORIES: ('All' | GroupCategory)[] = [
  'All',
  'Trip',
  'Home',
  'Couple',
  'Family',
  'Friends',
  'Office',
  'Other',
];

export const GroupsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { groups, refreshAll } = useAppStore();

  const [selectedCategory, setSelectedCategory] = useState<'All' | GroupCategory>('All');
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

  const filteredGroups = groups.filter(g => {
    const matchesCategory = selectedCategory === 'All' || g.category === selectedCategory;
    const matchesSearch =
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.description && g.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader
        title="Groups"
        subtitle={`${groups.length} active groups`}
        rightAction={{
          icon: 'plus',
          onPress: () => navigation.navigate('CreateGroup'),
        }}
      />

      {/* Search Input */}
      <View style={[styles.searchBar, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.md }]}>
        <Icon name="search" size={18} color={colors.textSecondary} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search groups..."
          placeholderTextColor={colors.textMuted}
          style={[styles.searchInput, typography.bodyMedium, { color: colors.textPrimary }]}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filter Pills */}
      <View style={{ height: 44 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
        >
          {CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                activeOpacity={0.7}
                onPress={() => setSelectedCategory(cat)}
                style={[
                  styles.filterPill,
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
                      color: isSelected ? '#FFFFFF' : colors.textSecondary,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Group List */}
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
        {filteredGroups.length > 0 ? (
          filteredGroups.map(grp => (
            <GroupCard
              key={grp.id}
              group={grp}
              onPress={() => navigation.navigate('GroupDetails', { groupId: grp.id })}
            />
          ))
        ) : (
          <EmptyState
            title="No groups found"
            description={
              searchQuery
                ? `No groups matching "${searchQuery}".`
                : 'Create your first group to start splitting bills.'
            }
            iconName="groups"
            actionTitle={searchQuery ? undefined : 'Create Group'}
            onAction={searchQuery ? undefined : () => navigation.navigate('CreateGroup')}
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
  filterList: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
  },
  content: {
    padding: 16,
  },
});

