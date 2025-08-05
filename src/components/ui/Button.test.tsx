import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('デフォルトのプライマリボタンを表示する', () => {
    render(<Button>クリック</Button>)
    
    const button = screen.getByRole('button', { name: 'クリック' })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('bg-blue-600', 'text-white')
    expect(button).not.toBeDisabled()
  })

  it('セカンダリバリアントのボタンを表示する', () => {
    render(<Button variant="secondary">セカンダリ</Button>)
    
    const button = screen.getByRole('button', { name: 'セカンダリ' })
    expect(button).toHaveClass('bg-gray-200', 'text-gray-900')
  })

  it('アウトラインバリアントのボタンを表示する', () => {
    render(<Button variant="outline">アウトライン</Button>)
    
    const button = screen.getByRole('button', { name: 'アウトライン' })
    expect(button).toHaveClass('border-2', 'border-blue-600', 'text-blue-600')
  })

  it('小さいサイズのボタンを表示する', () => {
    render(<Button size="sm">小さい</Button>)
    
    const button = screen.getByRole('button', { name: '小さい' })
    expect(button).toHaveClass('px-3', 'py-1', 'text-sm')
  })

  it('中間サイズのボタンを表示する', () => {
    render(<Button size="md">中間</Button>)
    
    const button = screen.getByRole('button', { name: '中間' })
    expect(button).toHaveClass('px-4', 'py-2', 'text-base')
  })

  it('大きいサイズのボタンを表示する', () => {
    render(<Button size="lg">大きい</Button>)
    
    const button = screen.getByRole('button', { name: '大きい' })
    expect(button).toHaveClass('px-6', 'py-3', 'text-lg')
  })

  it('ローディング状態でスピナーを表示する', () => {
    render(<Button loading>ローディング</Button>)
    
    const button = screen.getByRole('button', { name: '読み込み中 ローディング' })
    expect(button).toBeDisabled()
    expect(screen.getByLabelText('読み込み中')).toBeInTheDocument()
  })

  it('無効化されたボタンが適切に動作する', () => {
    const handleClick = vi.fn()
    render(<Button disabled onClick={handleClick}>無効</Button>)
    
    const button = screen.getByRole('button', { name: '無効' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-disabled', 'true')
    
    fireEvent.click(button)
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('クリックイベントが正しく動作する', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>クリック</Button>)
    
    const button = screen.getByRole('button', { name: 'クリック' })
    await user.click(button)
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('カスタムクラス名が適用される', () => {
    render(<Button className="custom-class">カスタム</Button>)
    
    const button = screen.getByRole('button', { name: 'カスタム' })
    expect(button).toHaveClass('custom-class')
  })

  it('適切なフォーカス状態を持つ', () => {
    render(<Button>フォーカス</Button>)
    
    const button = screen.getByRole('button', { name: 'フォーカス' })
    button.focus()
    
    expect(button).toHaveFocus()
    expect(button).toHaveClass('focus:outline-none', 'focus:ring-2')
  })
})