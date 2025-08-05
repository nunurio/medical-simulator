import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '../ui-store';

describe('UIStore', () => {
  beforeEach(() => {
    // Zustandストアの状態をリセット
    useUIStore.setState({
      theme: 'light',
      sidebarOpen: true,
      activeTab: '',
      modals: {
        orderModal: false,
        resultModal: false,
        helpModal: false,
      },
      notifications: [],
    });
  });

  describe('初期状態', () => {
    it('初期値が正しく設定されている', () => {
      const store = useUIStore.getState();
      
      expect(store.theme).toBe('light');
      expect(store.sidebarOpen).toBe(true);
      expect(store.activeTab).toBe('');
      expect(store.modals).toEqual({
        orderModal: false,
        resultModal: false,
        helpModal: false,
      });
      expect(store.notifications).toEqual([]);
    });
  });

  describe('テーマ管理', () => {
    it('テーマを変更できる', () => {
      const { setTheme } = useUIStore.getState();
      
      setTheme('dark');
      expect(useUIStore.getState().theme).toBe('dark');
      
      setTheme('light');
      expect(useUIStore.getState().theme).toBe('light');
    });
  });

  describe('サイドバー状態管理', () => {
    it('サイドバーの開閉状態をトグルできる', () => {
      const { toggleSidebar } = useUIStore.getState();
      
      // 初期状態はtrue
      expect(useUIStore.getState().sidebarOpen).toBe(true);
      
      toggleSidebar();
      expect(useUIStore.getState().sidebarOpen).toBe(false);
      
      toggleSidebar();
      expect(useUIStore.getState().sidebarOpen).toBe(true);
    });
  });

  describe('アクティブタブ管理', () => {
    it('アクティブタブを設定できる', () => {
      const { setActiveTab } = useUIStore.getState();
      
      setActiveTab('orders');
      expect(useUIStore.getState().activeTab).toBe('orders');
      
      setActiveTab('results');
      expect(useUIStore.getState().activeTab).toBe('results');
    });
  });

  describe('モーダル管理', () => {
    it('モーダルを開くことができる', () => {
      const { openModal } = useUIStore.getState();
      
      openModal('orderModal');
      expect(useUIStore.getState().modals.orderModal).toBe(true);
      
      openModal('resultModal');
      expect(useUIStore.getState().modals.resultModal).toBe(true);
      
      openModal('helpModal');
      expect(useUIStore.getState().modals.helpModal).toBe(true);
    });

    it('モーダルを閉じることができる', () => {
      const { openModal, closeModal } = useUIStore.getState();
      
      // まず開く
      openModal('orderModal');
      expect(useUIStore.getState().modals.orderModal).toBe(true);
      
      // 閉じる
      closeModal('orderModal');
      expect(useUIStore.getState().modals.orderModal).toBe(false);
    });
  });

  describe('通知システム', () => {
    it('通知を追加できる', () => {
      const { addNotification } = useUIStore.getState();
      
      addNotification({
        type: 'success',
        message: 'テスト通知',
      });
      
      const notifications = useUIStore.getState().notifications;
      expect(notifications).toHaveLength(1);
      expect(notifications[0]).toMatchObject({
        type: 'success',
        message: 'テスト通知',
      });
      expect(notifications[0].id).toBeDefined();
      expect(notifications[0].timestamp).toBeDefined();
    });

    it('複数の通知を追加できる', () => {
      const { addNotification } = useUIStore.getState();
      
      addNotification({ type: 'info', message: '情報通知' });
      addNotification({ type: 'warning', message: '警告通知' });
      addNotification({ type: 'error', message: 'エラー通知' });
      
      const notifications = useUIStore.getState().notifications;
      expect(notifications).toHaveLength(3);
      expect(notifications.map(n => n.type)).toEqual(['info', 'warning', 'error']);
    });

    it('特定の通知を削除できる', () => {
      const { addNotification, removeNotification } = useUIStore.getState();
      
      // 通知を追加
      addNotification({ type: 'info', message: '削除対象' });
      const notifications = useUIStore.getState().notifications;
      const targetId = notifications[0].id;
      
      // 削除
      removeNotification(targetId);
      expect(useUIStore.getState().notifications).toHaveLength(0);
    });

    it('duration付きの通知を追加できる', () => {
      const { addNotification } = useUIStore.getState();
      
      addNotification({
        type: 'info',
        message: '自動消去される通知',
        duration: 5000,
      });
      
      const notifications = useUIStore.getState().notifications;
      expect(notifications[0].duration).toBe(5000);
    });
  });
});