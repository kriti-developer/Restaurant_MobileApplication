import React, { useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { colors } from '../theme/colors';

const FILTERS = ['Active', 'All', 'Delivered', 'Cancelled'];
const ACTIVE_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'on-the-way'];

const STATUS_STYLE = {
  pending: { label: '⏳ Pending', bg: '#FEF3C7', fg: '#B45309' },
  confirmed: { label: '✅ Confirmed', bg: '#DBEAFE', fg: '#1D4ED8' },
  preparing: { label: '👨‍🍳 Preparing', bg: '#FFE4D6', fg: colors.primaryDark },
  ready: { label: '📦 Ready', bg: '#EDE9FE', fg: '#6D28D9' },
  'on-the-way': { label: '🚴 On the Way', bg: '#D1FAE5', fg: '#047857' },
  delivered: { label: '✔ Delivered', bg: '#D1FAE5', fg: '#047857' },
  cancelled: { label: '✖ Cancelled', bg: '#FEE2E2', fg: colors.danger },
};

const AGING_THRESHOLD_MS = 10 * 60 * 1000;
const AGING_STATUSES = ['pending', 'confirmed'];

function timeAgo(dateStr) {
  const diffSeconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  return `${Math.floor(diffSeconds / 3600)}h ago`;
}

function OrderCard({ order, onUpdateStatus, updatingId }) {
  const statusStyle = STATUS_STYLE[order.status] || { label: order.status, bg: colors.border, fg: colors.text };
  const isUpdating = updatingId === order._id;
  const waitingMs = Date.now() - new Date(order.createdAt).getTime();
  const isAging = AGING_STATUSES.includes(order.status) && waitingMs > AGING_THRESHOLD_MS;

  return (
    <View style={[styles.card, isAging && styles.cardAging]}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.orderId}>#{order._id.slice(-6).toUpperCase()}</Text>
          <Text style={[styles.orderTime, isAging && styles.orderTimeAging]}>
            {isAging ? `⚠️ Waiting ${Math.floor(waitingMs / 60000)}m` : timeAgo(order.createdAt)}
          </Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusPillText, { color: statusStyle.fg }]}>{statusStyle.label}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.customerName}>👤 {order.customer?.name || 'Customer'}</Text>
        {order.customer?.address ? (
          <Text style={styles.customerAddress}>📍 {order.customer.address}</Text>
        ) : null}
        {(order.items || []).map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <View style={styles.itemQtyBadge}>
              <Text style={styles.itemQtyText}>{item.quantity}×</Text>
            </View>
            <Text style={styles.itemName} numberOfLines={1}>
              {item.menuItem?.name || 'Item'}
            </Text>
            <Text style={styles.itemPrice}>₹{item.price}</Text>
          </View>
        ))}
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.total}>₹{order.totalPrice ?? '—'}</Text>
        {order.status === 'pending' && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.rejectBtn}
              disabled={isUpdating}
              onPress={() => onUpdateStatus(order._id, 'cancelled')}
            >
              <Text style={styles.rejectBtnText}>✖ Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              disabled={isUpdating}
              onPress={() => onUpdateStatus(order._id, 'preparing')}
            >
              <Text style={styles.actionBtnText}>{isUpdating ? 'Updating…' : '✅ Accept Order'}</Text>
            </TouchableOpacity>
          </View>
        )}
        {order.status === 'preparing' && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnAlt]}
            disabled={isUpdating}
            onPress={() => onUpdateStatus(order._id, 'ready')}
          >
            <Text style={[styles.actionBtnText, styles.actionBtnAltText]}>
              {isUpdating ? 'Updating…' : '📦 Ready for Pickup'}
            </Text>
          </TouchableOpacity>
        )}
        {order.status === 'ready' && <Text style={styles.waitingText}>🛵 Waiting for rider…</Text>}
      </View>
    </View>
  );
}

export default function OrdersScreen() {
  const { orders, fetchOrders, updateOrderStatus } = useApp();
  const [filter, setFilter] = useState('Active');
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const handleUpdateStatus = async (orderId, status) => {
    setUpdatingId(orderId);
    await updateOrderStatus(orderId, status);
    setUpdatingId(null);
  };

  const filteredOrders = orders.filter((order) => {
    if (filter === 'Active') return ACTIVE_STATUSES.includes(order.status);
    if (filter === 'Delivered') return order.status === 'delivered';
    if (filter === 'Cancelled') return order.status === 'cancelled';
    return true;
  });

  return (
    <View style={styles.container}>
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
        data={filteredOrders}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        renderItem={({ item }) => (
          <OrderCard order={item} onUpdateStatus={handleUpdateStatus} updatingId={updatingId} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🧾</Text>
            <Text style={styles.emptyTitle}>
              {filter === 'Active' ? 'No active orders' : 'No orders found'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'Active' ? 'New orders will appear here instantly.' : 'Try a different filter.'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  tab: {
    paddingVertical: 8,
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
    fontSize: 13,
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
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 14,
  },
  cardAging: {
    borderColor: colors.danger,
    borderWidth: 1.5,
  },
  orderTimeAging: {
    color: colors.danger,
    fontWeight: '700',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  orderId: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  orderTime: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  statusPill: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 100,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardBody: {
    padding: 14,
    gap: 4,
  },
  customerName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  customerAddress: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  itemQtyBadge: {
    backgroundColor: colors.background,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  itemQtyText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
  itemName: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
  },
  itemPrice: {
    fontSize: 12,
    color: colors.textMuted,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  total: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rejectBtn: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  rejectBtnText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  actionBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  actionBtnAlt: {
    backgroundColor: '#EDE9FE',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  actionBtnAltText: {
    color: '#6D28D9',
  },
  waitingText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.secondary,
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
});
