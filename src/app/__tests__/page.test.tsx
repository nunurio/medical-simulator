import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, beforeEach } from 'vitest'
import Home from '../page'

// Next.js useRouterのモック
const mockPush = vi.fn()
const mockPrefetch = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    prefetch: mockPrefetch,
  }),
}))

// PatientSetupFormのモック - Client Component のため
vi.mock('@/components/patient-setup/PatientSetupForm', () => {
  return {
    PatientSetupForm: function MockPatientSetupForm({ onSuccess }: { onSuccess?: () => void }) {
      return (
        <div data-testid="patient-setup-form">
          Patient Setup Form
          <button 
            data-testid="trigger-success" 
            onClick={() => onSuccess?.()}
          >
            Trigger Success
          </button>
        </div>
      )
    }
  }
})

describe('Home Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('タイトルが正しく表示される', () => {
    render(<Home />)
    
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('医療トレーニングシミュレーター')
  })

  it('説明文が正しく表示される', () => {
    render(<Home />)
    
    expect(screen.getByText('診療科と難易度を選択してシミュレーションを開始してください')).toBeInTheDocument()
  })

  it('PatientSetupFormコンポーネントが表示される', () => {
    render(<Home />)
    
    expect(screen.getByTestId('patient-setup-form')).toBeInTheDocument()
  })

  it('適切なセマンティックHTML構造を持つ', () => {
    render(<Home />)
    
    // main要素が存在することを確認
    expect(screen.getByRole('main')).toBeInTheDocument()
    
    // h1タイトルがmain内に存在することを確認
    const main = screen.getByRole('main')
    const title = screen.getByRole('heading', { level: 1 })
    expect(main).toContainElement(title)
  })

  it('レスポンシブクラスが適用されている', () => {
    const { container } = render(<Home />)
    
    // container内の要素にレスポンシブクラスが含まれていることを確認
    const mainContainer = container.firstChild as HTMLElement
    expect(mainContainer.className).toMatch(/p-/)
    expect(mainContainer.className).toMatch(/sm:/)
  })

  it('患者生成成功時に/simulationページにリダイレクトする', async () => {
    const { user } = setup()
    
    render(<Home />)
    
    // 成功をトリガー
    const triggerButton = screen.getByTestId('trigger-success')
    await user.click(triggerButton)
    
    expect(mockPush).toHaveBeenCalledWith('/simulation')
  })

  it('PatientSetupFormにonSuccessコールバックが渡される', () => {
    render(<Home />)
    
    // onSuccessコールバックが存在することを確認
    expect(screen.getByTestId('trigger-success')).toBeInTheDocument()
  })

  it('useRouterフックが正しく初期化される', () => {
    render(<Home />)
    
    // ページが正常にレンダリングされることを確認（useRouterが正しく動作）
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
    expect(mockPrefetch).not.toHaveBeenCalled()
  })

  it('複数の成功イベントが正しく処理される', async () => {
    const { user } = setup()
    
    render(<Home />)
    
    const triggerButton = screen.getByTestId('trigger-success')
    
    // 1回目の成功イベント
    await user.click(triggerButton)
    expect(mockPush).toHaveBeenCalledWith('/simulation')
    
    // 2回目の成功イベント
    await user.click(triggerButton)
    expect(mockPush).toHaveBeenCalledTimes(2)
    expect(mockPush).toHaveBeenLastCalledWith('/simulation')
  })

  it('ナビゲーション中にローディング表示が出る', async () => {
    const { user } = setup()
    
    render(<Home />)
    
    // 初期状態ではローディング表示がない
    expect(screen.queryByText('シミュレーションページに移動中...')).not.toBeInTheDocument()
    
    // 成功をトリガー
    const triggerButton = screen.getByTestId('trigger-success')
    await user.click(triggerButton)
    
    // ローディング表示が表示される
    expect(screen.getByText('シミュレーションページに移動中...')).toBeInTheDocument()
    expect(mockPush).toHaveBeenCalledWith('/simulation')
  })

  it('ローディング中のオーバーレイが適切なスタイルを持つ', async () => {
    const { user } = setup()
    
    render(<Home />)
    
    const triggerButton = screen.getByTestId('trigger-success')
    await user.click(triggerButton)
    
    // ローディングオーバーレイを検証
    const overlay = screen.getByText('シミュレーションページに移動中...').closest('div')
    expect(overlay?.parentElement).toHaveClass('fixed', 'inset-0', 'bg-black', 'bg-opacity-50')
  })
})

// ユーザーイベントのセットアップ用ヘルパー
function setup() {
  const user = userEvent.setup()
  return { user }
}