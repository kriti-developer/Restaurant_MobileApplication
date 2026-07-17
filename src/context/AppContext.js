import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Vibration } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';
import { API_BASE } from '../config';

const SESSION_KEY = '@food_app/restaurantSession';
const REQUEST_TIMEOUT_MS = 6000;

const AppContext = createContext(null);

function fetchWithTimeout(url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => {
    clearTimeout(timeoutId);
  });
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const socketRef = useRef(null);
  const restaurantIdRef = useRef(null);

  useEffect(() => {
    restaurantIdRef.current = user?.restaurant?._id || null;
  }, [user]);

  useEffect(() => {
    AsyncStorage.getItem(SESSION_KEY)
      .then((raw) => {
        if (!raw) return;
        const session = JSON.parse(raw);
        setUser(session.user || null);
        setAuthToken(session.token || null);
      })
      .finally(() => setIsRestoringSession(false));
  }, []);

  const saveSession = useCallback(async ({ token, user: nextUser }) => {
    const session = { token, user: nextUser };
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setAuthToken(token);
    setUser(nextUser);
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(SESSION_KEY);
    setUser(null);
    setAuthToken(null);
    setMenuItems([]);
    setOrders([]);
  }, []);

  const signUp = useCallback(
    async ({
      ownerName,
      email,
      password,
      phone,
      restaurantName,
      cuisine,
      address,
      restaurantPhone,
      deliveryTime,
    }) => {
      try {
        const res = await fetchWithTimeout(`${API_BASE}/api/auth/restaurant-owner-signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ownerName,
            email,
            password,
            phone,
            restaurantName,
            cuisine,
            address,
            restaurantPhone,
            deliveryTime,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          return { success: false, message: data.error || 'Sign up failed.' };
        }
        await saveSession({ token: data.token, user: data.user });
        return { success: true };
      } catch (error) {
        return { success: false, message: 'Could not reach the backend. Is it running?' };
      }
    },
    [saveSession]
  );

  const login = useCallback(
    async ({ email, password }) => {
      try {
        const res = await fetchWithTimeout(`${API_BASE}/api/auth/restaurant-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          return { success: false, message: data.error || 'Login failed.' };
        }
        await saveSession({ token: data.token, user: data.user });
        return { success: true };
      } catch (error) {
        return { success: false, message: 'Could not reach the backend. Is it running?' };
      }
    },
    [saveSession]
  );

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${authToken}` }),
    [authToken]
  );

  const fetchMenuItems = useCallback(async () => {
    if (!authToken) return;
    try {
      const res = await fetchWithTimeout(`${API_BASE}/api/menu/items/dashboard`, {
        headers: authHeaders,
      });
      if (res.status === 401) {
        await logout();
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      setMenuItems(Array.isArray(data) ? data : []);
    } catch {
      // Keep whatever's already loaded if the backend is unreachable.
    }
  }, [authToken, authHeaders, logout]);

  const addMenuItem = useCallback(
    async ({ name, price, emoji, category, description }) => {
      if (!authToken) {
        return { success: false, message: 'Your session is missing. Please log out and log back in.' };
      }
      try {
        const res = await fetchWithTimeout(`${API_BASE}/api/menu/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({ name, price, emoji, category, description }),
        });
        if (res.status === 401) {
          await logout();
          return { success: false, message: 'Your session has expired. Please log in again.' };
        }
        const data = await res.json();
        if (!res.ok) {
          return { success: false, message: data.error || 'Could not add the item.' };
        }
        setMenuItems((prev) => [...prev, data]);
        return { success: true };
      } catch (error) {
        return { success: false, message: 'Could not reach the backend. Is it running?' };
      }
    },
    [authToken, authHeaders, logout]
  );

  const setItemDisplayed = useCallback(
    async (itemId, isDisplayed) => {
      if (!authToken) {
        return { success: false, message: 'Your session is missing. Please log out and log back in.' };
      }
      try {
        const res = await fetchWithTimeout(`${API_BASE}/api/dashboard/items/${itemId}/display`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({ isDisplayed }),
        });
        if (res.status === 401) {
          await logout();
          return { success: false, message: 'Your session has expired. Please log in again.' };
        }
        if (!res.ok) {
          return { success: false, message: 'Could not update the item.' };
        }
        const updated = await res.json();
        setMenuItems((prev) =>
          prev.map((item) => (item._id === updated._id ? { ...item, isDisplayed: updated.isDisplayed } : item))
        );
        return { success: true };
      } catch (error) {
        return { success: false, message: 'Could not reach the backend. Is it running?' };
      }
    },
    [authToken, authHeaders, logout]
  );

  const updateMenuItem = useCallback(
    async (itemId, fields) => {
      if (!authToken) {
        return { success: false, message: 'Your session is missing. Please log out and log back in.' };
      }
      try {
        const res = await fetchWithTimeout(`${API_BASE}/api/menu/items/${itemId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify(fields),
        });
        if (res.status === 401) {
          await logout();
          return { success: false, message: 'Your session has expired. Please log in again.' };
        }
        const data = await res.json();
        if (!res.ok) {
          return { success: false, message: data.error || 'Could not update the item.' };
        }
        setMenuItems((prev) => prev.map((item) => (item._id === data._id ? data : item)));
        return { success: true };
      } catch (error) {
        return { success: false, message: 'Could not reach the backend. Is it running?' };
      }
    },
    [authToken, authHeaders, logout]
  );

  const deleteMenuItem = useCallback(
    async (itemId) => {
      if (!authToken) {
        return { success: false, message: 'Your session is missing. Please log out and log back in.' };
      }
      try {
        const res = await fetchWithTimeout(`${API_BASE}/api/menu/items/${itemId}`, {
          method: 'DELETE',
          headers: authHeaders,
        });
        if (res.status === 401) {
          await logout();
          return { success: false, message: 'Your session has expired. Please log in again.' };
        }
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          return { success: false, message: data.error || 'Could not delete the item.' };
        }
        setMenuItems((prev) => prev.filter((item) => item._id !== itemId));
        return { success: true };
      } catch (error) {
        return { success: false, message: 'Could not reach the backend. Is it running?' };
      }
    },
    [authToken, authHeaders, logout]
  );

  const toggleRestaurantOpen = useCallback(
    async (isOpen) => {
      if (!authToken) {
        return { success: false, message: 'Your session is missing. Please log out and log back in.' };
      }
      try {
        const res = await fetchWithTimeout(`${API_BASE}/api/restaurants/me/open`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({ isOpen }),
        });
        if (res.status === 401) {
          await logout();
          return { success: false, message: 'Your session has expired. Please log in again.' };
        }
        const data = await res.json();
        if (!res.ok) {
          return { success: false, message: data.error || 'Could not update restaurant status.' };
        }
        setUser((prev) => (prev ? { ...prev, restaurant: { ...prev.restaurant, isOpen: data.isOpen } } : prev));
        return { success: true };
      } catch (error) {
        return { success: false, message: 'Could not reach the backend. Is it running?' };
      }
    },
    [authToken, authHeaders, logout]
  );

  const fetchOrders = useCallback(async () => {
    if (!authToken) return;
    try {
      const res = await fetchWithTimeout(`${API_BASE}/api/orders/restaurant`, {
        headers: authHeaders,
      });
      if (res.status === 401) {
        await logout();
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      // Keep whatever's already loaded if the backend is unreachable.
    }
  }, [authToken, authHeaders, logout]);

  const updateOrderStatus = useCallback(
    async (orderId, status) => {
      if (!authToken) {
        return { success: false, message: 'Your session is missing. Please log out and log back in.' };
      }
      try {
        const res = await fetchWithTimeout(`${API_BASE}/api/orders/${orderId}/restaurant-status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({ status }),
        });
        if (res.status === 401) {
          await logout();
          return { success: false, message: 'Your session has expired. Please log in again.' };
        }
        const data = await res.json();
        if (!res.ok) {
          return { success: false, message: data.error || 'Could not update this order.' };
        }
        setOrders((prev) => prev.map((o) => (o._id === data._id ? data : o)));
        return { success: true };
      } catch (error) {
        return { success: false, message: 'Could not reach the backend. Is it running?' };
      }
    },
    [authToken, authHeaders, logout]
  );

  useEffect(() => {
    if (!authToken) return;
    fetchMenuItems();
    fetchOrders();
  }, [authToken, fetchMenuItems, fetchOrders]);

  // Belongs-to-this-restaurant check for socket events, which broadcast
  // globally with no rooms - mirrors restaurant-dashboard.html's guard.
  const belongsToThisRestaurant = useCallback((restaurantRef) => {
    const myRestaurantId = restaurantIdRef.current;
    const eventRestaurantId = restaurantRef?._id || restaurantRef;
    return Boolean(myRestaurantId) && eventRestaurantId?.toString() === myRestaurantId?.toString();
  }, []);

  useEffect(() => {
    if (!authToken) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socket = io(API_BASE, { timeout: REQUEST_TIMEOUT_MS });
    socketRef.current = socket;

    socket.on('menu:updated', (payload) => {
      const updated = payload?.item || payload;
      if (!updated?._id || !belongsToThisRestaurant(updated.restaurant)) return;
      setMenuItems((prev) =>
        prev.map((item) => (item._id === updated._id ? { ...item, isDisplayed: updated.isDisplayed } : item))
      );
    });

    socket.on('order:new', (newOrder) => {
      if (!newOrder?._id || !belongsToThisRestaurant(newOrder.restaurant)) return;
      setOrders((prev) => (prev.some((o) => o._id === newOrder._id) ? prev : [newOrder, ...prev]));
      Vibration.vibrate();
    });

    socket.on('order:updated', (updatedOrder) => {
      if (!updatedOrder?._id || !belongsToThisRestaurant(updatedOrder.restaurant)) return;
      setOrders((prev) => prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o)));
    });

    return () => {
      socket.disconnect();
    };
  }, [authToken, belongsToThisRestaurant]);

  const value = useMemo(
    () => ({
      user,
      authToken,
      isRestoringSession,
      login,
      signUp,
      logout,
      menuItems,
      fetchMenuItems,
      addMenuItem,
      updateMenuItem,
      deleteMenuItem,
      setItemDisplayed,
      toggleRestaurantOpen,
      orders,
      fetchOrders,
      updateOrderStatus,
    }),
    [
      user,
      authToken,
      isRestoringSession,
      login,
      signUp,
      logout,
      menuItems,
      fetchMenuItems,
      addMenuItem,
      updateMenuItem,
      deleteMenuItem,
      setItemDisplayed,
      toggleRestaurantOpen,
      orders,
      fetchOrders,
      updateOrderStatus,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
}
