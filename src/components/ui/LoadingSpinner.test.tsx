import React from 'react'
import { render, screen } from '@testing-library/react'
import { LoadingSpinner } from './LoadingSpinner'

describe('LoadingSpinner', () => {
  it('デフォルトサイズ（md）のスピナーを表示する', () => {
    render(<LoadingSpinner />)
    
    const spinner = screen.getByLabelText('読み込み中')
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveClass('h-6', 'w-6')
  })

  it('小さいサイズ（sm）のスピナーを表示する', () => {
    render(<LoadingSpinner size="sm" />)
    
    const spinner = screen.getByLabelText('読み込み中')
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveClass('h-4', 'w-4')
  })

  it('大きいサイズ（lg）のスピナーを表示する', () => {
    render(<LoadingSpinner size="lg" />)
    
    const spinner = screen.getByLabelText('読み込み中')
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveClass('h-8', 'w-8')
  })

  it('アニメーションクラスが適用されている', () => {
    render(<LoadingSpinner />)
    
    const spinner = screen.getByLabelText('読み込み中')
    expect(spinner).toHaveClass('animate-spin')
  })

  it('適切なrole属性が設定されている', () => {
    render(<LoadingSpinner />)
    
    const spinner = screen.getByRole('status')
    expect(spinner).toBeInTheDocument()
  })
})