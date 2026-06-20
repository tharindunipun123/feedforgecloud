'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getGuestCart,
  saveGuestCart,
  clearGuestCart,
  validateCartItem,
  calculateCartSubtotal,
} from '@/lib/cart/helpers';
import { saveCartToFirestore, getCartFromFirestore } from '@/lib/firebase/firestore';
import { calculateTax, calculateTotal } from '@/lib/billing/helpers';

const CartContext = createContext(null);

const TAX_RATE = 0;

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const loadCart = useCallback(async () => {
    if (user) {
      const firestoreCart = await getCartFromFirestore(user.uid);
      const guestCart = getGuestCart();
      const mergedItems = [...(firestoreCart.items || [])];
      for (const guestItem of guestCart.items || []) {
        if (validateCartItem(guestItem) && !mergedItems.find((i) => i.id === guestItem.id)) {
          mergedItems.push(guestItem);
        }
      }
      setItems(mergedItems.filter(validateCartItem));
      setBillingCycle(firestoreCart.billingCycle || 'monthly');
      clearGuestCart();
      await saveCartToFirestore(user.uid, { items: mergedItems, billingCycle: firestoreCart.billingCycle || 'monthly' });
    } else {
      const guestCart = getGuestCart();
      setItems((guestCart.items || []).filter(validateCartItem));
      setBillingCycle(guestCart.billingCycle || 'monthly');
    }
    setLoaded(true);
  }, [user]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const persistCart = useCallback(
    async (newItems, newBillingCycle) => {
      const cartData = { items: newItems, billingCycle: newBillingCycle || billingCycle, coupon };
      if (user) {
        await saveCartToFirestore(user.uid, cartData);
      } else {
        saveGuestCart(cartData);
      }
    },
    [user, billingCycle, coupon]
  );

  const addItem = useCallback(
    async (item) => {
      if (!validateCartItem(item)) return;
      const newItems = [...items, item];
      setItems(newItems);
      await persistCart(newItems);
    },
    [items, persistCart]
  );

  const removeItem = useCallback(
    async (itemId) => {
      const newItems = items.filter((i) => i.id !== itemId);
      setItems(newItems);
      await persistCart(newItems);
    },
    [items, persistCart]
  );

  const updateQuantity = useCallback(
    async (itemId, quantity) => {
      const newItems = items.map((i) =>
        i.id === itemId ? { ...i, quantity: Math.max(1, quantity) } : i
      );
      setItems(newItems);
      await persistCart(newItems);
    },
    [items, persistCart]
  );

  const updateItem = useCallback(
    async (itemId, updates) => {
      const newItems = items.map((i) => (i.id === itemId ? { ...i, ...updates } : i));
      setItems(newItems);
      await persistCart(newItems);
    },
    [items, persistCart]
  );

  const clearCart = useCallback(async () => {
    setItems([]);
    setDiscount(0);
    setCoupon('');
    if (user) {
      await saveCartToFirestore(user.uid, { items: [], billingCycle: 'monthly' });
    } else {
      clearGuestCart();
    }
  }, [user]);

  const changeBillingCycle = useCallback(
    async (cycle) => {
      setBillingCycle(cycle);
      await persistCart(items, cycle);
    },
    [items, persistCart]
  );

  const applyCoupon = useCallback((code) => {
    setCoupon(code);
    if (code.toUpperCase() === 'QUANTUM10') {
      setDiscount(10);
    } else {
      setDiscount(0);
    }
  }, []);

  const subtotal = calculateCartSubtotal(items, billingCycle);
  const tax = calculateTax(subtotal, TAX_RATE);
  const total = calculateTotal(subtotal, tax, discount);
  const itemCount = items.reduce((sum, i) => sum + (i.quantity || 1), 0);

  return (
    <CartContext.Provider
      value={{
        items,
        billingCycle,
        coupon,
        discount,
        subtotal,
        tax,
        total,
        itemCount,
        loaded,
        addItem,
        removeItem,
        updateQuantity,
        updateItem,
        clearCart,
        changeBillingCycle,
        applyCoupon,
        setCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
