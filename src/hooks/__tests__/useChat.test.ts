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
    
    // useStoreはフラットな構造を返す必要がある
    vi.mocked(useStoreModule.useStore).mockReturnValue({
      // ChatStore properties
      conversations: mockChatStore.conversations,
      activeConversationId: mockChatStore.activeConversationId,
      isTyping: mockChatStore.isTyping,
      addMessage: mockChatStore.addMessage,
      setTyping: mockChatStore.setTyping,
      createConversation: mockChatStore.createConversation,
      endConversation: mockChatStore.endConversation,
      setActiveConversation: mockChatStore.setActiveConversation,
      sendMessage: mockChatStore.sendMessage,
      removeMessage: mockChatStore.removeMessage,
      
      // PatientStore properties
      patients: mockPatientStore.patients,
      activePatientId: mockPatientStore.activePatientId,
      
      // UIStore properties
      isLoading: mockUIStore.isLoading,
      error: mockUIStore.error,
      setLoading: mockUIStore.setLoading,
      setError: mockUIStore.setError,
    });
    
    // Server Actionのモックも設定
    vi.mocked(sendChatMessageModule.sendChatMessage).mockResolvedValue({
      success: true,
      patientResponse: 'Test patient response',
      usage: {
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150
      }
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
      const localMockChatStore = { ...mockChatStore, activeConversationId: null };
      
      const useStoreModule = await import('../use-store');
      vi.mocked(useStoreModule.useStore).mockReturnValue({
        // ChatStore properties
        conversations: localMockChatStore.conversations,
        activeConversationId: localMockChatStore.activeConversationId,
        isTyping: localMockChatStore.isTyping,
        addMessage: localMockChatStore.addMessage,
        setTyping: localMockChatStore.setTyping,
        createConversation: localMockChatStore.createConversation,
        endConversation: localMockChatStore.endConversation,
        setActiveConversation: localMockChatStore.setActiveConversation,
        sendMessage: localMockChatStore.sendMessage,
        removeMessage: localMockChatStore.removeMessage,
        
        // PatientStore properties
        patients: mockPatientStore.patients,
        activePatientId: mockPatientStore.activePatientId,
        
        // UIStore properties
        isLoading: mockUIStore.isLoading,
        error: mockUIStore.error,
        setLoading: mockUIStore.setLoading,
        setError: mockUIStore.setError,
      });

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
        // ChatStore properties
        conversations: localMockChatStore.conversations,
        activeConversationId: localMockChatStore.activeConversationId,
        isTyping: localMockChatStore.isTyping,
        addMessage: localMockChatStore.addMessage,
        setTyping: localMockChatStore.setTyping,
        createConversation: localMockChatStore.createConversation,
        endConversation: localMockChatStore.endConversation,
        setActiveConversation: localMockChatStore.setActiveConversation,
        sendMessage: localMockChatStore.sendMessage,
        removeMessage: localMockChatStore.removeMessage,
        
        // PatientStore properties
        patients: localMockPatientStore.patients,
        activePatientId: localMockPatientStore.activePatientId,
        
        // UIStore properties
        isLoading: mockUIStore.isLoading,
        error: mockUIStore.error,
        setLoading: mockUIStore.setLoading,
        setError: mockUIStore.setError,
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

  describe('API統合とローディング状態管理', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('メッセージ送信中にisLoadingがtrueになる', async () => {
      // アクティブな会話とpatientを設定
      mockChatStore.activeConversationId = 'test-conv-1';
      mockPatientStore.activePatientId = 'patient-1';
      
      // 長時間かかるAPI呼び出しをシミュレート
      const sendChatMessageModule = await import('../../app/actions/send-chat-message');
      vi.mocked(sendChatMessageModule.sendChatMessage).mockResolvedValue({
        success: true,
        patientResponse: 'Patient response',
        usage: {
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150
        }
      });

      const { result } = renderHook(() => useChat());

      // 送信開始
      await act(async () => {
        await result.current.sendMessage('Test message');
      });

      // ローディング中であることを期待
      expect(mockUIStore.setLoading).toHaveBeenCalledWith(true);
      expect(mockUIStore.setLoading).toHaveBeenCalledWith(false);
    }, 10000);

    it('API呼び出し失敗時にエラー状態を管理する', async () => {
      // アクティブな会話とpatientを設定
      mockChatStore.activeConversationId = 'test-conv-1';
      mockPatientStore.activePatientId = 'patient-1';
      
      const sendChatMessageModule = await import('../../app/actions/send-chat-message');
      vi.mocked(sendChatMessageModule.sendChatMessage).mockRejectedValue(
        new Error('Network timeout')
      );

      const { result } = renderHook(() => useChat());

      await expect(async () => {
        await act(async () => {
          await result.current.sendMessage('Failed message');
        });
      }).rejects.toThrow('Network timeout');

      // エラー状態が設定される
      expect(mockUIStore.setError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Network timeout',
          type: 'api_error'
        })
      );
    });

    it('clearError()でエラー状態をクリアできる', () => {
      const { result } = renderHook(() => useChat());

      act(() => {
        result.current.clearError();
      });

      expect(mockUIStore.setError).toHaveBeenCalledWith(null);
    });
  });

  describe('会話履歴とコンテキスト管理', () => {
    it('会話履歴を適切に管理する', async () => {
      // アクティブな会話にメッセージ履歴がある状態を設定
      const mockConversation = {
        id: 'test-conv-1',
        encounterId: 'encounter-1',
        messages: [
          {
            id: 'msg-1',
            content: 'Hello',
            sender: 'provider' as const,
            timestamp: '2023-01-01T10:00:00Z',
            type: 'text' as const
          },
          {
            id: 'msg-2', 
            content: 'Hi there',
            sender: 'patient' as const,
            timestamp: '2023-01-01T10:01:00Z',
            type: 'text' as const
          }
        ],
        startedAt: '2023-01-01T09:00:00Z',
        endedAt: null
      };
      
      // モックストアの会話データを設定
      mockChatStore.conversations = {
        'test-conv-1': mockConversation
      };
      mockChatStore.activeConversationId = 'test-conv-1';
      
      // useStoreモジュールを再度インポートしてモックを更新
      const useStoreModule = await import('../use-store');
      vi.mocked(useStoreModule.useStore).mockReturnValue({
        // ChatStore properties
        conversations: mockChatStore.conversations,
        activeConversationId: mockChatStore.activeConversationId,
        isTyping: mockChatStore.isTyping,
        addMessage: mockChatStore.addMessage,
        setTyping: mockChatStore.setTyping,
        createConversation: mockChatStore.createConversation,
        endConversation: mockChatStore.endConversation,
        setActiveConversation: mockChatStore.setActiveConversation,
        sendMessage: mockChatStore.sendMessage,
        removeMessage: mockChatStore.removeMessage,
        
        // PatientStore properties
        patients: mockPatientStore.patients,
        activePatientId: mockPatientStore.activePatientId,
        
        // UIStore properties
        isLoading: mockUIStore.isLoading,
        error: mockUIStore.error,
        setLoading: mockUIStore.setLoading,
        setError: mockUIStore.setError,
      });

      const { result } = renderHook(() => useChat());

      expect(result.current.conversation).toEqual(mockConversation);
      expect(result.current.conversation?.messages).toHaveLength(2);
    });
  });
});