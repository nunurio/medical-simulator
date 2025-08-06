import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { vi, beforeEach, afterEach } from 'vitest'
import SimulationPage from '../page'
import { usePatientStore } from '@/store/patient-store'
import { redirect } from 'next/navigation'

// Mock stores and navigation
vi.mock('@/store/patient-store')
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  useRouter: () => ({ push: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/simulation',
  useSearchParams: () => new URLSearchParams()
}))

// Mock ChatInterface component
vi.mock('@/components/chat/ChatInterface', () => ({
  ChatInterface: function MockChatInterface() {
    return <div data-testid="chat-interface">Chat Interface Component</div>
  }
}))

const mockPatientStore = {
  patients: {},
  activePatientId: null,
  loading: false,
  error: null,
}

describe('SimulationPage', () => {
  beforeEach(() => {
    vi.mocked(usePatientStore).mockReturnValue(mockPatientStore)
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('患者が選択されていない場合、ホームページにリダイレクトする', async () => {
    render(<SimulationPage />)

    await waitFor(() => {
      expect(redirect).toHaveBeenCalledWith('/')
    })
  })

  it('患者が選択されている場合、ChatInterfaceコンポーネントを表示する', () => {
    const mockPatient = {
      id: 'patient-1',
      demographics: {
        name: '田中太郎',
        age: 45,
        gender: 'male' as const,
        dateOfBirth: '1978-01-01' as const,
      },
      chiefComplaint: '胸痛',
    }

    vi.mocked(usePatientStore).mockReturnValue({
      ...mockPatientStore,
      patients: { 'patient-1': mockPatient },
      activePatientId: 'patient-1',
    })

    render(<SimulationPage />)

    expect(screen.getByTestId('chat-interface')).toBeInTheDocument()
    expect(screen.getByText('Chat Interface Component')).toBeInTheDocument()
  })

  it('患者データ読み込み中の場合、ローディング状態を表示する', () => {
    vi.mocked(usePatientStore).mockReturnValue({
      ...mockPatientStore,
      activePatientId: 'patient-1',
      loading: true,
    })

    render(<SimulationPage />)

    expect(screen.getByText('シミュレーションを準備中...')).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('患者データ読み込みエラーの場合、エラーメッセージを表示する', () => {
    vi.mocked(usePatientStore).mockReturnValue({
      ...mockPatientStore,
      activePatientId: 'patient-1',
      error: 'データの読み込みに失敗しました',
    })

    render(<SimulationPage />)

    expect(screen.getByText('シミュレーションの開始に失敗しました')).toBeInTheDocument()
    expect(screen.getByText('データの読み込みに失敗しました')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ホームに戻る' })).toBeInTheDocument()
  })

  it('患者が存在するがデータが不完全な場合、リダイレクトする', async () => {
    vi.mocked(usePatientStore).mockReturnValue({
      ...mockPatientStore,
      patients: {}, // activePatientIdは設定されているが、実際の患者データが存在しない
      activePatientId: 'non-existent-patient',
    })

    render(<SimulationPage />)

    await waitFor(() => {
      expect(redirect).toHaveBeenCalledWith('/')
    })
  })

  it('適切なaria属性が設定されている', () => {
    const mockPatient = {
      id: 'patient-1',
      demographics: {
        name: '田中太郎',
        age: 45,
        gender: 'male' as const,
        dateOfBirth: '1978-01-01' as const,
      },
      chiefComplaint: '胸痛',
    }

    vi.mocked(usePatientStore).mockReturnValue({
      ...mockPatientStore,
      patients: { 'patient-1': mockPatient },
      activePatientId: 'patient-1',
    })

    render(<SimulationPage />)

    const container = screen.getByRole('region', { name: 'シミュレーション画面' })
    expect(container).toBeInTheDocument()
  })
})