import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { UIStore, Notification } from '@/types/state';

export const useUIStore = create<UIStore>()(
  immer((set) => ({
  // 初期状態
  theme: 'light',
  sidebarOpen: true,
  activeTab: '',
  modals: {
    orderModal: false,
    resultModal: false,
    helpModal: false,
  },
  notifications: [],

  // アクション
  setTheme: (theme) => set((state) => {
    state.theme = theme;
  }),
  toggleSidebar: () => set((state) => {
    state.sidebarOpen = !state.sidebarOpen;
  }),
  setActiveTab: (tab) => set((state) => {
    state.activeTab = tab;
  }),
  openModal: (modal) => set((state) => {
    state.modals[modal] = true;
  }),
  closeModal: (modal) => set((state) => {
    state.modals[modal] = false;
  }),
  addNotification: (notification) => set((state) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString() as Notification['timestamp'],
    };
    state.notifications.push(newNotification);
  }),
  removeNotification: (id) => set((state) => {
    state.notifications = state.notifications.filter(n => n.id !== id);
  }),
})));