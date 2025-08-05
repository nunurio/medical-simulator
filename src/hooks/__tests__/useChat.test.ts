import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChat } from '../useChat';

// モックの設定
vi.mock('../use-store', () => ({
  useStore: vi.fn(),
}));

vi.mock('../../app/actions/send-chat-message', () => ({
  sendChatMessage: vi.fn(),
}));

describe('useChat', () => {
  const mockChatStore = {
    conversations: {},
    activeConversationId: 'test-conv-1',
    isTyping: false,
    addMessage: vi.fn(),
    setTyping: vi.fn(),
    createConversation: vi.fn(),
    endConversation: vi.fn(),
    setActiveConversation: vi.fn(),
    sendMessage: vi.fn(),
    removeMessage: vi.fn(),
  };

  const mockPatientStore = {
    patients: {
      'patient-1': {
        id: 'patient-1',
        demographics: {
          name: 'Test Patient',
          age: 30,
          gender: 'male' as const,
        },
        medicalHistory: {
          allergies: [],
          medications: [],
          conditions: [],
        },
      },
    },
    activePatientId: 'patient-1',
  };

  const mockUIStore = {
    isLoading: false,
    error: null,
    setLoading: vi.fn(),
    setError: vi.fn(),
  };

  beforeEach(async () => {
    // モックストアの状態をリセット
    mockChatStore.activeConversationId = 'test-conv-1';
    mockPatientStore.activePatientId = 'patient-1';
    
    const useStoreModule = await import('../use-store');
    const sendChatMessageModule = await import('../../app/actions/send-chat-message');
    
    vi.mocked(useStoreModule.useStore).mockReturnValue({
      chat: mockChatStore,
      patient: mockPatientStore,
      ui: mockUIStore,
    });
    
    // Server Actionのモックも設定
    vi.mocked(sendChatMessageModule.sendChatMessage).mockResolvedValue({
      success: true,
      patientResponse: 'Test patient response',
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('初期状態', () => {
    it('チャット機能の初期状態が正しく設定される', () => {
      const { result } = renderHook(() => useChat());

      expect(result.current.isTyping).toBe(false);
      expect(result.current.activeConversationId).toBe('test-conv-1');
      expect(typeof result.current.sendMessage).toBe('function');
    });

    it('患者情報が正しく取得される', () => {
      const { result } = renderHook(() => useChat());

      expect(result.current.currentPatient).toEqual(mockPatientStore.patients['patient-1']);
    });
  });

  describe('sendMessage', () => {
    it('メッセージ送信時に楽観的更新が実行される', async () => {
      const { result } = renderHook(() => useChat());

      await act(async () => {
        await result.current.sendMessage('Hello, doctor!');
      });

      // 楽観的更新でメッセージが即座に追加されることを確認
      expect(mockChatStore.sendMessage).toHaveBeenCalledWith(
        'test-conv-1',
        expect.objectContaining({
          content: 'Hello, doctor!',
          sender: 'provider'
        })
      );
    });

    it('アクティブな会話がない場合はエラーを投げる', async () => {
      mockChatStore.activeConversationId = null;

      const { result } = renderHook(() => useChat());

      await expect(async () => {
        await act(async () => {
          await result.current.sendMessage('Hello');
        });
      }).rejects.toThrow('アクティブな会話がありません');
    });

    it('患者が選択されていない場合はエラーを投げる', async () => {
      // この特定のテストでは患者IDをnullに設定（会話IDは有効に保つ）
      const localMockPatientStore = { ...mockPatientStore, activePatientId: null };
      const localMockChatStore = { ...mockChatStore, activeConversationId: 'test-conv-1' };
      
      const useStoreModule = await import('../use-store');
      vi.mocked(useStoreModule.useStore).mockReturnValue({
        chat: localMockChatStore,
        patient: localMockPatientStore,
        ui: mockUIStore,
      });

      const { result } = renderHook(() => useChat());

      await expect(async () => {
        await act(async () => {
          await result.current.sendMessage('Hello');
        });
      }).rejects.toThrow('患者が選択されていません');
    });
  });

  describe('楽観的更新のロールバック', () => {
    it('Server Actionエラー時に楽観的更新をロールバックする', async () => {
      // Server Actionをエラーを返すように設定
      const sendChatMessageModule = await import('../../app/actions/send-chat-message');
      vi.mocked(sendChatMessageModule.sendChatMessage).mockResolvedValue({
        success: false,
        error: 'API呼び出しエラー',
      });

      const { result } = renderHook(() => useChat());

      await expect(async () => {
        await act(async () => {
          await result.current.sendMessage('Failed message');
        });
      }).rejects.toThrow('API呼び出しエラー');

      // 楽観的更新が追加されたこと
      expect(mockChatStore.sendMessage).toHaveBeenCalled();
      
      // エラー後にメッセージが削除（ロールバック）されたこと
      expect(mockChatStore.removeMessage).toHaveBeenCalled();
    });

    it('ネットワークエラー時に楽観的更新をロールバックする', async () => {
      // Server Actionをネットワークエラーで失敗させる
      const sendChatMessageModule = await import('../../app/actions/send-chat-message');
      vi.mocked(sendChatMessageModule.sendChatMessage).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useChat());

      await expect(async () => {
        await act(async () => {
          await result.current.sendMessage('Network fail message');
        });
      }).rejects.toThrow('Network error');

      // ロールバックが実行されたこと
      expect(mockChatStore.removeMessage).toHaveBeenCalled();
    });
  });

  describe('タイピング状態管理', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('メッセージ入力中にタイピング状態を更新する', () => {
      const { result } = renderHook(() => useChat());

      act(() => {
        result.current.handleTyping();
      });

      expect(mockChatStore.setTyping).toHaveBeenCalledWith(true);
    });

    it('タイピング停止時にデバウンス処理でタイピング状態をfalseにする', () => {
      const { result } = renderHook(() => useChat());

      act(() => {
        result.current.handleTyping();
      });

      // デバウンス時間経過
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(mockChatStore.setTyping).toHaveBeenCalledWith(false);
    });
  });
});