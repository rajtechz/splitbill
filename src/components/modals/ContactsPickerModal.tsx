import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../theme';
import { Icon } from '../common/Icon';
import { Avatar } from '../avatars/Avatar';
import { contactsService, PhoneContact } from '../../services/native/contactsService';

interface ContactsPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectContact: (contact: PhoneContact) => void;
}

export const ContactsPickerModal: React.FC<ContactsPickerModalProps> = ({
  visible,
  onClose,
  onSelectContact,
}) => {
  const { colors, typography, spacing, borderRadius, shadows } = useTheme();

  const [search, setSearch] = useState('');
  const [contacts, setContacts] = useState<PhoneContact[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadContacts();
    }
  }, [visible]);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const list = await contactsService.getContacts();
      setContacts(list);
    } finally {
      setLoading(false);
    }
  };

  const filtered = contacts.filter(
    c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phoneNumber && c.phoneNumber.includes(search)) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: colors.surface,
              borderTopLeftRadius: borderRadius.xl,
              borderTopRightRadius: borderRadius.xl,
              ...shadows.elevated,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />
            <View style={styles.headerRow}>
              <View>
                <Text style={[typography.h3, { color: colors.textPrimary }]}>
                  Device Contacts
                </Text>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>
                  Select a contact to add them to SplitMate
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Icon name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View
              style={[
                styles.searchBox,
                {
                  backgroundColor: colors.surfaceVariant,
                  borderRadius: borderRadius.md,
                  marginTop: 12,
                },
              ]}
            >
              <Icon name="search" size={18} color={colors.textSecondary} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search by name or number..."
                placeholderTextColor={colors.textMuted}
                style={[styles.searchInput, typography.bodyMedium, { color: colors.textPrimary }]}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Icon name="close" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* List */}
          {loading ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 8 }]}>
                Reading device contacts...
              </Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={{ padding: 16, paddingBottom: 36 }}
              showsVerticalScrollIndicator={false}
            >
              {filtered.length > 0 ? (
                filtered.map(contact => (
                  <TouchableOpacity
                    key={contact.id}
                    activeOpacity={0.7}
                    onPress={() => {
                      onSelectContact(contact);
                      onClose();
                    }}
                    style={[
                      styles.contactItem,
                      {
                        backgroundColor: colors.surfaceVariant,
                        borderRadius: borderRadius.lg,
                        borderColor: colors.borderSubtle,
                      },
                    ]}
                  >
                    <Avatar name={contact.name} url={contact.avatarUrl} size={44} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[typography.titleMedium, { color: colors.textPrimary }]}>
                        {contact.name}
                      </Text>
                      {contact.phoneNumber && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                          <Icon name="phone" size={12} color={colors.textSecondary} />
                          <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: 4 }]}>
                            {contact.phoneNumber}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View
                      style={[
                        styles.addBadge,
                        { backgroundColor: colors.primaryLight, borderRadius: borderRadius.full },
                      ]}
                    >
                      <Icon name="plus" size={14} color={colors.primary} />
                      <Text style={[typography.caption, { color: colors.primary, fontWeight: '800', marginLeft: 4 }]}>
                        Add
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                  <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>
                    No matching contacts found
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    maxHeight: '80%',
    minHeight: '50%',
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeBtn: {
    padding: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    padding: 0,
  },
  centerLoading: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  addBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
});
