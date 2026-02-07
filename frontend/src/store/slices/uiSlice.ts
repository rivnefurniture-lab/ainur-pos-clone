import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type ModalType = 
  | 'customer-select'
  | 'customer-create'
  | 'product-select'
  | 'payment'
  | 'shift-open'
  | 'shift-close'
  | 'cash-in'
  | 'cash-out'
  | 'discount'
  | 'return'
  | 'settings'
  | null;

interface UiState {
  sidebarOpen: boolean;
  currentModal: ModalType;
  modalData: unknown;
  searchQuery: string;
  isSearching: boolean;
  theme: 'light' | 'dark';
  language: 'uk' | 'en' | 'ru';
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    timestamp: number;
  }>;
}

const initialState: UiState = {
  sidebarOpen: true,
  currentModal: null,
  modalData: null,
  searchQuery: '',
  isSearching: false,
  theme: 'light',
  language: 'uk',
  notifications: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    openModal: (state, action: PayloadAction<{ modal: ModalType; data?: unknown }>) => {
      state.currentModal = action.payload.modal;
      state.modalData = action.payload.data || null;
    },
    closeModal: (state) => {
      state.currentModal = null;
      state.modalData = null;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setIsSearching: (state, action: PayloadAction<boolean>) => {
      state.isSearching = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    setLanguage: (state, action: PayloadAction<'uk' | 'en' | 'ru'>) => {
      state.language = action.payload;
    },
    addNotification: (state, action: PayloadAction<{ type: 'success' | 'error' | 'warning' | 'info'; message: string }>) => {
      state.notifications.push({
        id: Math.random().toString(36).substr(2, 9),
        ...action.payload,
        timestamp: Date.now(),
      });
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  openModal,
  closeModal,
  setSearchQuery,
  setIsSearching,
  setTheme,
  setLanguage,
  addNotification,
  removeNotification,
  clearNotifications,
} = uiSlice.actions;

export default uiSlice.reducer;
