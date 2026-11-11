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
import { repository } from '../../services/api/repository';

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
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');

  useEffect(() => {
    if (visible) {
      loadContacts();
      setShowManualForm(false);
      setSearch('');
    }
  }, [visible]);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const list = await contactsService.getContacts();
      try {
        const syncRes = await repository.syncContacts(list);
        if (syncRes?.contacts) {
          const registeredSet = new Set(
            syncRes.contacts
              .filter((c: any) => c.isRegistered)
              .map((c: any) => c.contactName.toLowerCase())
          );
          const enriched = list.map(c => ({
            ...c,
            isRegistered: registeredSet.has(c.name.toLowerCase()),
          }));
          setContacts(enriched);
          return;
        }
      } catch {}
      setContacts(list);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveManualContact = async () => {
    if (!manualName.trim() && !manualPhone.trim()) return;
    const name = manualName.trim() || `Contact ${manualPhone.trim().slice(-4)}`;
    const phone = manualPhone.trim();
    const created = await contactsService.addContact(name, phone);
    setManualName('');
    setManualPhone('');
    setShowManualForm(false);
    onSelectContact(created);
    onClose();
  };

  const handleQuickAddSearch = async () => {
    if (!search.trim()) return;
    const query = search.trim();
    const isDigitsOnly = /^[\d\s+\-()]+$/.test(query);
    const name = isDigitsOnly ? `Contact ${query.replace(/[^0-9]/g, '').slice(-4)}` : query;
    const phone = isDigitsOnly ? query : '';
    const created = await contactsService.addContact(name, phone);
    onSelectContact(created);
    onClose();
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
                  Select or add recently added contact numbers
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
                placeholder="Search name or type recently added number..."
                placeholderTextColor={colors.textMuted}
                style={[styles.searchInput, typography.bodyMedium, { color: colors.textPrimary }]}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Icon name="close" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Toggle Manual Add Form Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowManualForm(!showManualForm)}
              style={[
                styles.toggleManualBtn,
                {
                  borderColor: colors.border,
                  backgroundColor: showManualForm ? colors.primaryLight : colors.surface,
                  borderRadius: borderRadius.md,
                },
              ]}
            >
              <Icon name="user-plus" size={15} color={colors.primary} />
              <Text style={[typography.caption, { color: colors.primary, fontWeight: '700', marginLeft: 6 }]}>
                {showManualForm ? 'Hide Contact Form' : '+ Add New Contact Number Directly'}
              </Text>
            </TouchableOpacity>

            {/* Inline Manual Contact Add Form */}
            {showManualForm && (
              <View
                style={[
                  styles.manualFormCard,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: colors.border,
                    borderRadius: borderRadius.md,
                  },
                ]}
              >
                <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 4 }]}>
                  NAME
                </Text>
                <TextInput
                  value={manualName}
                  onChangeText={setManualName}
                  placeholder="e.g. Rahul Sharma"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.manualInput, { backgroundColor: colors.surface, color: colors.textPrimary, borderRadius: borderRadius.sm }]}
                />

                <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 8, marginBottom: 4 }]}>
                  PHONE NUMBER
                </Text>
                <TextInput
                  value={manualPhone}
                  onChangeText={setManualPhone}
                  placeholder="+91 98765 43210"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                  style={[styles.manualInput, { backgroundColor: colors.surface, color: colors.textPrimary, borderRadius: borderRadius.sm }]}
                />

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleSaveManualContact}
                  disabled={!manualName.trim() && !manualPhone.trim()}
                  style={[
                    styles.saveManualBtn,
                    {
                      backgroundColor: manualName.trim() || manualPhone.trim() ? colors.primary : colors.border,
                      borderRadius: borderRadius.md,
                    },
                  ]}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>
                    Save & Add Contact
                  </Text>
                </TouchableOpacity>
              </View>
            )}
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
              {/* Quick Add Search Banner if search query not matching exact existing */}
              {search.trim().length > 0 && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleQuickAddSearch}
                  style={[
                    styles.quickAddCard,
                    {
                      backgroundColor: colors.primaryLight,
                      borderColor: colors.primary,
                      borderRadius: borderRadius.lg,
                    },
                  ]}
                >
                  <View style={[styles.quickAddIconCircle, { backgroundColor: colors.primary }]}>
                    <Icon name="plus" size={16} color="#FFFFFF" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[typography.titleMedium, { color: colors.primary, fontWeight: '700' }]}>
                      Use "{search.trim()}"
                    </Text>
                    <Text style={[typography.caption, { color: colors.textSecondary }]}>
                      Tap to add this number directly to SplitMate
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={16} color={colors.primary} />
                </TouchableOpacity>
              )}

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
                        borderColor: contact.isRecentlyAdded ? colors.primary : colors.borderSubtle,
                      },
                    ]}
                  >
                    <Avatar name={contact.name} url={contact.avatarUrl} size={44} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                        <Text style={[typography.titleMedium, { color: colors.textPrimary }]}>
                          {contact.name}
                        </Text>
                        {contact.isRecentlyAdded && (
                          <View
                            style={{
                              marginLeft: 6,
                              backgroundColor: colors.primaryLight,
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              borderRadius: 4,
                            }}
                          >
                            <Text style={{ fontSize: 9, fontWeight: '800', color: colors.primary }}>
                              RECENT
                            </Text>
                          </View>
                        )}
                        {(contact as any).isRegistered && (
                          <View
                            style={{
                              marginLeft: 6,
                              backgroundColor: '#DCFCE7',
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              borderRadius: 4,
                            }}
                          >
                            <Text style={{ fontSize: 9, fontWeight: '700', color: '#166534' }}>
                              On SplitMate
                            </Text>
                          </View>
                        )}
                      </View>
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
                  <TouchableOpacity
                    onPress={handleQuickAddSearch}
                    style={{ marginTop: 12, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: colors.primaryLight, borderRadius: borderRadius.md }}
                  >
                    <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>
                      + Add "{search}" as a contact
                    </Text>
                  </TouchableOpacity>
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
    maxHeight: '85%',
    minHeight: '55%',
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
  toggleManualBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderWidth: 1,
    marginTop: 10,
  },
  manualFormCard: {
    padding: 12,
    borderWidth: 1,
    marginTop: 10,
  },
  manualInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    fontSize: 14,
  },
  saveManualBtn: {
    marginTop: 10,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAddCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  quickAddIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
