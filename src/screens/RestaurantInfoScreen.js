import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import { useApp } from '../context/AppContext';
import { colors } from '../theme/colors';

function InfoCard({ label, value }) {
  return (
    <View style={styles.infoCard}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '—'}</Text>
    </View>
  );
}

export default function RestaurantInfoScreen() {
  const { user, logout, toggleRestaurantOpen } = useApp();
  const restaurant = user?.restaurant;
  const [togglingOpen, setTogglingOpen] = useState(false);

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: logout },
    ]);
  };

  const handleToggleOpen = async (isOpen) => {
    setTogglingOpen(true);
    const result = await toggleRestaurantOpen(isOpen);
    setTogglingOpen(false);
    if (!result.success) {
      Alert.alert('Could not update status', result.message);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <Text style={styles.headerIcon}>🏪</Text>
        <View style={styles.flex}>
          <Text style={styles.restaurantName}>{restaurant?.name || '—'}</Text>
          <Text style={styles.restaurantCuisine}>{restaurant?.cuisine || 'Not specified'}</Text>
        </View>
      </View>

      <View style={styles.openCard}>
        <View style={styles.flex}>
          <Text style={styles.openTitle}>
            {restaurant?.isOpen ? "You're open" : "You're closed"}
          </Text>
          <Text style={styles.openSubtitle}>
            {restaurant?.isOpen
              ? 'Customers can place orders right now.'
              : 'Customers cannot place new orders while closed.'}
          </Text>
        </View>
        <Switch
          value={!!restaurant?.isOpen}
          onValueChange={handleToggleOpen}
          disabled={togglingOpen}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor="#fff"
        />
      </View>

      <View style={styles.infoGrid}>
        <InfoCard label="📍 Address" value={restaurant?.address || 'Not specified'} />
        <InfoCard label="📞 Phone" value={restaurant?.phone || 'Not specified'} />
        <InfoCard label="⏱️ Delivery Time" value={restaurant?.deliveryTime || 'Not specified'} />
      </View>

      <View style={styles.accountCard}>
        <Text style={styles.accountTitle}>Your Account</Text>
        <Text style={styles.accountSubtitle}>Logged in as {user?.role || 'owner'}</Text>
        <View style={styles.infoGrid}>
          <InfoCard label="👤 Owner Name" value={user?.name} />
          <InfoCard label="✉️ Email" value={user?.email} />
        </View>
      </View>

      <View style={styles.logoutButton}>
        <PrimaryButton title="🚪 Log Out" variant="outline" onPress={handleLogout} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 32, gap: 16 },
  flex: { flex: 1 },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
  },
  headerIcon: {
    fontSize: 44,
  },
  restaurantName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  restaurantCuisine: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  openCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  openTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  openSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  infoCard: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  accountCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    gap: 12,
  },
  accountTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  accountSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: -8,
  },
  logoutButton: {
    marginTop: 4,
  },
});
