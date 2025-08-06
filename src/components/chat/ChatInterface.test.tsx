import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { ChatInterface } from './ChatInterface'
import type { ChatConversation, EncounterId } from '@/types/chat'
import { createISODateTime, createEncounterId } from '@/types/core'

const mockConversation: ChatConversation = {
  id: 'conv-1',
  encounterId: 'enc-1' as EncounterId,
  startedAt: createISODateTime('2024-01-01T10:00:00Z'),
  endedAt: null,
  lastActivityAt: createISODateTime('2024-01-01T10:02:00Z'),
  status: 'active',
  participants: {
    patient: {
      role: 'patient',
      name: '田中太郎'
    },
    provider: {
      role: 'provider',
      name: '医師'
    }
  },
  messages: [
    {
      id: 'msg-1',
      encounterId: 'enc-1' as EncounterId,
      timestamp: createISODateTime('2024-01-01T10:00:00Z'),
      messageType: 'patient',
      content: '胸が痛みます'
    },
    {
      id: 'msg-2',
      encounterId: 'enc-1' as EncounterId,
      timestamp: createISODateTime('2024-01-01T10:01:00Z'),
      messageType: 'simulator',
      content: 'どのような痛みですか？'
    }
  ]
}

// カスタムフック用のモック（未使用だが将来の実装に備えて保持）
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockUseChat = {
  conversation: mockConversation,
  isLoading: false,
  error: null,
  isTyping: false,
  sendMessage: vi.fn(),
  startTyping: vi.fn(),
  stopTyping: vi.fn(),
}

// scrollIntoViewのモック
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  value: vi.fn(),
  writable: true,
})

// モック実装を直接インジェクション

describe('ChatInterface', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('チャットインターフェースが正しく表示される', () => {
    render(<ChatInterface encounterId={createEncounterId('enc-1')} />)
    
    // メッセージリストが表示される
    expect(screen.getByText('胸が痛みます')).toBeInTheDocument()
    expect(screen.getByText('どのような痛みですか？')).toBeInTheDocument()
    
    // メッセージ入力コンポーネントが表示される
    expect(screen.getByPlaceholderText('メッセージを入力してください...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '送信' })).toBeInTheDocument()
  })

  it('メッセージ送信機能が存在する', async () => {
    const user = userEvent.setup()
    render(<ChatInterface encounterId={createEncounterId('enc-1')} />)
    
    const input = screen.getByPlaceholderText('メッセージを入力してください...')
    const sendButton = screen.getByRole('button', { name: '送信' })
    
    await user.type(input, 'テストメッセージ')
    await user.click(sendButton)
    
    // 送信機能は動作する（実際の実装は別エージェントが担当）
    expect(input).toHaveValue('') // メッセージがクリアされる
  })

  it('アクセシビリティ属性が正しく設定されている', () => {
    render(<ChatInterface encounterId={createEncounterId('enc-1')} />)
    
    const chatInterface = screen.getByRole('main')
    expect(chatInterface).toHaveAttribute('aria-label', 'チャットインターフェース')
  })

  describe('実際のAPI統合とローディング状態', () => {
    it('メッセージ送信中にローディング表示される', async () => {
      const user = userEvent.setup()
      render(<ChatInterface encounterId={createEncounterId('enc-1')} />)
      
      const input = screen.getByPlaceholderText('メッセージを入力してください...')
      const sendButton = screen.getByRole('button', { name: '送信' })
      
      await user.type(input, 'API統合テストメッセージ')
      await user.click(sendButton)
      
      // ローディングスピナーまたはインジケーターが表示される
      expect(screen.getByRole('status', { name: /送信中/ })).toBeInTheDocument()
      
      // 送信中は送信ボタンが無効化される
      expect(sendButton).toBeDisabled()
    })

    it('タイピングインジケーターが表示される', async () => {
      const user = userEvent.setup()
      render(<ChatInterface encounterId={createEncounterId('enc-1')} />)
      
      const input = screen.getByPlaceholderText('メッセージを入力してください...')
      
      await user.type(input, 'テスト入力')
      
      // タイピングインジケーターが表示される
      expect(screen.getByText(/入力中/)).toBeInTheDocument()
    })

    it('患者がタイピング中の場合にインジケーター表示', () => {
      // 患者がタイピング中の状態でレンダー
      render(<ChatInterface encounterId={createEncounterId('enc-1')} />)
      
      // 患者のタイピングインジケーターが表示される
      expect(screen.getByText(/患者が入力中/)).toBeInTheDocument()
      expect(screen.getByRole('status', { name: '入力状態' })).toBeInTheDocument()
    })

    it('APIレスポンス後にローディング状態が解除される', async () => {
      const user = userEvent.setup()
      render(<ChatInterface encounterId={createEncounterId('enc-1')} />)
      
      const input = screen.getByPlaceholderText('メッセージを入力してください...')
      const sendButton = screen.getByRole('button', { name: '送信' })
      
      await user.type(input, 'APIレスポンステスト')
      await user.click(sendButton)
      
      // ローディングが表示される
      expect(screen.getByRole('status', { name: /送信中/ })).toBeInTheDocument()
      
      // APIレスポンス完了後（タイムアウト待機）
      await vi.waitFor(() => {
        expect(screen.queryByRole('status', { name: /送信中/ })).not.toBeInTheDocument()
      }, { timeout: 5000 })
      
      // 送信ボタンが再度有効化される
      expect(sendButton).not.toBeDisabled()
    })
  })

  describe('エラーハンドリングとリカバリ', () => {
    it('API呼び出し失敗時にエラーメッセージが表示される', async () => {
      const user = userEvent.setup()
      render(<ChatInterface encounterId={createEncounterId('enc-1')} />)
      
      const input = screen.getByPlaceholderText('メッセージを入力してください...')
      const sendButton = screen.getByRole('button', { name: '送信' })
      
      await user.type(input, 'エラーテストメッセージ')
      await user.click(sendButton)
      
      // エラーメッセージが表示される
      await vi.waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByText(/メッセージの送信に失敗しました/)).toBeInTheDocument()
      }, { timeout: 5000 })
    })

    it('ネットワークエラー時の適切な表示', async () => {
      const user = userEvent.setup()
      render(<ChatInterface encounterId={createEncounterId('enc-1')} />)
      
      const input = screen.getByPlaceholderText('メッセージを入力してください...')
      const sendButton = screen.getByRole('button', { name: '送信' })
      
      await user.type(input, 'ネットワークエラーテスト')
      await user.click(sendButton)
      
      // ネットワークエラー時の表示
      await vi.waitFor(() => {
        expect(screen.getByText(/接続に問題があります/)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: '再試行' })).toBeInTheDocument()
      }, { timeout: 5000 })
    })

    it('エラー状態からの回復', async () => {
      const user = userEvent.setup()
      render(<ChatInterface encounterId={createEncounterId('enc-1')} />)
      
      const input = screen.getByPlaceholderText('メッセージを入力してください...')
      const sendButton = screen.getByRole('button', { name: '送信' })
      
      // エラーを発生させる
      await user.type(input, 'エラー回復テスト')
      await user.click(sendButton)
      
      // エラーメッセージが表示される
      await vi.waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      }, { timeout: 5000 })
      
      // エラー解除ボタンをクリック
      const clearErrorButton = screen.getByRole('button', { name: /エラーを解除/ })
      await user.click(clearErrorButton)
      
      // エラーメッセージが非表示になる
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      
      // 通常の操作に戻れる
      expect(sendButton).not.toBeDisabled()
    })
  })

  describe('リアルタイム通信とレスポンシブUI', () => {
    it('キーボードナビゲーションが機能する', async () => {
      const user = userEvent.setup()
      render(<ChatInterface encounterId={createEncounterId('enc-1')} />)
      
      const input = screen.getByPlaceholderText('メッセージを入力してください...')
      const sendButton = screen.getByRole('button', { name: '送信' })
      
      // Tabキーでナビゲーション
      await user.tab()
      expect(input).toHaveFocus()
      
      await user.tab()
      expect(sendButton).toHaveFocus()
      
      // Enterキーで送信
      await user.type(input, 'キーボードテスト')
      await user.keyboard('{Enter}')
      
      expect(input).toHaveValue('')
    })

    it('スクリーンリーダー対応', () => {
      render(<ChatInterface encounterId={createEncounterId('enc-1')} />)
      
      // 適切なARIA属性が設定されている
      expect(screen.getByRole('log', { name: 'チャット履歴' })).toBeInTheDocument()
      expect(screen.getByRole('textbox', { name: 'メッセージ入力' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '送信' })).toHaveAttribute('aria-describedby')
    })
  })
})