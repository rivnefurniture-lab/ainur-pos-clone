import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Product, Customer, CartItem, Cart } from '../../types';

interface CartState extends Cart {
  paymentMethod: 'cash' | 'card' | 'split' | null;
  cashReceived: number;
  cardReceived: number;
}

const initialState: CartState = {
  items: [],
  customer: undefined,
  subtotal: 0,
  discount: 0,
  discountPercent: 0,
  total: 0,
  notes: undefined,
  paymentMethod: null,
  cashReceived: 0,
  cardReceived: 0,
};

const calculateTotals = (state: CartState) => {
  state.subtotal = state.items.reduce((sum, item) => sum + item.total, 0);
  
  // Apply customer discount if exists
  if (state.customer?.discount) {
    state.discountPercent = state.customer.discount;
    state.discount = state.subtotal * (state.discountPercent / 100);
  }
  
  state.total = state.subtotal - state.discount;
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<{ product: Product; quantity?: number }>) => {
      const { product, quantity = 1 } = action.payload;
      const existingItem = state.items.find(item => item.product._id === product._id);

      if (existingItem) {
        existingItem.quantity += quantity;
        existingItem.total = existingItem.quantity * existingItem.price * (1 - existingItem.discount / 100);
      } else {
        const newItem: CartItem = {
          product,
          quantity,
          price: product.price,
          discount: 0,
          total: quantity * product.price,
        };
        state.items.push(newItem);
      }

      calculateTotals(state);
    },

    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.product._id !== action.payload);
      calculateTotals(state);
    },

    updateQuantity: (state, action: PayloadAction<{ productId: string; quantity: number }>) => {
      const { productId, quantity } = action.payload;
      const item = state.items.find(i => i.product._id === productId);
      
      if (item) {
        if (quantity <= 0) {
          state.items = state.items.filter(i => i.product._id !== productId);
        } else {
          item.quantity = quantity;
          item.total = quantity * item.price * (1 - item.discount / 100);
        }
        calculateTotals(state);
      }
    },

    updateItemPrice: (state, action: PayloadAction<{ productId: string; price: number }>) => {
      const { productId, price } = action.payload;
      const item = state.items.find(i => i.product._id === productId);
      
      if (item) {
        item.price = price;
        item.total = item.quantity * price * (1 - item.discount / 100);
        calculateTotals(state);
      }
    },

    updateItemDiscount: (state, action: PayloadAction<{ productId: string; discount: number }>) => {
      const { productId, discount } = action.payload;
      const item = state.items.find(i => i.product._id === productId);
      
      if (item) {
        item.discount = discount;
        item.total = item.quantity * item.price * (1 - discount / 100);
        calculateTotals(state);
      }
    },

    setCustomer: (state, action: PayloadAction<Customer | undefined>) => {
      state.customer = action.payload;
      
      // Reset discount when customer changes
      if (action.payload) {
        state.discountPercent = action.payload.discount || 0;
      } else {
        state.discountPercent = 0;
      }
      state.discount = 0;
      
      calculateTotals(state);
    },

    setCartDiscount: (state, action: PayloadAction<{ percent?: number; amount?: number }>) => {
      const { percent, amount } = action.payload;
      
      if (percent !== undefined) {
        state.discountPercent = percent;
        state.discount = state.subtotal * (percent / 100);
      } else if (amount !== undefined) {
        state.discount = amount;
        state.discountPercent = state.subtotal > 0 ? (amount / state.subtotal) * 100 : 0;
      }
      
      state.total = state.subtotal - state.discount;
    },

    setNotes: (state, action: PayloadAction<string | undefined>) => {
      state.notes = action.payload;
    },

    setPaymentMethod: (state, action: PayloadAction<'cash' | 'card' | 'split' | null>) => {
      state.paymentMethod = action.payload;
      if (action.payload === 'cash') {
        state.cashReceived = state.total;
        state.cardReceived = 0;
      } else if (action.payload === 'card') {
        state.cashReceived = 0;
        state.cardReceived = state.total;
      }
    },

    setCashReceived: (state, action: PayloadAction<number>) => {
      state.cashReceived = action.payload;
    },

    setCardReceived: (state, action: PayloadAction<number>) => {
      state.cardReceived = action.payload;
    },

    clearCart: (state) => {
      state.items = [];
      state.customer = undefined;
      state.subtotal = 0;
      state.discount = 0;
      state.discountPercent = 0;
      state.total = 0;
      state.notes = undefined;
      state.paymentMethod = null;
      state.cashReceived = 0;
      state.cardReceived = 0;
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  updateItemPrice,
  updateItemDiscount,
  setCustomer,
  setCartDiscount,
  setNotes,
  setPaymentMethod,
  setCashReceived,
  setCardReceived,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;
