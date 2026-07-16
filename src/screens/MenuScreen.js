import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import { useApp } from '../context/AppContext';
import { colors } from '../theme/colors';

const FILTERS = ['All', 'Live', 'Hidden'];

function DishFormModal({ visible, onClose, onSubmit, initialValues, title, submitLabel }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [emoji, setEmoji] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setName('');
    setPrice('');
    setEmoji('');
    setCategory('');
    setDescription('');
  };

  useEffect(() => {
    if (!visible) return;
    setName(initialValues?.name || '');
    setPrice(initialValues?.price !== undefined ? String(initialValues.price) : '');
    setEmoji(initialValues?.emoji || '');
    setCategory(initialValues?.category || '');
    setDescription(initialValues?.description || '');
  }, [visible, initialValues]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Missing name', 'Enter a dish name.');
      return;
    }
    if (price === '' || Number.isNaN(Number(price)) || Number(price) < 0) {
      Alert.alert('Invalid price', 'Enter a valid price.');
      return;
    }
    setSubmitting(true);
    const result = await onSubmit({
      name: name.trim(),
      price: Number(price),
      emoji: emoji.trim(),
      category: category.trim(),
      description: description.trim(),
    });
    setSubmitting(false);
    if (result.success) {
      reset();
      onClose();
    } else {
      Alert.alert('Could not save dish', result.message);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{title}</Text>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Name</Text>
            <TextInput style={styles.input} placeholder="e.g. Veg Biryani" value={name} onChangeText={setName} />

            <Text style={styles.label}>Price (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="199"
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
            />

            <Text style={styles.label}>Emoji</Text>
            <TextInput style={styles.input} placeholder="🍛" value={emoji} onChangeText={setEmoji} />

            <Text style={styles.label}>Category</Text>
            <TextInput style={styles.input} placeholder="Main" value={category} onChangeText={setCategory} />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="Short description"
              value={description}
              onChangeText={setDescription}
              multiline
            />
          </ScrollView>

          <View style={styles.modalActions}>
            <PrimaryButton title="Cancel" variant="outline" onPress={onClose} disabled={submitting} />
            <View style={{ height: 10 }} />
            <PrimaryButton title={submitLabel} onPress={handleSubmit} loading={submitting} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ItemCard({ item, onToggle, onEdit, onDelete, updatingId }) {
  const isUpdating = updatingId === item._id;
  return (
    <View style={[styles.itemCard, item.isDisplayed && styles.itemCardLive]}>
      {item.isDisplayed && (
        <View style={styles.liveRibbon}>
          <Text style={styles.liveRibbonText}>LIVE</Text>
        </View>
      )}
      {item.category ? <Text style={styles.itemCategory}>{item.category}</Text> : null}
      <Text style={styles.itemName}>{item.emoji ? `${item.emoji} ` : ''}{item.name}</Text>
      {item.description ? (
        <Text style={styles.itemDesc} numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}
      <View style={styles.itemMeta}>
        <Text style={styles.itemPrice}>₹{item.price ?? '—'}</Text>
        <View style={[styles.availPill, item.isAvailable === false ? styles.availPillOff : styles.availPillOn]}>
          <Text
            style={[
              styles.availPillText,
              item.isAvailable === false ? styles.availPillTextOff : styles.availPillTextOn,
            ]}
          >
            {item.isAvailable === false ? 'Unavailable' : 'Available'}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.toggleBtn, item.isDisplayed ? styles.toggleBtnRemove : styles.toggleBtnGoLive]}
        disabled={isUpdating}
        onPress={() => onToggle(item._id, !item.isDisplayed)}
      >
        <Text
          style={[
            styles.toggleBtnText,
            item.isDisplayed ? styles.toggleBtnTextRemove : styles.toggleBtnTextGoLive,
          ]}
        >
          {isUpdating ? 'Updating…' : item.isDisplayed ? '⏸ Remove from Live' : '▶ Set Live'}
        </Text>
      </TouchableOpacity>
      <View style={styles.editDeleteRow}>
        <TouchableOpacity style={styles.editDeleteBtn} disabled={isUpdating} onPress={() => onEdit(item)}>
          <Text style={styles.editDeleteBtnText}>✏️ Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.editDeleteBtn} disabled={isUpdating} onPress={() => onDelete(item)}>
          <Text style={[styles.editDeleteBtnText, styles.deleteBtnText]}>🗑️ Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function MenuScreen() {
  const { menuItems, fetchMenuItems, addMenuItem, updateMenuItem, deleteMenuItem, setItemDisplayed } = useApp();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMenuItems();
    setRefreshing(false);
  };

  const handleToggle = async (itemId, isDisplayed) => {
    setUpdatingId(itemId);
    const result = await setItemDisplayed(itemId, isDisplayed);
    setUpdatingId(null);
    if (!result.success) {
      Alert.alert('Could not update item', result.message);
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setModalVisible(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setModalVisible(true);
  };

  const handleSubmit = (fields) =>
    editingItem ? updateMenuItem(editingItem._id, fields) : addMenuItem(fields);

  const handleDelete = (item) => {
    Alert.alert('Delete dish', `Remove "${item.name}" from your menu? This can't be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setUpdatingId(item._id);
          const result = await deleteMenuItem(item._id);
          setUpdatingId(null);
          if (!result.success) {
            Alert.alert('Could not delete item', result.message);
          }
        },
      },
    ]);
  };

  const filteredItems = menuItems.filter((item) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      item.name?.toLowerCase().includes(query) ||
      (item.description || '').toLowerCase().includes(query);
    const matchesFilter =
      filter === 'All' ? true : filter === 'Live' ? item.isDisplayed : !item.isDisplayed;
    return matchesSearch && matchesFilter;
  });

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search items…"
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity style={styles.addBtn} onPress={handleOpenAdd}>
          <Text style={styles.addBtnText}>+ Add Dish</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.tab, filter === f && styles.tabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.tabText, filter === f && styles.tabTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        renderItem={({ item }) => (
          <ItemCard
            item={item}
            onToggle={handleToggle}
            onEdit={handleOpenEdit}
            onDelete={handleDelete}
            updatingId={updatingId}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🍽️</Text>
            <Text style={styles.emptyTitle}>
              {menuItems.length ? 'No items match your filter' : 'No menu items yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {menuItems.length ? 'Try a different search or filter.' : 'Tap "+ Add Dish" to create your first item.'}
            </Text>
          </View>
        }
      />

      <DishFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmit}
        initialValues={editingItem}
        title={editingItem ? 'Edit dish' : 'Add a dish'}
        submitLabel={editingItem ? 'Save Changes' : 'Add Dish'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    paddingBottom: 8,
  },
  searchInput: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    fontSize: 13,
    color: colors.text,
  },
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  tab: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: '#FFE4D6',
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.primary,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    gap: 14,
  },
  itemCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 14,
  },
  itemCardLive: {
    borderColor: colors.secondary,
  },
  liveRibbon: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.secondary,
    borderRadius: 100,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  liveRibbonText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  itemCategory: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
    paddingRight: 60,
  },
  itemDesc: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 10,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  itemPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  availPill: {
    borderRadius: 100,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  availPillOn: { backgroundColor: '#D1FAE5' },
  availPillOff: { backgroundColor: '#FEE2E2' },
  availPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  availPillTextOn: { color: '#047857' },
  availPillTextOff: { color: colors.danger },
  toggleBtn: {
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
  },
  toggleBtnGoLive: {
    backgroundColor: colors.primary,
  },
  toggleBtnRemove: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  toggleBtnTextGoLive: { color: '#fff' },
  toggleBtnTextRemove: { color: colors.textMuted },
  editDeleteRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  editDeleteBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  editDeleteBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  deleteBtnText: {
    color: colors.danger,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: 14,
    fontSize: 14,
    color: colors.text,
  },
  multiline: {
    height: 60,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  modalActions: {
    marginTop: 16,
  },
});
