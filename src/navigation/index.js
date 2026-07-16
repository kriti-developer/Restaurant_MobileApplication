import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import OrdersScreen from '../screens/OrdersScreen';
import MenuScreen from '../screens/MenuScreen';
import OverviewScreen from '../screens/OverviewScreen';
import RestaurantInfoScreen from '../screens/RestaurantInfoScreen';
import { colors } from '../theme/colors';

const RootStack = createNativeStackNavigator();
const AuthStackNav = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

const TAB_ICONS = {
  Orders: 'receipt',
  Menu: 'restaurant',
  Overview: 'stats-chart',
  Restaurant: 'storefront',
};

const TAB_TITLES = {
  Orders: 'Orders',
  Menu: 'Menu Items',
  Overview: 'Overview',
  Restaurant: 'Restaurant Info',
};

function AuthStack() {
  return (
    <AuthStackNav.Navigator screenOptions={{ headerShown: false }}>
      <AuthStackNav.Screen name="Login" component={LoginScreen} />
      <AuthStackNav.Screen name="Signup" component={SignupScreen} />
    </AuthStackNav.Navigator>
  );
}

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        title: TAB_TITLES[route.name],
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={TAB_ICONS[route.name]} color={color} size={size} />
        ),
      })}
    >
      <Tabs.Screen name="Orders" component={OrdersScreen} />
      <Tabs.Screen name="Menu" component={MenuScreen} />
      <Tabs.Screen name="Overview" component={OverviewScreen} />
      <Tabs.Screen name="Restaurant" component={RestaurantInfoScreen} />
    </Tabs.Navigator>
  );
}

export default function RootNavigator() {
  const { user, isRestoringSession } = useApp();

  if (isRestoringSession) return null;

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <RootStack.Screen name="MainTabs" component={MainTabs} />
        ) : (
          <RootStack.Screen name="AuthStack" component={AuthStack} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
