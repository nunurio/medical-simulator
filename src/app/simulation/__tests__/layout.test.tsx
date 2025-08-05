import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { vi, beforeEach, afterEach } from 'vitest'
import SimulationLayout from '../layout'
import { usePatientStore } from '@/store/patient-store'
import { useUIStore } from '@/store/ui-store'

// Mock stores
vi.mock('@/store/patient-store')
vi.mock('@/store/ui-store')

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), prefetch: vi.fn() }),
  redirect: vi.fn(),
  notFound: vi.fn(),
  usePathname: () => '/simulation',
  useSearchParams: () => new URLSearchParams()
}))

const mockPatientStore = {
  patients: {},
  activePatientId: null,
  loading: false,
  error: null,
}

const mockUIStore = {
  sidebarOpen: true,
  toggleSidebar: vi.fn(),
}

describe('SimulationLayout', () => {
  beforeEach(() => {
    vi.mocked(usePatientStore).mockReturnValue(mockPatientStore)
    vi.mocked(useUIStore).mockReturnValue(mockUIStore)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('患者が選択されていない場合、患者情報未選択メッセージを表示する', () => {
    render(
      <SimulationLayout>
        <div data-testid="chat-content">チャット内容</div>
      </SimulationLayout>
    )

    expect(screen.getByText('患者が選択されていません')).toBeInTheDocument()
    expect(screen.getByText('患者を選択してシミュレーションを開始してください')).toBeInTheDocument()
    expect(screen.getByTestId('chat-content')).toBeInTheDocument()
  })

  it('患者が選択されている場合、患者情報サマリーを表示する', () => {
    const mockPatient = {
      id: 'patient-1',
      demographics: {
        name: '田中太郎',
        age: 45,
        gender: 'male' as const,
        dateOfBirth: '1978-01-01' as const,
      },
      chiefComplaint: '胸痛',
      currentConditions: [
        { name: '高血圧', severity: 'moderate' as const, isActive: true }
      ],
      vitalSigns: {
        baseline: {
          bloodPressure: { systolic: 140, diastolic: 90 },
          heartRate: 80,
          temperature: 36.5,
          respiratoryRate: 16,
          oxygenSaturation: 98
        }
      }
    }

    vi.mocked(usePatientStore).mockReturnValue({
      ...mockPatientStore,
      patients: { 'patient-1': mockPatient },
      activePatientId: 'patient-1',
    })

    render(
      <SimulationLayout>
        <div data-testid="chat-content">チャット内容</div>
      </SimulationLayout>
    )

    expect(screen.getByText('田中太郎')).toBeInTheDocument()
    expect(screen.getByText('45歳 男性')).toBeInTheDocument()
    expect(screen.getByText('胸痛')).toBeInTheDocument()
    expect(screen.getByText('高血圧')).toBeInTheDocument()
    expect(screen.getByText(/140.*90.*mmHg/)).toBeInTheDocument()
    expect(screen.getByText(/80.*bpm/)).toBeInTheDocument()
  })

  it('サイドバーの開閉が正しく動作する', () => {
    render(
      <SimulationLayout>
        <div data-testid="chat-content">チャット内容</div>
      </SimulationLayout>
    )

    const toggleButtons = screen.getAllByRole('button', { name: /サイドバーを切り替え/ })
    fireEvent.click(toggleButtons[0])

    expect(mockUIStore.toggleSidebar).toHaveBeenCalledOnce()
  })

  it('レスポンシブ対応でモバイル表示時にサイドバーが折りたたまれる', () => {
    // モバイル表示をシミュレート
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 640,
    })

    vi.mocked(useUIStore).mockReturnValue({
      ...mockUIStore,
      sidebarOpen: false,
    })

    render(
      <SimulationLayout>
        <div data-testid="chat-content">チャット内容</div>
      </SimulationLayout>
    )

    const sidebar = screen.getByRole('complementary', { name: /患者情報/ })
    expect(sidebar).toHaveClass('hidden', 'sm:block')
  })

  it('適切なaria-labelとrole属性が設定されている', () => {
    render(
      <SimulationLayout>
        <div data-testid="chat-content">チャット内容</div>
      </SimulationLayout>
    )

    expect(screen.getByRole('complementary', { name: /患者情報/ })).toBeInTheDocument()
    expect(screen.getByRole('main', { name: /シミュレーション/ })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /サイドバーを切り替え/ })).toHaveLength(2)
  })

  it('患者データ読み込み中にローディング状態を表示する', () => {
    vi.mocked(usePatientStore).mockReturnValue({
      ...mockPatientStore,
      loading: true,
    })

    render(
      <SimulationLayout>
        <div data-testid="chat-content">チャット内容</div>
      </SimulationLayout>
    )

    expect(screen.getByText('読み込み中...')).toBeInTheDocument()
  })

  it('患者データ読み込みエラー時にエラーメッセージを表示する', () => {
    vi.mocked(usePatientStore).mockReturnValue({
      ...mockPatientStore,
      error: '患者データの読み込みに失敗しました',
    })

    render(
      <SimulationLayout>
        <div data-testid="chat-content">チャット内容</div>
      </SimulationLayout>
    )

    expect(screen.getByText('患者データの読み込みに失敗しました')).toBeInTheDocument()
  })
})