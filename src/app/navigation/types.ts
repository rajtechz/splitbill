import { NavigatorScreenParams } from '@react-navigation/native';
import { CurrencyCode, ProFeature } from '../../types';

export type MainTabParamList = {
  HomeTab: undefined;
  GroupsTab: undefined;
  ActivityTab: undefined;
  BalancesTab: { filter?: 'all' | 'owe' | 'owed' } | undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  Splash?: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList>;

  // Auth flow
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  OtpVerification: { identifier: string };

  // Groups
  GroupDetails: { groupId: string };
  CreateGroup: undefined;
  EditGroup: { groupId: string };
  AddGroupMember: { groupId: string };

  // Friends
  FriendDetails: { friendId: string };
  AddFriend: undefined;

  // Expenses
  AddExpense: { preselectedGroupId?: string; preselectedFriendId?: string };
  ExpenseDetails: { expenseId: string };
  EditExpense: { expenseId: string };

  // Settlements
  RecordSettlement: {
    preselectedGroupId?: string;
    preselectedPayerId?: string;
    preselectedReceiverId?: string;
    suggestedAmount?: number;
    currency?: CurrencyCode;
  };

  // Other modules
  Analytics: undefined;
  Notifications: undefined;
  Search: undefined;
  EditProfile: undefined;
  Subscription: { triggerFeature?: ProFeature } | undefined;
};
