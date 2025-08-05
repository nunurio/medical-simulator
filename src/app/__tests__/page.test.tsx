import React from 'react'
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import Home from '../page'

// PatientSetupFormのモック - Client Component のため
vi.mock('@/components/patient-setup/PatientSetupForm', () => {
  return {
    PatientSetupForm: function MockPatientSetupForm() {
      return <div data-testid="patient-setup-form">Patient Setup Form</div>
    }
  }
})

describe('Home Page', () => {
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
})