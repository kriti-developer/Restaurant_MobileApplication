import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { colors } from '../theme/colors';

function StatTile({ icon, value, label, tint }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statTop}>
        <View>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statLabel}>{label}</Text>
        </View>
        <View style={[styles.statIcon, { backgroundColor: tint }]}>
          <Text style={styles.statIconText}>{icon}</Text>
        </View>
      </View>
    </View>
  );
}

export default function OverviewScreen() {
  const { menuItems, orders, fetchMenuItems, fetchOrders } = useApp();
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchMenuItems(), fetchOrders()]);
    setRefreshing(false);
  };

  const totalItems = menuItems.length;
  const liveItems = menuItems.filter((i) => i.isDisplayed).length;
  const hiddenItems = totalItems - liveItems;
  const avgPrice = totalItems
    ? Math.round(menuItems.reduce((sum, i) => sum + (i.price || 0), 0) / totalItems)
    : 0;

  const mostExpensive = [...menuItems].sort((a, b) => (b.price || 0) - (a.price || 0))[0];
  const leastExpensive = [...menuItems].sort((a, b) => (a.price || 0) - (b.price || 0))[0];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const pendingCount = orders.filter((o) => o.status === 'pending' || o.status === 'confirmed').length;
  const preparingCount = orders.filter((o) => o.status === 'preparing').length;
  const onWayCount = orders.filter((o) => o.status === 'on-the-way').length;
  const deliveredTodayCount = orders.filter(
    (o) => o.status === 'delivered' && new Date(o.createdAt) >= today
  ).length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      <Text style={styles.sectionTitle}>Menu</Text>
      <View style={styles.statsGrid}>
        <StatTile icon="🍴" value={totalItems} label="Total Items" tint="#FFE4D6" />
        <StatTile icon="✅" value={liveItems} label="Live Items" tint="#D1FAE5" />
        <StatTile icon="👁️" value={hiddenItems} label="Hidden Items" tint="#DBEAFE" />
        <StatTile icon="💰" value={avgPrice ? `₹${avgPrice}` : '—'} label="Avg. Price" tint="#EDE9FE" />
      </View>

      <Text style={styles.sectionTitle}>Orders</Text>
      <View style={styles.statsGrid}>
        <StatTile icon="🔔" value={pendingCount} label="Pending" tint="#FFE4D6" />
        <StatTile icon="👨‍🍳" value={preparingCount} label="Preparing" tint="#DBEAFE" />
        <StatTile icon="🚴" value={onWayCount} label="On the Way" tint="#EDE9FE" />
        <StatTile icon="✅" value={deliveredTodayCount} label="Delivered Today" tint="#D1FAE5" />
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>📈 Quick Summary</Text>
        {totalItems ? (
          <Text style={styles.summaryText}>
            Your restaurant currently has <Text style={styles.bold}>{totalItems} menu item{totalItems !== 1 ? 's' : ''}</Text>,
            of which <Text style={[styles.bold, styles.green]}>{liveItems} {liveItems === 1 ? 'is' : 'are'} live</Text> and
            visible to customers.{'\n\n'}
            The average item price is <Text style={[styles.bold, styles.orange]}>₹{avgPrice}</Text>.
            {mostExpensive ? (
              <Text>
                {'\n'}Your most expensive item is <Text style={styles.bold}>{mostExpensive.name}</Text> at ₹{mostExpensive.price}.
              </Text>
            ) : null}
            {leastExpensive && leastExpensive !== mostExpensive ? (
              <Text>
                {'\n'}Your most affordable item is <Text style={styles.bold}>{leastExpensive.name}</Text> at ₹{leastExpensive.price}.
              </Text>
            ) : null}
          </Text>
        ) : (
          <Text style={styles.summaryText}>No menu items found.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 8, paddingBottom: 32 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  statCard: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  statTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconText: {
    fontSize: 15,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    marginTop: 12,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 20,
  },
  bold: {
    fontWeight: '700',
    color: colors.text,
  },
  green: {
    color: colors.secondary,
  },
  orange: {
    color: colors.primary,
  },
});
